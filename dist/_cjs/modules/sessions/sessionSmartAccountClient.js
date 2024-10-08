"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSessionParams = exports.toSupportedSigner = exports.createSessionSmartAccountClient = void 0;
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const account_1 = require("../../account/index.js");
const index_js_1 = require("../index.js");
const createSessionSmartAccountClient = async (biconomySmartAccountConfig, conditionalSession, sessionType) => {
    let defaultedSessionType = "STANDARD";
    if (sessionType === true || sessionType === "BATCHED")
        defaultedSessionType = "BATCHED";
    if (sessionType === "DISTRIBUTED_KEY")
        defaultedSessionType = "DISTRIBUTED_KEY";
    const defaultedSessionStore = conditionalSession !== "DEFAULT_STORE" ? conditionalSession : biconomySmartAccountConfig.accountAddress;
    const { sessionStorageClient, sessionIDInfo } = await (0, index_js_1.resumeSession)(defaultedSessionStore);
    const account = (0, accounts_1.privateKeyToAccount)((0, accounts_1.generatePrivateKey)());
    const chain = biconomySmartAccountConfig.viemChain ??
        biconomySmartAccountConfig.customChain ??
        (0, account_1.getChain)(biconomySmartAccountConfig.chainId);
    const incompatibleSigner = (0, viem_1.createWalletClient)({
        account,
        chain,
        transport: (0, viem_1.http)(),
    });
    let sessionData;
    try {
        const sessionID = sessionIDInfo?.[0];
        const sessionSigner = await sessionStorageClient.getSignerBySession({
            sessionID,
        }, chain);
        sessionData =
            defaultedSessionType === "STANDARD"
                ? {
                    sessionID,
                    sessionSigner,
                }
                : undefined;
    }
    catch (e) { }
    const sessionModule = await (0, index_js_1.createSessionKeyManagerModule)({
        smartAccountAddress: biconomySmartAccountConfig.accountAddress,
        sessionStorageClient,
    });
    const batchedSessionValidationModule = await (0, index_js_1.createBatchedSessionRouterModule)({
        smartAccountAddress: biconomySmartAccountConfig.accountAddress,
        sessionKeyManagerModule: sessionModule,
    });
    const danSessionValidationModule = await (0, index_js_1.createDANSessionKeyManagerModule)({
        smartAccountAddress: biconomySmartAccountConfig.accountAddress,
        sessionStorageClient,
    });
    const activeValidationModule = defaultedSessionType === "BATCHED"
        ? batchedSessionValidationModule
        : defaultedSessionType === "STANDARD"
            ? sessionModule
            : danSessionValidationModule;
    return await (0, account_1.createSmartAccountClient)({
        ...biconomySmartAccountConfig,
        signer: incompatibleSigner,
        activeValidationModule,
        sessionData,
        sessionType: defaultedSessionType,
        sessionStorageClient,
    });
};
exports.createSessionSmartAccountClient = createSessionSmartAccountClient;
const toSupportedSigner = (privateKey, chain) => {
    const parsedPrivateKey = privateKey.startsWith("0x")
        ? privateKey
        : `0x${privateKey}`;
    const account = (0, accounts_1.privateKeyToAccount)(parsedPrivateKey);
    return (0, viem_1.createWalletClient)({
        account,
        chain,
        transport: (0, viem_1.http)(),
    });
};
exports.toSupportedSigner = toSupportedSigner;
const toSessionParams = (privateKey, sessionIDs, chain) => sessionIDs.map((sessionID) => ({
    sessionID,
    sessionSigner: (0, exports.toSupportedSigner)(privateKey, chain),
}));
exports.toSessionParams = toSessionParams;
//# sourceMappingURL=sessionSmartAccountClient.js.map