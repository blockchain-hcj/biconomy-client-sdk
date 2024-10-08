import { http, createPublicClient } from "viem";
import { HttpMethod, getChain, sendRequest } from "../account/index.js";
import { DEFAULT_ENTRYPOINT_ADDRESS, UserOpReceiptIntervals, UserOpReceiptMaxDurationIntervals, UserOpWaitForTxHashIntervals, UserOpWaitForTxHashMaxDurationIntervals } from "./utils/Constants.js";
import { getTimestampInSeconds, transformUserOP } from "./utils/HelperFunction.js";
import { extractChainIdFromBundlerUrl } from "./utils/Utils.js";
/**
 * This class implements IBundler interface.
 * Implementation sends UserOperation to a bundler URL as per ERC4337 standard.
 * Checkout the proposal for more details on Bundlers.
 */
export class Bundler {
    constructor(bundlerConfig) {
        Object.defineProperty(this, "bundlerConfig", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // eslint-disable-next-line no-unused-vars
        Object.defineProperty(this, "UserOpReceiptIntervals", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "UserOpWaitForTxHashIntervals", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "UserOpReceiptMaxDurationIntervals", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "UserOpWaitForTxHashMaxDurationIntervals", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "provider", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const parsedChainId = bundlerConfig?.chainId ||
            extractChainIdFromBundlerUrl(bundlerConfig.bundlerUrl);
        this.bundlerConfig = { ...bundlerConfig, chainId: parsedChainId };
        this.provider = createPublicClient({
            chain: bundlerConfig.viemChain ??
                bundlerConfig.customChain ??
                getChain(parsedChainId),
            transport: http((bundlerConfig.viemChain ||
                bundlerConfig.customChain ||
                getChain(parsedChainId)).rpcUrls.default.http[0])
        });
        this.UserOpReceiptIntervals = {
            ...UserOpReceiptIntervals,
            ...bundlerConfig.userOpReceiptIntervals
        };
        this.UserOpWaitForTxHashIntervals = {
            ...UserOpWaitForTxHashIntervals,
            ...bundlerConfig.userOpWaitForTxHashIntervals
        };
        this.UserOpReceiptMaxDurationIntervals = {
            ...UserOpReceiptMaxDurationIntervals,
            ...bundlerConfig.userOpReceiptMaxDurationIntervals
        };
        this.UserOpWaitForTxHashMaxDurationIntervals = {
            ...UserOpWaitForTxHashMaxDurationIntervals,
            ...bundlerConfig.userOpWaitForTxHashMaxDurationIntervals
        };
        this.bundlerConfig.entryPointAddress =
            bundlerConfig.entryPointAddress || DEFAULT_ENTRYPOINT_ADDRESS;
    }
    getBundlerUrl() {
        return `${this.bundlerConfig.bundlerUrl}`;
    }
    /**
     * @param userOpHash
     * @description This function will fetch gasPrices from bundler
     * @returns Promise<UserOpGasPricesResponse>
     */
    async estimateUserOpGas(_userOp, stateOverrideSet) {
        // expected dummySig and possibly dummmy paymasterAndData should be provided by the caller
        // bundler doesn't know account and paymaster implementation
        const userOp = transformUserOP(_userOp);
        const bundlerUrl = this.getBundlerUrl();
        const response = await sendRequest({
            url: bundlerUrl,
            method: HttpMethod.Post,
            body: {
                method: "eth_estimateUserOperationGas",
                params: stateOverrideSet
                    ? [userOp, this.bundlerConfig.entryPointAddress, stateOverrideSet]
                    : [userOp, this.bundlerConfig.entryPointAddress],
                id: getTimestampInSeconds(),
                jsonrpc: "2.0"
            }
        }, "Bundler");
        const userOpGasResponse = response.result;
        for (const key in userOpGasResponse) {
            if (key === "maxFeePerGas" || key === "maxPriorityFeePerGas")
                continue;
            if (userOpGasResponse[key] === undefined ||
                userOpGasResponse[key] === null) {
                throw new Error(`Got undefined ${key} from bundler`);
            }
        }
        return userOpGasResponse;
    }
    /**
     *
     * @param userOp
     * @description This function will send signed userOp to bundler to get mined on chain
     * @returns Promise<UserOpResponse>
     */
    async sendUserOp(_userOp, simulationParam) {
        const chainId = this.bundlerConfig.chainId;
        // transformUserOP will convert all bigNumber values to string
        const userOp = transformUserOP(_userOp);
        const simType = {
            simulation_type: simulationParam || "validation"
        };
        const params = [userOp, this.bundlerConfig.entryPointAddress, simType];
        const bundlerUrl = this.getBundlerUrl();
        const sendUserOperationResponse = await sendRequest({
            url: bundlerUrl,
            method: HttpMethod.Post,
            body: {
                method: "eth_sendUserOperation",
                params: params,
                id: getTimestampInSeconds(),
                jsonrpc: "2.0"
            }
        }, "Bundler");
        const response = {
            userOpHash: sendUserOperationResponse.result,
            wait: (confirmations) => {
                // Note: maxDuration can be defined per chainId
                const maxDuration = this.UserOpReceiptMaxDurationIntervals[chainId] || 30000; // default 30 seconds
                let totalDuration = 0;
                return new Promise((resolve, reject) => {
                    const intervalValue = this.UserOpReceiptIntervals[chainId] || 5000; // default 5 seconds
                    const intervalId = setInterval(async () => {
                        try {
                            const userOpResponse = await this.getUserOpReceipt(sendUserOperationResponse.result);
                            if (userOpResponse?.receipt?.blockNumber) {
                                if (confirmations) {
                                    const latestBlock = await this.provider.getBlockNumber();
                                    const confirmedBlocks = Number(latestBlock) - userOpResponse.receipt.blockNumber;
                                    if (confirmations >= confirmedBlocks) {
                                        clearInterval(intervalId);
                                        resolve(userOpResponse);
                                        return;
                                    }
                                }
                                else {
                                    clearInterval(intervalId);
                                    resolve(userOpResponse);
                                    return;
                                }
                            }
                        }
                        catch (error) {
                            clearInterval(intervalId);
                            reject(error);
                            return;
                        }
                        totalDuration += intervalValue;
                        if (totalDuration >= maxDuration) {
                            clearInterval(intervalId);
                            reject(new Error(`Exceeded maximum duration (${maxDuration / 1000} sec) waiting to get receipt for userOpHash ${sendUserOperationResponse.result}. Try getting the receipt manually using eth_getUserOperationReceipt rpc method on bundler`));
                        }
                    }, intervalValue);
                });
            },
            waitForTxHash: () => {
                const maxDuration = this.UserOpWaitForTxHashMaxDurationIntervals[chainId] || 20000; // default 20 seconds
                let totalDuration = 0;
                return new Promise((resolve, reject) => {
                    const intervalValue = this.UserOpWaitForTxHashIntervals[chainId] || 500; // default 0.5 seconds
                    const intervalId = setInterval(async () => {
                        try {
                            const userOpStatus = await this.getUserOpStatus(sendUserOperationResponse.result);
                            if (userOpStatus?.state && userOpStatus.transactionHash) {
                                clearInterval(intervalId);
                                resolve(userOpStatus);
                                return;
                            }
                        }
                        catch (error) {
                            clearInterval(intervalId);
                            reject(error);
                            return;
                        }
                        totalDuration += intervalValue;
                        if (totalDuration >= maxDuration) {
                            clearInterval(intervalId);
                            reject(new Error(`Exceeded maximum duration (${maxDuration / 1000} sec) waiting to get receipt for userOpHash ${sendUserOperationResponse.result}. Try getting the receipt manually using eth_getUserOperationReceipt rpc method on bundler`));
                        }
                    }, intervalValue);
                });
            }
        };
        return response;
    }
    /**
     *
     * @param userOpHash
     * @description This function will return userOpReceipt for a given userOpHash
     * @returns Promise<UserOpReceipt>
     */
    async getUserOpReceipt(userOpHash) {
        const bundlerUrl = this.getBundlerUrl();
        const response = await sendRequest({
            url: bundlerUrl,
            method: HttpMethod.Post,
            body: {
                method: "eth_getUserOperationReceipt",
                params: [userOpHash],
                id: getTimestampInSeconds(),
                jsonrpc: "2.0"
            }
        }, "Bundler");
        const userOpReceipt = response.result;
        return userOpReceipt;
    }
    /**
     *
     * @param userOpHash
     * @description This function will return userOpReceipt for a given userOpHash
     * @returns Promise<UserOpReceipt>
     */
    async getUserOpStatus(userOpHash) {
        const bundlerUrl = this.getBundlerUrl();
        const response = await sendRequest({
            url: bundlerUrl,
            method: HttpMethod.Post,
            body: {
                method: "biconomy_getUserOperationStatus",
                params: [userOpHash],
                id: getTimestampInSeconds(),
                jsonrpc: "2.0"
            }
        }, "Bundler");
        const userOpStatus = response.result;
        return userOpStatus;
    }
    /**
     *
     * @param userOpHash
     * @description this function will return UserOpByHashResponse for given UserOpHash
     * @returns Promise<UserOpByHashResponse>
     */
    async getUserOpByHash(userOpHash) {
        const bundlerUrl = this.getBundlerUrl();
        const response = await sendRequest({
            url: bundlerUrl,
            method: HttpMethod.Post,
            body: {
                method: "eth_getUserOperationByHash",
                params: [userOpHash],
                id: getTimestampInSeconds(),
                jsonrpc: "2.0"
            }
        }, "Bundler");
        const userOpByHashResponse = response.result;
        return userOpByHashResponse;
    }
    /**
     * @description This function will return the gas fee values
     */
    async getGasFeeValues() {
        const bundlerUrl = this.getBundlerUrl();
        const response = await sendRequest({
            url: bundlerUrl,
            method: HttpMethod.Post,
            body: {
                method: "biconomy_getGasFeeValues",
                params: [],
                id: getTimestampInSeconds(),
                jsonrpc: "2.0"
            }
        }, "Bundler");
        return response.result;
    }
    static async create(config) {
        return new Bundler(config);
    }
}
//# sourceMappingURL=Bundler.js.map