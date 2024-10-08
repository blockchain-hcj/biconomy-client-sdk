import { type AbiFunction, type ByteArray, type Chain, type Hex } from "viem";
import { type CreateSessionDataParams, type DanModuleInfo, type SessionParams } from "..";
import { type BiconomySmartAccountV2, type BuildUserOpOptions } from "../../account";
import type { UserOpResponse } from "../../bundler/utils/Types";
import type { ISessionStorage } from "../interfaces/ISessionStorage";
import type { Permission, SessionSearchParam } from "../utils/Helper";
import type { DeprecatedPermission, Rule } from "../utils/Helper";
export type SessionConfig = {
    usersAccountAddress: Hex;
    smartAccount: BiconomySmartAccountV2;
};
export type Session = {
    /** The storage client specific to the smartAccountAddress which stores the session keys */
    sessionStorageClient: ISessionStorage;
    /** The relevant sessionID for the chosen session */
    sessionIDInfo: string[];
};
export type SessionEpoch = {
    /** The time at which the session is no longer valid */
    validUntil?: number;
    /** The time at which the session becomes valid */
    validAfter?: number;
};
export declare const PolicyHelpers: {
    Indefinitely: {
        validUntil: number;
        validAfter: number;
    };
    NoValueLimit: bigint;
};
type RuleCondition = "EQUAL" | "LASS_THAN_OR_EQUAL" | "LESS_THAN" | "GREATER_THAN_OR_EQUAL" | "GREATER_THAN" | "NOT_EQUAL";
export declare const RuleHelpers: {
    OffsetByIndex: (i: number) => number;
    Condition: (condition: RuleCondition) => number;
};
export type PolicyWithOptionalSessionKey = Omit<Policy, "sessionKeyAddress"> & {
    sessionKeyAddress?: Hex;
};
export type Policy = {
    /** The address of the contract to be included in the policy */
    contractAddress: Hex;
    /** The address of the sessionKey upon which the policy is to be imparted */
    sessionKeyAddress: Hex;
    /** The specific function selector from the contract to be included in the policy */
    functionSelector: string | AbiFunction;
    /** The rules  to be included in the policy */
    rules: Rule[];
    /** The time interval within which the session is valid. If left unset the session will remain invalid indefinitely */
    interval?: SessionEpoch;
    /** The maximum value that can be transferred in a single transaction */
    valueLimit: bigint;
};
export type SessionGrantedPayload = UserOpResponse & {
    session: Session;
};
/**
 *
 * createSession
 *
 * Creates a session for a user's smart account.
 * This grants a dapp permission to execute a specific function on a specific contract on behalf of a user.
 * Permissions can be specified by the dapp in the form of rules{@link Rule}, and then submitted to the user for approval via signing.
 * The session keys granted with the imparted policy are stored in a StorageClient {@link ISessionStorage}. They can later be retrieved and used to validate userops.
 *
 * @param smartAccount - The user's {@link BiconomySmartAccountV2} smartAccount instance.
 * @param sessionKeyAddress - The address of the sessionKey upon which the policy is to be imparted.
 * @param policy - An array of session configurations {@link Policy}.
 * @param sessionStorageClient - The storage client to store the session keys. {@link ISessionStorage}
 * @param buildUseropDto - Optional. {@link BuildUserOpOptions}
 * @returns Promise<{@link SessionGrantedPayload}> - An object containing the status of the transaction and the sessionID.
 *
 * @example
 *
 * ```typescript
 * import { createClient } from "viem"
 * import { createSmartAccountClient } from "@biconomy/account"
 * import { createWalletClient, http } from "viem";
 * import { polygonAmoy } from "viem/chains";
 * import { SessionFileStorage } from "@biconomy/session-file-storage";
 * const signer = createWalletClient({
 *   account,
 *   chain: polygonAmoy,
 *   transport: http(),
 * });
 *
 * const smartAccount = await createSmartAccountClient({ signer, bundlerUrl, paymasterUrl }); // Retrieve bundler/paymaster url from dashboard
 * const smartAccountAddress = await smartAccount.getAccountAddress();
 * const nftAddress = "0x1758f42Af7026fBbB559Dc60EcE0De3ef81f665e"
 * const sessionStorage = new SessionFileStorage(smartAccountAddress)
 * const sessionKeyAddress = (await sessionStorage.addSigner(undefined, polygonAmoy)).getAddress();
 *
 * const { wait, sessionID } = await createSession(
 *    smartAccount,
 *    [
 *      {
 *        sessionKeyAddress,
 *        contractAddress: nftAddress,
 *        functionSelector: "safeMint(address)",
 *        rules: [
 *          {
 *            offset: 0,
 *            condition: 0,
 *            referenceValue: smartAccountAddress
 *          }
 *        ],
 *        interval: {
 *          validUntil: 0,
 *          validAfter: 0
 *         },
 *         valueLimit: 0n
 *      }
 *    ],
 *    sessionStorage,
 *    {
 *      paymasterServiceData: { mode: PaymasterMode.SPONSORED },
 *    }
 *  )
 *
 *  const {
 *    receipt: { transactionHash },
 *    success
 *  } = await wait();
 *
 * console.log({ sessionID, success }); // Use the sessionID later to retrieve the sessionKey from the storage client
 * ```
 */
