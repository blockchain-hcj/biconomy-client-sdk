import type { Chain, Hex } from "viem";
import type { SmartAccountSigner } from "../../account";
import type { DanModuleInfo, SignerData } from "../utils/Types.js";
export type SessionStatus = "PENDING" | "ACTIVE" | "INACTIVE" | "EXPIRED" | "REVOKED";
export type SessionLeafNode = {
    validUntil: number;
    validAfter: number;
    sessionValidationModule: Hex;
    sessionKeyData: Hex;
    sessionPublicKey: Hex;
    sessionID?: string;
    status: SessionStatus;
    danModuleInfo?: DanModuleInfo;
};
export type SessionSearchParam = {
    sessionID?: string;
    sessionPublicKey?: Hex;
    sessionValidationModule?: Hex;
    status?: SessionStatus;
};
export interface ISessionStorage {
    /**
     * The address of the smartAccount
     */
    smartAccountAddress: Hex;
    /**
     * Adds a session leaf node to the session storage
     * @param leaf SessionLeafNode to be added to the session storage
     */
    addSessionData(_leaf: SessionLeafNode): Promise<void>;
    /**
     * Fetch a session leaf node from the session storage
     * @param param SessionSearchParam to be used to fetch the session leaf node
     */
    getSessionData(_param: SessionSearchParam): Promise<SessionLeafNode>;
    /**
     * Updates the session status of a session leaf node in the session storage
     * @param param SessionSearchParam to be used to fetch the session leaf node
     * @param status New session status to be updated
     */
    updateSessionStatus(_param: SessionSearchParam, _status: SessionStatus): Promise<void>;
    revokeSessions(sessionIDs: string[]): Promise<any>;
    /**
     * Clears all the pending sessions from the session storage
     */
    clearPendingSessions(): Promise<void>;
    /**
     * If a signer object is passed, it will be added to the session storage
     * If no signer object is passed, it'll create a random signer and add it to the session storage
     * @param signer Optional signer to be added to the session storage
     */
    addSigner(_signer?: SignerData, chain?: Chain): Promise<SmartAccountSigner>;
    /**
     * Fetch a signer from the session storage
     * @param signerPublicKey Public key of the signer to be fetched
     */
    getSignerByKey(_signerPublicKey: string, chain: Chain): Promise<SmartAccountSigner>;
    /**
     * Fetch a signer from the session storage based on the session search param
     * @param param SessionSearchParam to be used to fetch the signer
     */
    getSignerBySession(_param: SessionSearchParam, chain: Chain): Promise<SmartAccountSigner>;
    /**
     * Fetch all the session leaf nodes from the session storage based on the session search param.
     * If no param is passed, it'll fetch all the session leaf nodes from the session storage
     * @param param SessionSearchParam to be used to fetch the session leaf nodes
     */
    getAllSessionData(_param?: SessionSearchParam): Promise<SessionLeafNode[]>;
    /**
     * Fetch merkle root from the session storage
     */
    getMerkleRoot(): Promise<string>;
    /**
     * Set merkle root in the session storage
     * @param merkleRoot Merkle root to be set in the session storage
     */
    setMerkleRoot(_merkleRoot: string): Promise<void>;
}
//# sourceMappingURL=ISessionStorage.d.ts.map