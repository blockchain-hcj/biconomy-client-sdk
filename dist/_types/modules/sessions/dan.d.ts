import { type IBrowserWallet } from "@silencelaboratories/walletprovider-sdk";
import type { Chain, Hex } from "viem";
import { type BiconomySmartAccountV2, type BuildUserOpOptions } from "../../account";
import type { ISessionStorage } from "../interfaces/ISessionStorage";
import { type SessionSearchParam } from "../utils/Helper";
import type { DanModuleInfo } from "../utils/Types";
import { type Policy, type SessionGrantedPayload } from "./abi";
export type PolicyLeaf = Omit<Policy, "sessionKeyAddress">;
export declare const DEFAULT_SESSION_DURATION: number;
export declare const QUORUM_PARTIES = 5;
export declare const QUORUM_THRESHOLD = 3;
export type CreateSessionWithDistributedKeyParams = {
    /** The user's smart account instance */
    smartAccountClient: BiconomySmartAccountV2;
    /** An array of session configurations */
    policy: PolicyLeaf[];
    /** The storage client to store the session keys */
    sessionStorageClient?: ISessionStorage | null;
    /** The build userop dto */
    buildUseropDto?: BuildUserOpOptions;
    /** The chain ID */
    chainId?: number;
    /** Optional. The user's {@link IBrowserWallet} instance. Default will be the signer associated with the smart account. */
    browserWallet?: IBrowserWallet;
};
/**
 *
 * createSessionWithDistributedKey
 *
 * Creates a session for a user's smart account.
 * This grants a dapp permission to execute a specific function on a specific contract on behalf of a user.
 * Permissions can be specified by the dapp in the form of rules{@link Rule}, and then submitted to the user for approval via signing.
 * The session keys granted with the imparted policy are stored in a StorageClient {@link ISessionStorage}. They can later be retrieved and used to validate userops.
 *
 * @param smartAccount - The user's {@link BiconomySmartAccountV2} smartAccount instance.
 * @param policy - An array of session configurations {@link Policy}.
 * @param sessionStorageClient - The storage client to store the session keys. {@link ISessionStorage}
 * @param buildUseropDto - Optional. {@link BuildUserOpOptions}
 * @param chainId - Optional. Will be inferred if left unset.
 * @param browserWallet - Optional. The user's {@link IBrowserWallet} instance. Default will be the signer associated with the smart account.
 * @returns Promise<{@link SessionGrantedPayload}> - An object containing the status of the transaction and the sessionID.
 *
 * @example
 *
 * import { type PolicyLeaf, type Session, createSessionWithDistributedKey } from "@biconomy/account"
 *
 * const policy: PolicyLeaf[] = [{
 *   contractAddress: nftAddress,
 *   functionSelector: "safeMint(address)",
 *   rules: [
 *     {
 *       offset: 0,
 *       condition: 0,
 *       referenceValue: smartAccountAddress
 *     }
 *   ],
 *   interval: {
 *     validUntil: 0,
 *     validAfter: 0
 *   },
 *   valueLimit: 0n
 * }]
 *
 * const { wait, session } = await createSessionWithDistributedKey({
 *   smartAccountClient,
 *   policy
 * })
 *
 * const { success } = await wait()
*/
export declare const createSessionWithDistributedKey: ({ smartAccountClient, policy, sessionStorageClient, buildUseropDto, chainId, browserWallet }: CreateSessionWithDistributedKeyParams) => Promise<SessionGrantedPayload>;
export type DanSessionKeyPayload = {
    /** Dan Session ephemeral key*/
    sessionKeyEOA: Hex;
    /** Dan Session MPC key ID*/
    mpcKeyId: string;
    /** Dan Session ephemeral private key without 0x prefix */
    jwt: string;
    /** Number of nodes that participate in keygen operation. Also known as n. */
    partiesNumber: number;
    /** Number of nodes that needs to participate in protocol in order to generate valid signature. Also known as t. */
    threshold: number;
    /** The eoa that was used to create the session */
    eoaAddress: Hex;
    /** the chainId is relevant only to the */
    chainId: number;
};
export type DanSessionKeyRequestParams = {
    /**  Relevant smart account */
    smartAccountClient: BiconomySmartAccountV2;
    /** Optional browser wallet. If using wagmi can be set to connector.getProvider() from useAccount hook */
    browserWallet?: IBrowserWallet;
    /** Optional hardcoded values if required */
    hardcodedValues?: Partial<DanModuleInfo>;
    /** Optional duration of the session key in seconds. Default is 3600 seconds. */
    duration?: number;
    /** Optional chainId. Will be inferred if left unset. */
    chainId?: number;
};
/**
 *
 * generateSessionKey
 *
 * @description This function is used to generate a new session key for a Distributed Account Network (DAN) session. This information is kept in the session storage and can be used to validate userops without the user's direct involvement.
 *
 * Generates a new session key for a Distributed Account Network (DAN) session.
 * @param smartAccount - The user's {@link BiconomySmartAccountV2} smartAccount instance.
 * @param browserWallet - Optional. The user's {@link IBrowserWallet} instance.
 * @param hardcodedValues - Optional. {@link DanModuleInfo} - Additional information for the DAN module configuration to override the default values.
 * @param duration - Optional. The duration of the session key in seconds. Default is 3600 seconds.
 * @param chainId - Optional. The chain ID. Will be inferred if left unset.
 * @returns Promise<{@link DanModuleInfo}> - An object containing the session key, the MPC key ID, the number of parties, the threshold, and the EOA address.
 *
*/
export declare const generateSessionKey: ({ smartAccountClient, browserWallet, hardcodedValues, duration, chainId }: DanSessionKeyRequestParams) => Promise<DanSessionKeyPayload>;
export type DanSessionParamsPayload = {
    params: {
        sessionID: string;
    };
};
/**
 * getDanSessionTxParams
 *
 * Retrieves the transaction parameters for a batched session.
 *
 * @param correspondingIndex - An index for the transaction corresponding to the relevant session. If not provided, the last session index is used.
 * @param conditionalSession - {@link SessionSearchParam} The session data that contains the sessionID and sessionSigner. If not provided, The default session storage (localStorage in browser, fileStorage in node backend) is used to fetch the sessionIDInfo
 * @returns Promise<{@link DanSessionParamsPayload}> - session parameters.
 *
 */
