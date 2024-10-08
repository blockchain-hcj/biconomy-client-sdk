"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bundler = void 0;
const viem_1 = require("viem");
const account_1 = require("../account/index.js");
const Constants_js_1 = require("./utils/Constants.js");
const HelperFunction_js_1 = require("./utils/HelperFunction.js");
const Utils_js_1 = require("./utils/Utils.js");
class Bundler {
    constructor(bundlerConfig) {
        Object.defineProperty(this, "bundlerConfig", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
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
            (0, Utils_js_1.extractChainIdFromBundlerUrl)(bundlerConfig.bundlerUrl);
        this.bundlerConfig = { ...bundlerConfig, chainId: parsedChainId };
        this.provider = (0, viem_1.createPublicClient)({
            chain: bundlerConfig.viemChain ??
                bundlerConfig.customChain ??
                (0, account_1.getChain)(parsedChainId),
            transport: (0, viem_1.http)((bundlerConfig.viemChain ||
                bundlerConfig.customChain ||
                (0, account_1.getChain)(parsedChainId)).rpcUrls.default.http[0])
        });
        this.UserOpReceiptIntervals = {
            ...Constants_js_1.UserOpReceiptIntervals,
            ...bundlerConfig.userOpReceiptIntervals
        };
        this.UserOpWaitForTxHashIntervals = {
            ...Constants_js_1.UserOpWaitForTxHashIntervals,
            ...bundlerConfig.userOpWaitForTxHashIntervals
        };
        this.UserOpReceiptMaxDurationIntervals = {
            ...Constants_js_1.UserOpReceiptMaxDurationIntervals,
            ...bundlerConfig.userOpReceiptMaxDurationIntervals
        };
        this.UserOpWaitForTxHashMaxDurationIntervals = {
            ...Constants_js_1.UserOpWaitForTxHashMaxDurationIntervals,
            ...bundlerConfig.userOpWaitForTxHashMaxDurationIntervals
        };
        this.bundlerConfig.entryPointAddress =
            bundlerConfig.entryPointAddress || Constants_js_1.DEFAULT_ENTRYPOINT_ADDRESS;
    }
    getBundlerUrl() {
        return `${this.bundlerConfig.bundlerUrl}`;
    }
    async estimateUserOpGas(_userOp, stateOverrideSet) {
        const userOp = (0, HelperFunction_js_1.transformUserOP)(_userOp);
        const bundlerUrl = this.getBundlerUrl();
        const response = await (0, account_1.sendRequest)({
            url: bundlerUrl,
            method: account_1.HttpMethod.Post,
            body: {
                method: "eth_estimateUserOperationGas",
                params: stateOverrideSet
                    ? [userOp, this.bundlerConfig.entryPointAddress, stateOverrideSet]
                    : [userOp, this.bundlerConfig.entryPointAddress],
                id: (0, HelperFunction_js_1.getTimestampInSeconds)(),
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
    async sendUserOp(_userOp, simulationParam) {
        const chainId = this.bundlerConfig.chainId;
        const userOp = (0, HelperFunction_js_1.transformUserOP)(_userOp);
        const simType = {
            simulation_type: simulationParam || "validation"
        };
        const params = [userOp, this.bundlerConfig.entryPointAddress, simType];
        const bundlerUrl = this.getBundlerUrl();
        const sendUserOperationResponse = await (0, account_1.sendRequest)({
            url: bundlerUrl,
            method: account_1.HttpMethod.Post,
            body: {
                method: "eth_sendUserOperation",
                params: params,
                id: (0, HelperFunction_js_1.getTimestampInSeconds)(),
                jsonrpc: "2.0"
            }
        }, "Bundler");
        const response = {
            userOpHash: sendUserOperationResponse.result,
            wait: (confirmations) => {
                const maxDuration = this.UserOpReceiptMaxDurationIntervals[chainId] || 30000;
                let totalDuration = 0;
                return new Promise((resolve, reject) => {
                    const intervalValue = this.UserOpReceiptIntervals[chainId] || 5000;
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
                const maxDuration = this.UserOpWaitForTxHashMaxDurationIntervals[chainId] || 20000;
                let totalDuration = 0;
                return new Promise((resolve, reject) => {
                    const intervalValue = this.UserOpWaitForTxHashIntervals[chainId] || 500;
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
    async getUserOpReceipt(userOpHash) {
        const bundlerUrl = this.getBundlerUrl();
        const response = await (0, account_1.sendRequest)({
            url: bundlerUrl,
            method: account_1.HttpMethod.Post,
            body: {
                method: "eth_getUserOperationReceipt",
                params: [userOpHash],
                id: (0, HelperFunction_js_1.getTimestampInSeconds)(),
                jsonrpc: "2.0"
            }
        }, "Bundler");
        const userOpReceipt = response.result;
        return userOpReceipt;
    }
    async getUserOpStatus(userOpHash) {
        const bundlerUrl = this.getBundlerUrl();
        const response = await (0, account_1.sendRequest)({
            url: bundlerUrl,
            method: account_1.HttpMethod.Post,
            body: {
                method: "biconomy_getUserOperationStatus",
                params: [userOpHash],
                id: (0, HelperFunction_js_1.getTimestampInSeconds)(),
                jsonrpc: "2.0"
            }
        }, "Bundler");
        const userOpStatus = response.result;
        return userOpStatus;
    }
    async getUserOpByHash(userOpHash) {
        const bundlerUrl = this.getBundlerUrl();
        const response = await (0, account_1.sendRequest)({
            url: bundlerUrl,
            method: account_1.HttpMethod.Post,
            body: {
                method: "eth_getUserOperationByHash",
                params: [userOpHash],
                id: (0, HelperFunction_js_1.getTimestampInSeconds)(),
                jsonrpc: "2.0"
            }
        }, "Bundler");
        const userOpByHashResponse = response.result;
        return userOpByHashResponse;
    }
    async getGasFeeValues() {
        const bundlerUrl = this.getBundlerUrl();
        const response = await (0, account_1.sendRequest)({
            url: bundlerUrl,
            method: account_1.HttpMethod.Post,
            body: {
                method: "biconomy_getGasFeeValues",
                params: [],
                id: (0, HelperFunction_js_1.getTimestampInSeconds)(),
                jsonrpc: "2.0"
            }
        }, "Bundler");
        return response.result;
    }
    static async create(config) {
        return new Bundler(config);
    }
}
exports.Bundler = Bundler;
//# sourceMappingURL=Bundler.js.map