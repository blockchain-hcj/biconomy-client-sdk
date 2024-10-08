import { encodeAbiParameters, isAddress, keccak256, parseAbiParameters } from "viem";
import { generatePrivateKey, privateKeyToAccount, } from "viem/accounts";
import { ERROR_MESSAGES, getChain } from "../../account/index.js";
import { getDefaultStorageClient } from "../session-storage/utils.js";
function packUserOp(op, forSignature = true) {
    if (!op.initCode || !op.callData || !op.paymasterAndData)
        throw new Error("Missing userOp properties");
    if (forSignature) {
        return encodeAbiParameters(parseAbiParameters("address, uint256, bytes32, bytes32, uint256, uint256, uint256, uint256, uint256, bytes32"), [
            op.sender,
            BigInt(op.nonce),
            keccak256(op.initCode),
            keccak256(op.callData),
            BigInt(op.callGasLimit),
            BigInt(op.verificationGasLimit),
            BigInt(op.preVerificationGas),
            BigInt(op.maxFeePerGas),
            BigInt(op.maxPriorityFeePerGas),
            keccak256(op.paymasterAndData)
        ]);
    }
    // for the purpose of calculating gas cost encode also signature (and no keccak of bytes)
    return encodeAbiParameters(parseAbiParameters("address, uint256, bytes, bytes, uint256, uint256, uint256, uint256, uint256, bytes, bytes"), [
        op.sender,
        BigInt(op.nonce),
        op.initCode,
        op.callData,
        BigInt(op.callGasLimit),
        BigInt(op.verificationGasLimit),
        BigInt(op.preVerificationGas),
        BigInt(op.maxFeePerGas),
        BigInt(op.maxPriorityFeePerGas),
        op.paymasterAndData,
        op.signature
    ]);
}
export const getUserOpHash = (userOp, entryPointAddress, chainId) => {
    const userOpHash = keccak256(packUserOp(userOp, true));
    const enc = encodeAbiParameters(parseAbiParameters("bytes32, address, uint256"), [userOpHash, entryPointAddress, BigInt(chainId)]);
    return keccak256(enc);
};
export const getRandomSigner = () => {
    const pkey = generatePrivateKey();
    const account = privateKeyToAccount(pkey);
    return {
        pvKey: pkey,
        pbKey: account.address
    };
};
export const parseChain = (chainInfo) => {
    if (typeof chainInfo === "number")
        return getChain(chainInfo);
    return chainInfo;
};
export const didProvideFullSession = (searchParam) => !!searchParam?.sessionIDInfo?.length;
/**
 *
 * reconstructSession - Reconstructs a session object from the provided arguments
 *
 * If a session object is provided, it is returned as is
 * If a session storage client is provided, the session object is reconstructed from the session storage client using **all** of the sessionIds found in the storage client
 * If a smart account address is provided, the default session storage client is used to reconstruct the session object using **all** of the sessionIds found in the storage client
 *
 * @param searchParam - This can be a session object {@link Session}, a session storage client {@link ISessionStorage} or a smart account address {@link Address}
 * @returns A session object
 * @error If the provided arguments do not match any of the above cases
 */
export const resumeSession = async (searchParam) => {
    const providedFullSession = didProvideFullSession(searchParam);
    const providedStorageClient = !!searchParam
        .smartAccountAddress?.length;
    const providedSmartAccountAddress = isAddress(searchParam);
    if (providedFullSession) {
        const session = searchParam;
        return session;
    }
    if (providedStorageClient) {
        const sessionStorageClient = searchParam;
        const leafArray = await sessionStorageClient.getAllSessionData();
        const sessionIDInfo = leafArray.map(({ sessionID }) => sessionID);
        const session = {
            sessionIDInfo,
            sessionStorageClient
        };
        return session;
    }
    if (providedSmartAccountAddress) {
        const smartAccountAddress = searchParam;
        // Use the default session storage client
        const sessionStorageClient = getDefaultStorageClient(smartAccountAddress);
        const leafArray = await sessionStorageClient.getAllSessionData();
        const sessionIDInfo = leafArray.map(({ sessionID }) => sessionID);
        const session = {
            sessionIDInfo,
            sessionStorageClient
        };
        return session;
    }
    throw new Error(ERROR_MESSAGES.UNKNOW_SESSION_ARGUMENTS);
};
export const hexToUint8Array = (hex) => {
    if (hex.length % 2 !== 0) {
        throw new Error("Hex string must have an even number of characters");
    }
    const array = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        array[i / 2] = Number.parseInt(hex.substr(i, 2), 16);
    }
    return array;
};
// Sign data using the secret key stored on Browser Wallet
// It creates a popup window, presenting the human readable form of `request`
// Throws an error if User rejected signature
export class BrowserWallet {
    constructor(provider) {
        Object.defineProperty(this, "provider", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.provider = provider;
    }
    async signTypedData(from, request) {
        return await this.provider.request({
            method: "eth_signTypedData_v4",
            // @ts-ignore
            params: [from, JSON.stringify(request)]
        });
    }
}
// Sign data using the secret key stored on Browser Wallet
// It creates a popup window, presenting the human readable form of `request`
// Throws an error if User rejected signature
export class NodeWallet {
    constructor(walletClient) {
        Object.defineProperty(this, "walletClient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.walletClient = walletClient;
    }
    async signTypedData(_, request) {
        // @ts-ignore
        return await this.walletClient.signTypedData(request);
    }
}
//# sourceMappingURL=Helper.js.map