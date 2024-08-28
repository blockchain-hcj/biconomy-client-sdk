import { MerkleTree } from "merkletreejs";
import { concat, encodeAbiParameters, encodeFunctionData, keccak256, pad, parseAbi, parseAbiParameters, 
// toBytes,
toHex } from "viem";
import { DEFAULT_ENTRYPOINT_ADDRESS } from "../account/index.js";
import { BaseValidationModule } from "./BaseValidationModule.js";
import { danSDK } from "./index.js";
import { SessionLocalStorage } from "./session-storage/SessionLocalStorage.js";
import { SessionMemoryStorage } from "./session-storage/SessionMemoryStorage.js";
import { DEFAULT_SESSION_KEY_MANAGER_MODULE, SESSION_MANAGER_MODULE_ADDRESSES_BY_VERSION } from "./utils/Constants.js";
import { StorageType } from "./utils/Types.js";
import { generateRandomHex } from "./utils/Uid.js";
export class DANSessionKeyManagerModule extends BaseValidationModule {
    /**
     * This constructor is private. Use the static create method to instantiate SessionKeyManagerModule
     * @param moduleConfig The configuration for the module
     * @returns An instance of SessionKeyManagerModule
     */
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
        /**
         * Method to create session data for any module. The session data is used to create a leaf in the merkle tree
         * @param leavesData The data of one or more leaves to be used to create session data
         * @returns The session data
         */
        Object.defineProperty(this, "createSessionData", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (leavesData) => {
                const sessionKeyManagerModuleABI = parseAbi([
                    "function setMerkleRoot(bytes32 _merkleRoot)"
                ]);
                const leavesToAdd = [];
                const sessionIDInfo = [];
                for (const leafData of leavesData) {
                    const leafDataHex = concat([
                        pad(toHex(leafData.validUntil), { size: 6 }),
                        pad(toHex(leafData.validAfter), { size: 6 }),
                        pad(leafData.sessionValidationModule, { size: 20 }),
                        leafData.sessionKeyData
                    ]);
                    const generatedSessionId = leafData.preferredSessionId ?? generateRandomHex();
                    // TODO: verify this, might not be buffer
                    leavesToAdd.push(keccak256(leafDataHex));
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
                const newMerkleTree = new MerkleTree(leaves, keccak256, {
                    sortPairs: true,
                    hashLeaves: false
                });
                this.merkleTree = newMerkleTree;
                const setMerkleRootData = encodeFunctionData({
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
    /**
     * Asynchronously creates and initializes an instance of SessionKeyManagerModule
     * @param moduleConfig The configuration for the module
     * @returns A Promise that resolves to an instance of SessionKeyManagerModule
     */
    static async create(moduleConfig) {
        // TODO: (Joe) stop doing things in a 'create' call after the instance has been created
        const instance = new DANSessionKeyManagerModule(moduleConfig);
        if (moduleConfig.moduleAddress) {
            instance.moduleAddress = moduleConfig.moduleAddress;
        }
        else if (moduleConfig.version) {
            const moduleAddr = SESSION_MANAGER_MODULE_ADDRESSES_BY_VERSION[moduleConfig.version];
            if (!moduleAddr) {
                throw new Error(`Invalid version ${moduleConfig.version}`);
            }
            instance.moduleAddress = moduleAddr;
            instance.version = moduleConfig.version;
        }
        else {
            instance.moduleAddress = DEFAULT_SESSION_KEY_MANAGER_MODULE;
            // Note: in this case Version remains the default one
        }
        if (moduleConfig.sessionStorageClient) {
            instance.sessionStorageClient = moduleConfig.sessionStorageClient;
        }
        else {
            switch (moduleConfig.storageType) {
                case StorageType.MEMORY_STORAGE:
                    instance.sessionStorageClient = new SessionMemoryStorage(moduleConfig.smartAccountAddress);
                    break;
                case StorageType.LOCAL_STORAGE:
                    instance.sessionStorageClient = new SessionLocalStorage(moduleConfig.smartAccountAddress);
                    break;
                default:
                    instance.sessionStorageClient = new SessionLocalStorage(moduleConfig.smartAccountAddress);
            }
        }
        const existingSessionData = await instance.sessionStorageClient.getAllSessionData();
        const existingSessionDataLeafs = existingSessionData.map((sessionData) => {
            const leafDataHex = concat([
                pad(toHex(sessionData.validUntil), { size: 6 }),
                pad(toHex(sessionData.validAfter), { size: 6 }),
                pad(sessionData.sessionValidationModule, { size: 20 }),
                sessionData.sessionKeyData
            ]);
            return keccak256(leafDataHex);
        });
        instance.merkleTree = new MerkleTree(existingSessionDataLeafs, keccak256, {
            sortPairs: true,
            hashLeaves: false
        });
        return instance;
    }
    /**
     * This method is used to sign the user operation using the session signer
     * @param userOp The user operation to be signed
     * @param sessionSigner The signer to be used to sign the user operation
     * @returns The signature of the user operation
     */
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
            // @ts-ignore
            userOperation: userOpTemp,
            entryPointVersion: "v0.6.0",
            entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
            chainId: sessionSignerData.danModuleInfo.chainId
        };
        const messageToSign = JSON.stringify(objectToSign);
        const signature = await danSDK.signMessage(messageToSign, sessionSignerData.danModuleInfo);
        const leafDataHex = concat([
            pad(toHex(sessionSignerData.validUntil), { size: 6 }),
            pad(toHex(sessionSignerData.validAfter), { size: 6 }),
            pad(sessionSignerData.sessionValidationModule, { size: 20 }),
            sessionSignerData.sessionKeyData
        ]);
        // Generate the padded signature with (validUntil,validAfter,sessionVerificationModuleAddress,validationData,merkleProof,signature)
        let paddedSignature = encodeAbiParameters(parseAbiParameters("uint48, uint48, address, bytes, bytes32[], bytes"), [
            sessionSignerData.validUntil,
            sessionSignerData.validAfter,
            sessionSignerData.sessionValidationModule,
            sessionSignerData.sessionKeyData,
            this.merkleTree.getHexProof(keccak256(leafDataHex)),
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
    /**
     * Update the session data pending state to active
     * @param param The search param to find the session data
     * @param status The status to be updated
     * @returns
     */
    async updateSessionStatus(param, status) {
        this.sessionStorageClient.updateSessionStatus(param, status);
    }
    /**
     * @remarks This method is used to clear all the pending sessions
     * @returns
     */
    async clearPendingSessions() {
        this.sessionStorageClient.clearPendingSessions();
    }
    /**
     * @returns SessionKeyManagerModule address
     */
    getAddress() {
        return this.moduleAddress;
    }
    /**
     * @remarks This is the version of the module contract
     */
    async getSigner() {
        throw new Error("Method not implemented.");
    }
    /**
     * @remarks This is the dummy signature for the module, used in buildUserOp for bundler estimation
     * @returns Dummy signature
     */
    async getDummySignature(params) {
        if (!params) {
            throw new Error("Params must be provided.");
        }
        const sessionSignerData = await this.getLeafInfo(params);
        const leafDataHex = concat([
            pad(toHex(sessionSignerData.validUntil), { size: 6 }),
            pad(toHex(sessionSignerData.validAfter), { size: 6 }),
            pad(sessionSignerData.sessionValidationModule, { size: 20 }),
            sessionSignerData.sessionKeyData
        ]);
        // Generate the padded signature with (validUntil,validAfter,sessionVerificationModuleAddress,validationData,merkleProof,signature)
        let paddedSignature = encodeAbiParameters(parseAbiParameters("uint48, uint48, address, bytes, bytes32[], bytes"), [
            sessionSignerData.validUntil,
            sessionSignerData.validAfter,
            sessionSignerData.sessionValidationModule,
            sessionSignerData.sessionKeyData,
            this.merkleTree.getHexProof(keccak256(leafDataHex)),
            this.mockEcdsaSessionKeySig
        ]);
        if (params?.additionalSessionData) {
            paddedSignature += params.additionalSessionData;
        }
        const dummySig = encodeAbiParameters(parseAbiParameters(["bytes, address"]), [paddedSignature, this.getAddress()]);
        return dummySig;
    }
    /**
     * @remarks Other modules may need additional attributes to build init data
     */
    async getInitData() {
        throw new Error("Method not implemented.");
    }
    /**
     * @remarks This Module dont have knowledge of signer. So, this method is not implemented
     */
    async signMessage(_message) {
        throw new Error("Method not implemented.");
    }
}
//# sourceMappingURL=DANSessionKeyManagerModule.js.map