export declare const createSession: (smartAccount: BiconomySmartAccountV2, policy: PolicyWithOptionalSessionKey[], sessionStorageClient?: ISessionStorage | null, buildUseropDto?: BuildUserOpOptions) => Promise<SessionGrantedPayload>;
export type HardcodedFunctionSelector = {
    raw: Hex;
};
export type CreateSessionDatumParams = {
    interval?: SessionEpoch;
    sessionKeyAddress: Hex;
    contractAddress: Hex;
    functionSelector: string | AbiFunction | HardcodedFunctionSelector;
    rules: Rule[];
    valueLimit: bigint;
    danModuleInfo?: DanModuleInfo;
};
/**
 *
 * createABISessionDatum
 *
 * Used to create a session datum for the ABI Session Validation Module.
 * It can also be used to create a session datum for batchSession mode.
 *
 * @param createSessionDataParams - {@link CreateSessionDatumParams}
 * @returns {@link CreateSessionDataParams}
 */
export declare const createABISessionDatum: ({ interval, sessionKeyAddress, contractAddress, functionSelector, rules, valueLimit, danModuleInfo, }: CreateSessionDatumParams) => CreateSessionDataParams;
/**
 * @deprecated
 */
export declare function getABISVMSessionKeyData(sessionKey: `0x${string}` | Uint8Array, permission: DeprecatedPermission): Promise<`0x${string}` | Uint8Array>;
export declare function getSessionDatum(sessionKeyAddress: Hex, permission: Permission): Hex;
export type HardcodedReference = {
    raw: Hex;
};
type BaseReferenceValue = string | number | bigint | boolean | ByteArray;
type AnyReferenceValue = BaseReferenceValue | HardcodedReference;
/**
 *
 * parseReferenceValue
 *
 * Parses the reference value to a hex string.
 * The reference value can be hardcoded using the {@link HardcodedReference} type.
 * Otherwise, it can be a string, number, bigint, boolean, or ByteArray.
 *
 * @param referenceValue {@link AnyReferenceValue}
 * @returns Hex
 */
export declare function parseReferenceValue(referenceValue: AnyReferenceValue): Hex;
export type SingleSessionParamsPayload = {
    params: SessionParams;
};
/**
 * getSingleSessionTxParams
 *
 * Retrieves the transaction parameters for a batched session.
 *
 * @param correspondingIndex - An index for the transaction corresponding to the relevant session. If not provided, the last session index is used.
 * @param conditionalSession - {@link SessionSearchParam} The session data that contains the sessionID and sessionSigner. If not provided, The default session storage (localStorage in browser, fileStorage in node backend) is used to fetch the sessionIDInfo
 * @param chain - The chain.
 * @returns Promise<{@link BatchSessionParamsPayload}> - session parameters.
 *
 */
export declare const getSingleSessionTxParams: (conditionalSession: SessionSearchParam, chain: Chain, correspondingIndex?: number | null | undefined) => Promise<SingleSessionParamsPayload>;
export {};
//# sourceMappingURL=abi.d.ts.map