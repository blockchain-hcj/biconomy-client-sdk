"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DANSessionKeyManagerModule = void 0;
const merkletreejs_1 = require("merkletreejs");
const viem_1 = require("viem");
const account_1 = require("../account/index.js");
const BaseValidationModule_js_1 = require("./BaseValidationModule.js");
const index_js_1 = require("./index.js");
const SessionLocalStorage_js_1 = require("./session-storage/SessionLocalStorage.js");
const SessionMemoryStorage_js_1 = require("./session-storage/SessionMemoryStorage.js");
const Constants_js_1 = require("./utils/Constants.js");
const Types_js_1 = require("./utils/Types.js");
const Uid_js_1 = require("./utils/Uid.js");
class DANSessionKeyManagerModule extends BaseValidationModule_js_1.BaseValidationModule {
    constructor(moduleConfig) {
        super(moduleConfig);
        Object.defineProperty(this, "version", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "V1_0_0"
        });
        Object.defineProperty(this, "moduleAddress", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "merkleTree", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "sessionStorageClient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "mockEcdsaSessionKeySig", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "0x73c3ac716c487ca34bb858247b5ccf1dc354fbaabdd089af3b2ac8e78ba85a4959a2d76250325bd67c11771c31fccda87c33ceec17cc0de912690521bb95ffcb1b"
        });
        Object.defineProperty(this, "createSessionData", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (leavesData) => {
                const sessionKeyManagerModuleABI = (0, viem_1.parseAbi)([
                    "function setMerkleRoot(bytes32 _merkleRoot)"
                ]);
                const leavesToAdd = [];
                const sessionIDInfo = [];
                for (const leafData of leavesData) {
                    const leafDataHex = (0, viem_1.concat)([
                        (0, viem_1.pad)((0, viem_1.toHex)(leafData.validUntil), { size: 6 }),
                        (0, viem_1.pad)((0, viem_1.toHex)(leafData.validAfter), { size: 6 }),
                        (0, viem_1.pad)(leafData.sessionValidationModule, { size: 20 }),
                        leafData.sessionKeyData
                    ]);
                    const generatedSessionId = leafData.preferredSessionId ?? (0, Uid_js_1.generateRandomHex)();
                    leavesToAdd.push((0, viem_1.keccak256)(leafDataHex));
                    sessionIDInfo.push(generatedSessionId);
                    const sessionLeafNode = {
                        ...leafData,
                        sessionID: generatedSessionId,
                        status: "PENDING"
                    };
                    await this.sessionStorageClient.addSessionData(sessionLeafNode);
                }
                this.merkleTree.addLeaves(leavesToAdd);
                const leaves = this.merkleTree.getLeaves();
                const newMerkleTree = new merkletreejs_1.MerkleTree(leaves, viem_1.keccak256, {
                    sortPairs: true,
                    hashLeaves: false
                });
                this.merkleTree = newMerkleTree;
                const setMerkleRootData = (0, viem_1.encodeFunctionData)({
                    abi: sessionKeyManagerModuleABI,
                    functionName: "setMerkleRoot",
                    args: [this.merkleTree.getHexRoot()]
                });
                await this.sessionStorageClient.setMerkleRoot(this.merkleTree.getHexRoot());
                return {
                    data: setMerkleRootData,
                    sessionIDInfo: sessionIDInfo
                };
            }
        });
    }
    static async create(moduleConfig) {
        const instance = new DANSessionKeyManagerModule(moduleConfig);
        if (moduleConfig.moduleAddress) {
            instance.moduleAddress = moduleConfig.moduleAddress;
        }
        else if (moduleConfig.version) {
            const moduleAddr = Constants_js_1.SESSION_MANAGER_MODULE_ADDRESSES_BY_VERSION[moduleConfig.version];
            if (!moduleAddr) {
                throw new Error(`Invalid version ${moduleConfig.version}`);
            }
            instance.moduleAddress = moduleAddr;
            instance.version = moduleConfig.version;
        }
        else {
            instance.moduleAddress = Constants_js_1.DEFAULT_SESSION_KEY_MANAGER_MODULE;
        }
        if (moduleConfig.sessionStorageClient) {
            instance.sessionStorageClient = moduleConfig.sessionStorageClient;
        }
        else {
            switch (moduleConfig.storageType) {
                case Types_js_1.StorageType.MEMORY_STORAGE:
                    instance.sessionStorageClient = new SessionMemoryStorage_js_1.SessionMemoryStorage(moduleConfig.smartAccountAddress);
                    break;
                case Types_js_1.StorageType.LOCAL_STORAGE:
                    instance.sessionStorageClient = new SessionLocalStorage_js_1.SessionLocalStorage(moduleConfig.smartAccountAddress);
                    break;
                default:
                    instance.sessionStorageClient = new SessionLocalStorage_js_1.SessionLocalStorage(moduleConfig.smartAccountAddress);
            }
        }
        const existingSessionData = await instance.sessionStorageClient.getAllSessionData();
        const existingSessionDataLeafs = existingSessionData.map((sessionData) => {
            const leafDataHex = (0, viem_1.concat)([
                (0, viem_1.pad)((0, viem_1.toHex)(sessionData.validUntil), { size: 6 }),
                (0, viem_1.pad)((0, viem_1.toHex)(sessionData.validAfter), { size: 6 }),
                (0, viem_1.pad)(sessionData.sessionValidationModule, { size: 20 }),
                sessionData.sessionKeyData
            ]);
            return (0, viem_1.keccak256)(leafDataHex);
        });
        instance.merkleTree = new merkletreejs_1.MerkleTree(existingSessionDataLeafs, viem_1.keccak256, {
            sortPairs: true,
            hashLeaves: false
        });
        return instance;
    }
    async signUserOpHash(_, { sessionID, rawUserOperation, additionalSessionData }) {
        const sessionSignerData = await this.getLeafInfo({ sessionID });
        if (!rawUserOperation)
            throw new Error("Missing userOperation");
        if (!sessionID)
            throw new Error("Missing sessionID");
        if (!sessionSignerData.danModuleInfo)
            throw new Error("Missing danModuleInfo");
        if (!rawUserOperation.verificationGasLimit ||
            !rawUserOperation.callGasLimit ||
            !rawUserOperation.callData ||
            !rawUserOperation.paymasterAndData ||
            !rawUserOperation.initCode) {
            throw new Error("Missing params from User operation");
        }
        const userOpTemp = {
            ...rawUserOperation,
            verificationGasLimit: rawUserOperation.verificationGasLimit.toString(),
            callGasLimit: rawUserOperation.callGasLimit.toString(),
            callData: rawUserOperation.callData.slice(2),
            paymasterAndData: rawUserOperation.paymasterAndData.slice(2),
            initCode: String(rawUserOperation.initCode).slice(2)
        };
        const objectToSign = {
            userOperation: userOpTemp,
            entryPointVersion: "v0.6.0",
            entryPointAddress: account_1.DEFAULT_ENTRYPOINT_ADDRESS,
            chainId: sessionSignerData.danModuleInfo.chainId
        };
        const messageToSign = JSON.stringify(objectToSign);
        const signature = await index_js_1.danSDK.signMessage(messageToSign, sessionSignerData.danModuleInfo);
        const leafDataHex = (0, viem_1.concat)([
            (0, viem_1.pad)((0, viem_1.toHex)(sessionSignerData.validUntil), { size: 6 }),
            (0, viem_1.pad)((0, viem_1.toHex)(sessionSignerData.validAfter), { size: 6 }),
            (0, viem_1.pad)(sessionSignerData.sessionValidationModule, { size: 20 }),
            sessionSignerData.sessionKeyData
        ]);
        let paddedSignature = (0, viem_1.encodeAbiParameters)((0, viem_1.parseAbiParameters)("uint48, uint48, address, bytes, bytes32[], bytes"), [
            sessionSignerData.validUntil,
            sessionSignerData.validAfter,
            sessionSignerData.sessionValidationModule,
            sessionSignerData.sessionKeyData,
            this.merkleTree.getHexProof((0, viem_1.keccak256)(leafDataHex)),
            signature
        ]);
        if (additionalSessionData) {
            paddedSignature += additionalSessionData;
        }
        return paddedSignature;
    }
    async getLeafInfo(params) {
        if (params?.sessionID) {
            const matchedDatum = await this.sessionStorageClient.getSessionData({
                sessionID: params.sessionID
            });
            if (matchedDatum) {
                return matchedDatum;
            }
        }
        throw new Error("Session data not found");
    }
    async updateSessionStatus(param, status) {
        this.sessionStorageClient.updateSessionStatus(param, status);
    }
    async clearPendingSessions() {
        this.sessionStorageClient.clearPendingSessions();
    }
    getAddress() {
        return this.moduleAddress;
    }
    async getSigner() {
        throw new Error("Method not implemented.");
    }
    async getDummySignature(params) {
        if (!params) {
            throw new Error("Params must be provided.");
        }
        const sessionSignerData = await this.getLeafInfo(params);
        const leafDataHex = (0, viem_1.concat)([
            (0, viem_1.pad)((0, viem_1.toHex)(sessionSignerData.validUntil), { size: 6 }),
            (0, viem_1.pad)((0, viem_1.toHex)(sessionSignerData.validAfter), { size: 6 }),
            (0, viem_1.pad)(sessionSignerData.sessionValidationModule, { size: 20 }),
            sessionSignerData.sessionKeyData
        ]);
        let paddedSignature = (0, viem_1.encodeAbiParameters)((0, viem_1.parseAbiParameters)("uint48, uint48, address, bytes, bytes32[], bytes"), [
            sessionSignerData.validUntil,
            sessionSignerData.validAfter,
            sessionSignerData.sessionValidationModule,
            sessionSignerData.sessionKeyData,
            this.merkleTree.getHexProof((0, viem_1.keccak256)(leafDataHex)),
            this.mockEcdsaSessionKeySig
        ]);
        if (params?.additionalSessionData) {
            paddedSignature += params.additionalSessionData;
        }
        const dummySig = (0, viem_1.encodeAbiParameters)((0, viem_1.parseAbiParameters)(["bytes, address"]), [paddedSignature, this.getAddress()]);
        return dummySig;
    }
    async getInitData() {
        throw new Error("Method not implemented.");
    }
    async signMessage(_message) {
        throw new Error("Method not implemented.");
    }
}
exports.DANSessionKeyManagerModule = DANSessionKeyManagerModule;
//# sourceMappingURL=DANSessionKeyManagerModule.js.map