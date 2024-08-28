import { MerkleTree } from "merkletreejs";
import { type Hex } from "viem";
import { type SmartAccountSigner, type UserOperationStruct } from "../account";
import { BaseValidationModule } from "./BaseValidationModule.js";
import type { ISessionStorage, SessionSearchParam, SessionStatus } from "./interfaces/ISessionStorage.js";
import { type CreateSessionDataParams, type CreateSessionDataResponse, type ModuleInfo, type ModuleVersion, type SessionKeyManagerModuleConfig, type SessionParams } from "./utils/Types.js";
export type WalletProviderDefs = {
    walletProviderId: string;
    walletProviderUrl: string;
};
export type Config = {
    walletProvider: WalletProviderDefs;
};
export type SendUserOpArgs = SessionParams & {
    rawUserOperation: Partial<UserOperationStruct>;
};
export declare class DANSessionKeyManagerModule extends BaseValidationModule {
    version: ModuleVersion;
    moduleAddress: Hex;
    merkleTree: MerkleTree;
    sessionStorageClient: ISessionStorage;
    readonly mockEcdsaSessionKeySig: Hex;
    /**
     * This constructor is private. Use the static create method to instantiate SessionKeyManagerModule
     * @param moduleConfig The configuration for the module
     * @returns An instance of SessionKeyManagerModule
     */
    private constructor();
    /**
     * Asynchronously creates and initializes an instance of SessionKeyManagerModule
     * @param moduleConfig The configuration for the module
     * @returns A Promise that resolves to an instance of SessionKeyManagerModule
     */
    static create(moduleConfig: SessionKeyManagerModuleConfig): Promise<DANSessionKeyManagerModule>;
    /**
     * Method to create session data for any module. The session data is used to create a leaf in the merkle tree
     * @param leavesData The data of one or more leaves to be used to create session data
     * @returns The session data
     */
    createSessionData: (leavesData: CreateSessionDataParams[]) => Promise<CreateSessionDataResponse>;
    /**
     * This method is used to sign the user operation using the session signer
     * @param userOp The user operation to be signed
     * @param sessionSigner The signer to be used to sign the user operation
     * @returns The signature of the user operation
     */
    signUserOpHash(_: string, { sessionID, rawUserOperation, additionalSessionData }: SendUserOpArgs): Promise<Hex>;
    private getLeafInfo;
    /**
     * Update the session data pending state to active
     * @param param The search param to find the session data
     * @param status The status to be updated
     * @returns
     */
    updateSessionStatus(param: SessionSearchParam, status: SessionStatus): Promise<void>;
    /**
     * @remarks This method is used to clear all the pending sessions
     * @returns
     */
    clearPendingSessions(): Promise<void>;
    /**
     * @returns SessionKeyManagerModule address
     */
    getAddress(): Hex;
    /**
     * @remarks This is the version of the module contract
     */
    getSigner(): Promise<SmartAccountSigner>;
    /**
     * @remarks This is the dummy signature for the module, used in buildUserOp for bundler estimation
     * @returns Dummy signature
     */
    getDummySignature(params?: ModuleInfo): Promise<Hex>;
    /**
     * @remarks Other modules may need additional attributes to build init data
     */
    getInitData(): Promise<Hex>;
    /**
     * @remarks This Module dont have knowledge of signer. So, this method is not implemented
     */
    signMessage(_message: Uint8Array | string): Promise<string>;
}
//# sourceMappingURL=DANSessionKeyManagerModule.d.ts.map