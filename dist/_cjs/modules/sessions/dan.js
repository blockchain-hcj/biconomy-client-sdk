"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.danSDK = exports.signMessage = exports.getDanSessionTxParams = exports.generateSessionKey = exports.createSessionWithDistributedKey = exports.QUORUM_THRESHOLD = exports.QUORUM_PARTIES = exports.DEFAULT_SESSION_DURATION = void 0;
const walletprovider_sdk_1 = require("@silencelaboratories/walletprovider-sdk");
const accounts_1 = require("viem/accounts");
const __1 = require("../index.js");
const account_1 = require("../../account/index.js");
const bundler_1 = require("../../bundler/index.js");
const utils_1 = require("../session-storage/utils.js");
const Constants_1 = require("../utils/Constants.js");
const Helper_1 = require("../utils/Helper.js");
const abi_1 = require("./abi.js");
exports.DEFAULT_SESSION_DURATION = 60 * 60 * 24 * 365;
exports.QUORUM_PARTIES = 5;
exports.QUORUM_THRESHOLD = 3;
const createSessionWithDistributedKey = async ({ smartAccountClient, policy, sessionStorageClient, buildUseropDto, chainId, browserWallet }) => {
    const defaultedChainId = chainId ??
        (0, bundler_1.extractChainIdFromBundlerUrl)(smartAccountClient?.bundler?.getBundlerUrl() ?? "");
    if (!defaultedChainId) {
        throw new Error(account_1.ERROR_MESSAGES.CHAIN_NOT_FOUND);
    }
    const smartAccountAddress = await smartAccountClient.getAddress();
    const defaultedSessionStorageClient = sessionStorageClient || (0, utils_1.getDefaultStorageClient)(smartAccountAddress);
    const sessionsModule = await (0, __1.createDANSessionKeyManagerModule)({
        smartAccountAddress,
        sessionStorageClient: defaultedSessionStorageClient
    });
    let duration = exports.DEFAULT_SESSION_DURATION;
    if (policy?.[0].interval?.validUntil) {
        duration = Math.round(policy?.[0].interval?.validUntil - Date.now() / 1000);
    }
    const { sessionKeyEOA: sessionKeyAddress, ...other } = await exports.danSDK.generateSessionKey({
        smartAccountClient,
        browserWallet,
        duration,
        chainId
    });
    const danModuleInfo = { ...other };
    const defaultedPolicy = policy.map((p) => ({ ...p, sessionKeyAddress }));
    const humanReadablePolicyArray = defaultedPolicy.map((p) => (0, abi_1.createABISessionDatum)({ ...p, danModuleInfo }));
    const { data: policyData, sessionIDInfo } = await sessionsModule.createSessionData(humanReadablePolicyArray);
    const permitTx = {
        to: Constants_1.DEFAULT_SESSION_KEY_MANAGER_MODULE,
        data: policyData
    };
    const txs = [];
    const isDeployed = await smartAccountClient.isAccountDeployed();
    const enableSessionTx = await smartAccountClient.getEnableModuleData(Constants_1.DEFAULT_SESSION_KEY_MANAGER_MODULE);
    if (isDeployed) {
        const enabled = await smartAccountClient.isModuleEnabled(Constants_1.DEFAULT_SESSION_KEY_MANAGER_MODULE);
        if (!enabled) {
            txs.push(enableSessionTx);
        }
    }
    else {
        account_1.Logger.log(account_1.ERROR_MESSAGES.ACCOUNT_NOT_DEPLOYED);
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
exports.createSessionWithDistributedKey = createSessionWithDistributedKey;
const generateSessionKey = async ({ smartAccountClient, browserWallet, hardcodedValues = {}, duration = exports.DEFAULT_SESSION_DURATION, chainId }) => {
    const eoaAddress = hardcodedValues?.eoaAddress ?? (await smartAccountClient.getSigner().getAddress());
    const innerSigner = smartAccountClient.getSigner().inner;
    const defaultedChainId = chainId ?? (0, bundler_1.extractChainIdFromBundlerUrl)(smartAccountClient?.bundler?.getBundlerUrl() ?? "");
    if (!defaultedChainId) {
        throw new Error(account_1.ERROR_MESSAGES.CHAIN_NOT_FOUND);
    }
    if (!browserWallet && !(0, account_1.isWalletClient)(innerSigner))
        throw new Error(account_1.ERROR_MESSAGES.INVALID_BROWSER_WALLET);
    const wallet = browserWallet ?? new Helper_1.NodeWallet(innerSigner);
    const hexEphSK = (0, accounts_1.generatePrivateKey)();
    const account = (0, accounts_1.privateKeyToAccount)(hexEphSK);
    const jwt = hardcodedValues?.jwt ?? hexEphSK.slice(2);
    const ephPK = (0, Helper_1.hexToUint8Array)(account.address.slice(2));
    const wpClient = new walletprovider_sdk_1.WalletProviderServiceClient({
        walletProviderId: "WalletProvider",
        walletProviderUrl: Constants_1.DAN_BACKEND_URL
    });
    const eoaAuth = new walletprovider_sdk_1.EOAAuth(eoaAddress, wallet, ephPK, duration);
    const partiesNumber = hardcodedValues?.partiesNumber ?? exports.QUORUM_PARTIES;
    const threshold = hardcodedValues?.threshold ?? exports.QUORUM_THRESHOLD;
    const sdk = new walletprovider_sdk_1.NetworkSigner(wpClient, threshold, partiesNumber, eoaAuth);
    const resp = await sdk.authenticateAndCreateKey(ephPK);
    const pubKey = resp.publicKey;
    const mpcKeyId = resp.keyId;
    const sessionKeyEOA = (0, walletprovider_sdk_1.computeAddress)(pubKey);
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
exports.generateSessionKey = generateSessionKey;
const getDanSessionTxParams = async (conditionalSession, chain, correspondingIndex) => {
    const defaultedCorrespondingIndex = Array.isArray(correspondingIndex)
        ? correspondingIndex[0]
        : correspondingIndex;
    const resumedSession = await (0, Helper_1.resumeSession)(conditionalSession);
    const allSessions = await resumedSession.sessionStorageClient.getAllSessionData();
    const sessionID = (0, Helper_1.didProvideFullSession)(conditionalSession)
        ? conditionalSession.sessionIDInfo[defaultedCorrespondingIndex ?? 0]
        : allSessions[defaultedCorrespondingIndex ?? allSessions.length - 1]
            .sessionID;
    const matchingLeafDatum = allSessions.find((s) => s.sessionID === sessionID);
    if (!sessionID)
        throw new Error(account_1.ERROR_MESSAGES.MISSING_SESSION_ID);
    if (!matchingLeafDatum)
        throw new Error(account_1.ERROR_MESSAGES.NO_LEAF_FOUND);
    if (!matchingLeafDatum.danModuleInfo)
        throw new Error(account_1.ERROR_MESSAGES.NO_DAN_MODULE_INFO);
    const chainIdsMatch = chain.id === matchingLeafDatum?.danModuleInfo?.chainId;
    if (!chainIdsMatch)
        throw new Error(account_1.ERROR_MESSAGES.CHAIN_ID_MISMATCH);
    return { params: { sessionID } };
};
exports.getDanSessionTxParams = getDanSessionTxParams;
const signMessage = async (message, danParams) => {
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
    const wpClient = new walletprovider_sdk_1.WalletProviderServiceClient({
        walletProviderId: "WalletProvider",
        walletProviderUrl: Constants_1.DAN_BACKEND_URL
    });
    const ephSK = (0, Helper_1.hexToUint8Array)(jwt);
    const authModule = new walletprovider_sdk_1.EphAuth(eoaAddress, ephSK);
    const sdk = new walletprovider_sdk_1.NetworkSigner(wpClient, threshold, partiesNumber, authModule);
    const reponse = await sdk.authenticateAndSign(mpcKeyId, message);
    const v = reponse.recid;
    const sigV = v === 0 ? "1b" : "1c";
    const signature = `0x${reponse.sign}${sigV}`;
    return signature;
};
exports.signMessage = signMessage;
exports.danSDK = {
    generateSessionKey: exports.generateSessionKey,
    signMessage: exports.signMessage
};
exports.default = exports.danSDK;
//# sourceMappingURL=dan.js.map