export declare const getDanSessionTxParams: (conditionalSession: SessionSearchParam, chain: Chain, correspondingIndex?: number | null | undefined) => Promise<DanSessionParamsPayload>;
/**
 *
 * signMessage
 *
 * @description This function is used to sign a message using the Distributed Account Network (DAN) module.
 *
 * @param message - The message to sign
 * @param danParams {@link DanModuleInfo} - The DAN module information required to sign the message
 * @returns signedResponse - Hex
 *
 * @example
 *
 * ```ts
 * import { signMessage } from "@biconomy/account";
 * const objectToSign: DanSignatureObject = {
 *   userOperation: UserOperationStruct,
 *   entryPointVersion: "v0.6.0",
 *   entryPointAddress: "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789",
 *   chainId
 * }
 *
 * const messageToSign = JSON.stringify(objectToSign)
 * const signature: Hex = await signMessage(messageToSign, sessionSignerData.danModuleInfo); // From the generateSessionKey helper
 * ```
 *
 */
export declare const signMessage: (message: string, danParams: DanModuleInfo) => Promise<Hex>;
export declare const danSDK: {
    generateSessionKey: ({ smartAccountClient, browserWallet, hardcodedValues, duration, chainId }: DanSessionKeyRequestParams) => Promise<DanSessionKeyPayload>;
    signMessage: (message: string, danParams: DanModuleInfo) => Promise<Hex>;
};
export default danSDK;
//# sourceMappingURL=dan.d.ts.map