import { EOAAuth, EphAuth, NetworkSigner, WalletProviderServiceClient, computeAddress } from "@silencelaboratories/walletprovider-sdk";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createDANSessionKeyManagerModule } from "../index.js";
import { ERROR_MESSAGES, Logger, isWalletClient } from "../../account/index.js";
import { extractChainIdFromBundlerUrl } from "../../bundler/index.js";
import { getDefaultStorageClient } from "../session-storage/utils.js";
import { DAN_BACKEND_URL, DEFAULT_SESSION_KEY_MANAGER_MODULE } from "../utils/Constants.js";
import { NodeWallet, didProvideFullSession, hexToUint8Array, resumeSession } from "../utils/Helper.js";
import { createABISessionDatum } from "./abi.js";
export const DEFAULT_SESSION_DURATION = 60 * 60 * 24 * 365; // 1 year
export const QUORUM_PARTIES = 5;
export const QUORUM_THRESHOLD = 3;
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
export const createSessionWithDistributedKey = async ({ smartAccountClient, policy, sessionStorageClient, buildUseropDto, chainId, browserWallet }) => {
    const defaultedChainId = chainId ??
        extractChainIdFromBundlerUrl(smartAccountClient?.bundler?.getBundlerUrl() ?? "");
    if (!defaultedChainId) {
        throw new Error(ERROR_MESSAGES.CHAIN_NOT_FOUND);
    }
    const smartAccountAddress = await smartAccountClient.getAddress();
    const defaultedSessionStorageClient = sessionStorageClient || getDefaultStorageClient(smartAccountAddress);
    const sessionsModule = await createDANSessionKeyManagerModule({
        smartAccountAddress,
        sessionStorageClient: defaultedSessionStorageClient
    });
    let duration = DEFAULT_SESSION_DURATION;
    if (policy?.[0].interval?.validUntil) {
        duration = Math.round(policy?.[0].interval?.validUntil - Date.now() / 1000);
    }
    const { sessionKeyEOA: sessionKeyAddress, ...other } = await danSDK.generateSessionKey({
        smartAccountClient,
        browserWallet,
        duration,
        chainId
    });
    const danModuleInfo = { ...other };
    const defaultedPolicy = policy.map((p) => ({ ...p, sessionKeyAddress }));
    const humanReadablePolicyArray = defaultedPolicy.map((p) => createABISessionDatum({ ...p, danModuleInfo }));
    const { data: policyData, sessionIDInfo } = await sessionsModule.createSessionData(humanReadablePolicyArray);
    const permitTx = {
        to: DEFAULT_SESSION_KEY_MANAGER_MODULE,
        data: policyData
    };
    const txs = [];
    const isDeployed = await smartAccountClient.isAccountDeployed();
    const enableSessionTx = await smartAccountClient.getEnableModuleData(DEFAULT_SESSION_KEY_MANAGER_MODULE);
    if (isDeployed) {
        const enabled = await smartAccountClient.isModuleEnabled(DEFAULT_SESSION_KEY_MANAGER_MODULE);
        if (!enabled) {
            txs.push(enableSessionTx);
        }
    }
    else {
        Logger.log(ERROR_MESSAGES.ACCOUNT_NOT_DEPLOYED);
        txs.push(enableSessionTx);
    }
    txs.push(permitTx);
    const userOpResponse = await smartAccountClient.sendTransaction(txs, buildUseropDto);
    smartAccountClient.setActiveValidationModule(sessionsModule);
    return {
        session: {
            sessionStorageClient: defaultedSessionStorageClient,
            sessionIDInfo
        },
        ...userOpResponse
    };
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
export const generateSessionKey = async ({ smartAccountClient, browserWallet, hardcodedValues = {}, duration = DEFAULT_SESSION_DURATION, chainId }) => {
    const eoaAddress = hardcodedValues?.eoaAddress ?? (await smartAccountClient.getSigner().getAddress()); // Smart account owner
    const innerSigner = smartAccountClient.getSigner().inner;
    const defaultedChainId = chainId ?? extractChainIdFromBundlerUrl(smartAccountClient?.bundler?.getBundlerUrl() ?? "");
    if (!defaultedChainId) {
        throw new Error(ERROR_MESSAGES.CHAIN_NOT_FOUND);
    }
    if (!browserWallet && !isWalletClient(innerSigner))
        throw new Error(ERROR_MESSAGES.INVALID_BROWSER_WALLET);
    const wallet = browserWallet ?? new NodeWallet(innerSigner);
    const hexEphSK = generatePrivateKey();
    const account = privateKeyToAccount(hexEphSK);
    const jwt = hardcodedValues?.jwt ?? hexEphSK.slice(2);
    const ephPK = hexToUint8Array(account.address.slice(2));
    const wpClient = new WalletProviderServiceClient({
        walletProviderId: "WalletProvider",
        walletProviderUrl: DAN_BACKEND_URL
    });
    const eoaAuth = new EOAAuth(eoaAddress, wallet, ephPK, duration);
    const partiesNumber = hardcodedValues?.partiesNumber ?? QUORUM_PARTIES;
    const threshold = hardcodedValues?.threshold ?? QUORUM_THRESHOLD;
    const sdk = new NetworkSigner(wpClient, threshold, partiesNumber, eoaAuth);
    // @ts-ignore
    const resp = await sdk.authenticateAndCreateKey(ephPK);
    const pubKey = resp.publicKey;
    const mpcKeyId = resp.keyId;
    const sessionKeyEOA = computeAddress(pubKey);
    return {
        sessionKeyEOA,
        mpcKeyId,
        jwt,
        partiesNumber,
        threshold,
        eoaAddress,
        chainId: defaultedChainId
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
export const getDanSessionTxParams = async (conditionalSession, chain, correspondingIndex) => {
    const defaultedCorrespondingIndex = Array.isArray(correspondingIndex)
        ? correspondingIndex[0]
        : correspondingIndex;
    const resumedSession = await resumeSession(conditionalSession);
    // if correspondingIndex is null then use the last session.
    const allSessions = await resumedSession.sessionStorageClient.getAllSessionData();
    const sessionID = didProvideFullSession(conditionalSession)
        ? conditionalSession.sessionIDInfo[defaultedCorrespondingIndex ?? 0]
        : allSessions[defaultedCorrespondingIndex ?? allSessions.length - 1]
            .sessionID;
    const matchingLeafDatum = allSessions.find((s) => s.sessionID === sessionID);
    if (!sessionID)
        throw new Error(ERROR_MESSAGES.MISSING_SESSION_ID);
    if (!matchingLeafDatum)
        throw new Error(ERROR_MESSAGES.NO_LEAF_FOUND);
    if (!matchingLeafDatum.danModuleInfo)
        throw new Error(ERROR_MESSAGES.NO_DAN_MODULE_INFO);
    const chainIdsMatch = chain.id === matchingLeafDatum?.danModuleInfo?.chainId;
    if (!chainIdsMatch)
        throw new Error(ERROR_MESSAGES.CHAIN_ID_MISMATCH);
    return { params: { sessionID } };
};
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
export const signMessage = async (message, danParams) => {
    const { jwt, eoaAddress, threshold, partiesNumber, chainId, mpcKeyId } = danParams;
    if (!message)
        throw new Error("Missing message");
    if (!jwt ||
        !eoaAddress ||
        !threshold ||
        !partiesNumber ||
        !chainId ||
        !mpcKeyId) {
        throw new Error("Missing params from danModuleInfo");
    }
    const wpClient = new WalletProviderServiceClient({
        walletProviderId: "WalletProvider",
        walletProviderUrl: DAN_BACKEND_URL
    });
    const ephSK = hexToUint8Array(jwt);
    const authModule = new EphAuth(eoaAddress, ephSK);
    const sdk = new NetworkSigner(wpClient, threshold, partiesNumber, authModule);
    const reponse = await sdk.authenticateAndSign(mpcKeyId, message);
    const v = reponse.recid;
    const sigV = v === 0 ? "1b" : "1c";
    const signature = `0x${reponse.sign}${sigV}`;
    return signature;
};
export const danSDK = {
    generateSessionKey,
    signMessage
};
export default danSDK;
//# sourceMappingURL=dan.js.map