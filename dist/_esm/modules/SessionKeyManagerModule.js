import { MerkleTree } from "merkletreejs";
import { concat, encodeAbiParameters, encodeFunctionData, keccak256, pad, parseAbi, parseAbiParameters, toBytes, toHex } from "viem";
import { convertSigner } from "../account/index.js";
import { BaseValidationModule } from "./BaseValidationModule.js";
import { SessionLocalStorage } from "./session-storage/SessionLocalStorage.js";
import { SessionMemoryStorage } from "./session-storage/SessionMemoryStorage.js";
import { DEFAULT_SESSION_KEY_MANAGER_MODULE, SESSION_MANAGER_MODULE_ADDRESSES_BY_VERSION } from "./utils/Constants.js";
import { StorageType } from "./utils/Types.js";
import { generateRandomHex } from "./utils/Uid.js";
export class SessionKeyManagerModule extends BaseValidationModule {
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
        const instance = new SessionKeyManagerModule(moduleConfig);
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
     * Revokes specified sessions by generating a new Merkle root and updating the session statuses to "REVOKED".
     *
     * This method performs the following steps:
     * 1. Calls `revokeSessions` on the session storage client to get new leaf nodes for the sessions to be revoked.
     * 2. Constructs new leaf data from the session details, including validity periods and session validation module.
     * 3. Hashes the leaf data using `keccak256` and adds them to the Merkle tree.
     * 4. Creates a new Merkle tree with the updated leaves and updates the internal Merkle tree reference.
     * 5. Sets the new Merkle root in the session storage.
     * 6. Updates the status of each specified session to "REVOKED" in the session storage.
     *
     * @param sessionIDs - An array of session IDs to be revoked.
     * @returns A promise that resolves to the new Merkle root as a hexadecimal string.
     */
    async revokeSessions(sessionIDs) {
        const newLeafs = await this.sessionStorageClient.revokeSessions(sessionIDs);
        const leavesToAdd = [];
        for (const leaf of newLeafs) {
            const leafDataHex = concat([
                pad(toHex(leaf.validUntil), { size: 6 }),
                pad(toHex(leaf.validAfter), { size: 6 }),
                pad(leaf.sessionValidationModule, { size: 20 }),
                leaf.sessionKeyData
            ]);
            leavesToAdd.push(keccak256(leafDataHex));
        }
        this.merkleTree.addLeaves(leavesToAdd);
        const leaves = this.merkleTree.getLeaves();
        const newMerkleTree = new MerkleTree(leaves, keccak256, {
            sortPairs: true,
            hashLeaves: false
        });
        this.merkleTree = newMerkleTree;
        await this.sessionStorageClient.setMerkleRoot(this.merkleTree.getHexRoot());
        for (const sessionID of sessionIDs) {
            this.sessionStorageClient.updateSessionStatus({ sessionID }, "REVOKED");
        }
        return newMerkleTree.getHexRoot();
    }
    /**
     * This method is used to sign the user operation using the session signer
     * @param userOp The user operation to be signed
     * @param sessionSigner The signer to be used to sign the user operation
     * @returns The signature of the user operation
     */
    async signUserOpHash(userOpHash, params) {
        if (!params?.sessionSigner) {
            throw new Error("Session signer is not provided.");
        }
        const { signer: sessionSigner } = await convertSigner(params.sessionSigner, false);
        // Use the sessionSigner to sign the user operation
        const signature = await sessionSigner.signMessage({
            raw: toBytes(userOpHash)
        });
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
            signature
        ]);
        if (params?.additionalSessionData) {
            paddedSignature += params.additionalSessionData;
        }
        return paddedSignature;
    }
    async getLeafInfo(params) {
        if (!params?.sessionSigner) {
            throw new Error("Session signer is not provided.");
        }
        const { signer: sessionSigner } = await convertSigner(params.sessionSigner, false);
        // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
        let sessionSignerData;
        if (params?.sessionID) {
            sessionSignerData = await this.sessionStorageClient.getSessionData({
                sessionID: params.sessionID
            });
        }
        else if (params?.sessionValidationModule) {
            sessionSignerData = await this.sessionStorageClient.getSessionData({
                sessionValidationModule: params.sessionValidationModule,
                sessionPublicKey: await sessionSigner.getAddress()
            });
        }
        else {
            throw new Error("sessionID or sessionValidationModule should be provided.");
        }
        return sessionSignerData;
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
            throw new Error("Session signer is not provided.");
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
//# sourceMappingURL=SessionKeyManagerModule.js.map