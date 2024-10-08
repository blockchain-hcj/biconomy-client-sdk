"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeWallet = exports.BrowserWallet = exports.hexToUint8Array = exports.resumeSession = exports.didProvideFullSession = exports.parseChain = exports.getRandomSigner = exports.getUserOpHash = void 0;
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const account_1 = require("../../account/index.js");
const utils_1 = require("../session-storage/utils.js");
function packUserOp(op, forSignature = true) {
    if (!op.initCode || !op.callData || !op.paymasterAndData)
        throw new Error("Missing userOp properties");
    if (forSignature) {
        return (0, viem_1.encodeAbiParameters)((0, viem_1.parseAbiParameters)("address, uint256, bytes32, bytes32, uint256, uint256, uint256, uint256, uint256, bytes32"), [
            op.sender,
            BigInt(op.nonce),
            (0, viem_1.keccak256)(op.initCode),
            (0, viem_1.keccak256)(op.callData),
            BigInt(op.callGasLimit),
            BigInt(op.verificationGasLimit),
            BigInt(op.preVerificationGas),
            BigInt(op.maxFeePerGas),
            BigInt(op.maxPriorityFeePerGas),
            (0, viem_1.keccak256)(op.paymasterAndData)
        ]);
    }
    return (0, viem_1.encodeAbiParameters)((0, viem_1.parseAbiParameters)("address, uint256, bytes, bytes, uint256, uint256, uint256, uint256, uint256, bytes, bytes"), [
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
const getUserOpHash = (userOp, entryPointAddress, chainId) => {
    const userOpHash = (0, viem_1.keccak256)(packUserOp(userOp, true));
    const enc = (0, viem_1.encodeAbiParameters)((0, viem_1.parseAbiParameters)("bytes32, address, uint256"), [userOpHash, entryPointAddress, BigInt(chainId)]);
    return (0, viem_1.keccak256)(enc);
};
exports.getUserOpHash = getUserOpHash;
const getRandomSigner = () => {
    const pkey = (0, accounts_1.generatePrivateKey)();
    const account = (0, accounts_1.privateKeyToAccount)(pkey);
    return {
        pvKey: pkey,
        pbKey: account.address
    };
};
exports.getRandomSigner = getRandomSigner;
const parseChain = (chainInfo) => {
    if (typeof chainInfo === "number")
        return (0, account_1.getChain)(chainInfo);
    return chainInfo;
};
exports.parseChain = parseChain;
const didProvideFullSession = (searchParam) => !!searchParam?.sessionIDInfo?.length;
exports.didProvideFullSession = didProvideFullSession;
const resumeSession = async (searchParam) => {
    const providedFullSession = (0, exports.didProvideFullSession)(searchParam);
    const providedStorageClient = !!searchParam
        .smartAccountAddress?.length;
    const providedSmartAccountAddress = (0, viem_1.isAddress)(searchParam);
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
        const sessionStorageClient = (0, utils_1.getDefaultStorageClient)(smartAccountAddress);
        const leafArray = await sessionStorageClient.getAllSessionData();
        const sessionIDInfo = leafArray.map(({ sessionID }) => sessionID);
        const session = {
            sessionIDInfo,
            sessionStorageClient
        };
        return session;
    }
    throw new Error(account_1.ERROR_MESSAGES.UNKNOW_SESSION_ARGUMENTS);
};
exports.resumeSession = resumeSession;
const hexToUint8Array = (hex) => {
    if (hex.length % 2 !== 0) {
        throw new Error("Hex string must have an even number of characters");
    }
    const array = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        array[i / 2] = Number.parseInt(hex.substr(i, 2), 16);
    }
    return array;
};
exports.hexToUint8Array = hexToUint8Array;
class BrowserWallet {
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
            params: [from, JSON.stringify(request)]
        });
    }
}
exports.BrowserWallet = BrowserWallet;
class NodeWallet {
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
        return await this.walletClient.signTypedData(request);
    }
}
exports.NodeWallet = NodeWallet;
//# sourceMappingURL=Helper.js.map