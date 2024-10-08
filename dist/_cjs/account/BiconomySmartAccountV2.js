"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiconomySmartAccountV2 = void 0;
const viem_1 = require("viem");
const index_js_1 = require("../bundler/index.js");
const modules_1 = require("../modules/index.js");
const utils_js_1 = require("../modules/session-storage/utils.js");
const paymaster_1 = require("../paymaster/index.js");
const _1 = require("./index.js");
const BaseSmartContractAccount_js_1 = require("./BaseSmartContractAccount.js");
const AccountResolver_js_1 = require("./abi/AccountResolver.js");
const Factory_js_1 = require("./abi/Factory.js");
const SmartAccount_js_1 = require("./abi/SmartAccount.js");
const Constants_js_1 = require("./utils/Constants.js");
const Utils_js_1 = require("./utils/Utils.js");
class BiconomySmartAccountV2 extends BaseSmartContractAccount_js_1.BaseSmartContractAccount {
    constructor(biconomySmartAccountConfig) {
        super({
            ...biconomySmartAccountConfig,
            chain: biconomySmartAccountConfig.viemChain ??
                biconomySmartAccountConfig.customChain ??
                (0, _1.getChain)(biconomySmartAccountConfig.chainId),
            rpcClient: biconomySmartAccountConfig.rpcUrl ||
                (0, _1.getChain)(biconomySmartAccountConfig.chainId).rpcUrls.default.http[0],
            entryPointAddress: biconomySmartAccountConfig.entryPointAddress ??
                Constants_js_1.DEFAULT_ENTRYPOINT_ADDRESS,
            accountAddress: biconomySmartAccountConfig.accountAddress ?? undefined,
            factoryAddress: biconomySmartAccountConfig.factoryAddress ??
                Constants_js_1.DEFAULT_BICONOMY_FACTORY_ADDRESS,
        });
        Object.defineProperty(this, "biconomySmartAccountConfig", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: biconomySmartAccountConfig
        });
        Object.defineProperty(this, "sessionData", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "sessionType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "sessionStorageClient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "SENTINEL_MODULE", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "0x0000000000000000000000000000000000000001"
        });
        Object.defineProperty(this, "index", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "chainId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "provider", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "paymaster", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "bundler", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "accountContract", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "defaultFallbackHandlerAddress", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "implementationAddress", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "scanForUpgradedAccountsFromV1", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "maxIndexForScan", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "trulySender", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "trulyNonce", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "defaultValidationModule", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "activeValidationModule", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.sessionData = biconomySmartAccountConfig.sessionData;
        this.sessionType = biconomySmartAccountConfig.sessionType ?? null;
        this.defaultValidationModule =
            biconomySmartAccountConfig.defaultValidationModule;
        this.activeValidationModule =
            biconomySmartAccountConfig.activeValidationModule;
        this.index = biconomySmartAccountConfig.index ?? 0;
        this.chainId = biconomySmartAccountConfig.chainId;
        this.bundler = biconomySmartAccountConfig.bundler;
        this.implementationAddress =
            biconomySmartAccountConfig.implementationAddress ??
                Constants_js_1.BICONOMY_IMPLEMENTATION_ADDRESSES_BY_VERSION.V2_0_0;
        if (biconomySmartAccountConfig.paymasterUrl) {
            this.paymaster = new paymaster_1.Paymaster({
                paymasterUrl: biconomySmartAccountConfig.paymasterUrl,
            });
        }
        else if (biconomySmartAccountConfig.biconomyPaymasterApiKey) {
            this.paymaster = new paymaster_1.Paymaster({
                paymasterUrl: `https://paymaster.biconomy.io/api/v1/${biconomySmartAccountConfig.chainId}/${biconomySmartAccountConfig.biconomyPaymasterApiKey}`,
            });
        }
        else {
            this.paymaster = biconomySmartAccountConfig.paymaster;
        }
        this.bundler = biconomySmartAccountConfig.bundler;
        const defaultFallbackHandlerAddress = this.factoryAddress === Constants_js_1.DEFAULT_BICONOMY_FACTORY_ADDRESS
            ? Constants_js_1.DEFAULT_FALLBACK_HANDLER_ADDRESS
            : biconomySmartAccountConfig.defaultFallbackHandler;
        if (!defaultFallbackHandlerAddress) {
            throw new Error("Default Fallback Handler address is not provided");
        }
        this.defaultFallbackHandlerAddress = defaultFallbackHandlerAddress;
        this.defaultValidationModule =
            biconomySmartAccountConfig.defaultValidationModule;
        this.activeValidationModule =
            biconomySmartAccountConfig.activeValidationModule;
        this.provider = (0, viem_1.createPublicClient)({
            chain: biconomySmartAccountConfig.viemChain ??
                biconomySmartAccountConfig.customChain ??
                (0, _1.getChain)(biconomySmartAccountConfig.chainId),
            transport: (0, viem_1.http)(biconomySmartAccountConfig.rpcUrl ||
                (0, _1.getChain)(biconomySmartAccountConfig.chainId).rpcUrls.default.http[0])
        });
        this.scanForUpgradedAccountsFromV1 =
            biconomySmartAccountConfig.scanForUpgradedAccountsFromV1 ?? false;
        this.maxIndexForScan = biconomySmartAccountConfig.maxIndexForScan ?? 10;
        this.getAccountAddress();
        this.sessionStorageClient = biconomySmartAccountConfig.sessionStorageClient;
    }
    static async create(biconomySmartAccountConfig) {
        let chainId = biconomySmartAccountConfig.chainId;
        let rpcUrl = biconomySmartAccountConfig.customChain?.rpcUrls?.default?.http?.[0] ??
            biconomySmartAccountConfig.rpcUrl;
        let resolvedSmartAccountSigner;
        if (biconomySmartAccountConfig.signer) {
            const signerResult = await (0, _1.convertSigner)(biconomySmartAccountConfig.signer, !!chainId, rpcUrl);
            if (!chainId && !!signerResult.chainId) {
                chainId = signerResult.chainId;
            }
            if (!rpcUrl && !!signerResult.rpcUrl) {
                if ((0, Utils_js_1.isValidRpcUrl)(signerResult.rpcUrl)) {
                    rpcUrl = signerResult.rpcUrl;
                }
            }
            resolvedSmartAccountSigner = signerResult.signer;
        }
        if (!chainId) {
            if (biconomySmartAccountConfig.bundlerUrl) {
                chainId = (0, index_js_1.extractChainIdFromBundlerUrl)(biconomySmartAccountConfig.bundlerUrl);
            }
            else if (biconomySmartAccountConfig.bundler) {
                const bundlerUrlFromBundler = biconomySmartAccountConfig.bundler.getBundlerUrl();
                chainId = (0, index_js_1.extractChainIdFromBundlerUrl)(bundlerUrlFromBundler);
            }
        }
        if (!chainId) {
            throw new Error("chainId required");
        }
        const bundler = biconomySmartAccountConfig.bundler ??
            new index_js_1.Bundler({
                bundlerUrl: biconomySmartAccountConfig.bundlerUrl,
                chainId,
                customChain: biconomySmartAccountConfig.viemChain ??
                    biconomySmartAccountConfig.customChain ??
                    (0, _1.getChain)(chainId),
            });
        let defaultValidationModule = biconomySmartAccountConfig.defaultValidationModule;
        if (!defaultValidationModule) {
            const newModule = await (0, modules_1.createECDSAOwnershipValidationModule)({
                signer: resolvedSmartAccountSigner,
            });
            defaultValidationModule = newModule;
        }
        const activeValidationModule = biconomySmartAccountConfig?.activeValidationModule ??
            defaultValidationModule;
        if (!resolvedSmartAccountSigner) {
            resolvedSmartAccountSigner = await activeValidationModule.getSigner();
        }
        if (!resolvedSmartAccountSigner) {
            throw new Error("signer required");
        }
        const config = {
            ...biconomySmartAccountConfig,
            defaultValidationModule,
            activeValidationModule,
            chainId,
            bundler,
            signer: resolvedSmartAccountSigner,
            rpcUrl,
        };
        if (biconomySmartAccountConfig.skipChainCheck !== true &&
            !biconomySmartAccountConfig.chainId) {
            await (0, Utils_js_1.compareChainIds)(biconomySmartAccountConfig.signer || resolvedSmartAccountSigner, config, false);
        }
        return new BiconomySmartAccountV2(config);
    }
    async getAddress(params) {
        if (this.accountAddress == null) {
            this.accountAddress = await this.getCounterFactualAddress(params);
        }
        return this.accountAddress;
    }
    async getAccountAddress(params) {
        if (this.accountAddress == null || this.accountAddress === undefined) {
            this.accountAddress = await this.getCounterFactualAddress(params);
        }
        return this.accountAddress;
    }
    async getGasEstimate(transactions, buildUseropDto) {
        const { callGasLimit, preVerificationGas, verificationGasLimit, maxFeePerGas, } = await this.buildUserOp(transactions, buildUseropDto);
        const _callGasLimit = BigInt(callGasLimit || 0);
        const _preVerificationGas = BigInt(preVerificationGas || 0);
        const _verificationGasLimit = BigInt(verificationGasLimit || 0);
        const _maxFeePerGas = BigInt(maxFeePerGas || 0);
        if (!buildUseropDto?.paymasterServiceData?.mode) {
            return ((_callGasLimit + _preVerificationGas + _verificationGasLimit) *
                _maxFeePerGas);
        }
        return ((_callGasLimit +
            BigInt(3) * _verificationGasLimit +
            _preVerificationGas) *
            _maxFeePerGas);
    }
    async getBalances(addresses) {
        const accountAddress = await this.getAccountAddress();
        const result = [];
        if (addresses) {
            const tokenContracts = addresses.map((address) => (0, viem_1.getContract)({
                address,
                abi: (0, viem_1.parseAbi)(Constants_js_1.ERC20_ABI),
                client: this.provider,
            }));
            const balancePromises = tokenContracts.map((tokenContract) => tokenContract.read.balanceOf([accountAddress]));
            const decimalsPromises = tokenContracts.map((tokenContract) => tokenContract.read.decimals());
            const [balances, decimalsPerToken] = await Promise.all([
                Promise.all(balancePromises),
                Promise.all(decimalsPromises),
            ]);
            balances.forEach((amount, index) => result.push({
                amount,
                decimals: decimalsPerToken[index],
                address: addresses[index],
                formattedAmount: (0, viem_1.formatUnits)(amount, decimalsPerToken[index]),
                chainId: this.chainId,
            }));
        }
        const balance = await this.provider.getBalance({ address: accountAddress });
        result.push({
            amount: balance,
            decimals: 18,
            address: Constants_js_1.NATIVE_TOKEN_ALIAS,
            formattedAmount: (0, viem_1.formatUnits)(balance, 18),
            chainId: this.chainId,
        });
        return result;
    }
    async withdraw(withdrawalRequests, defaultRecipient, buildUseropDto) {
        const accountAddress = this.accountAddress ?? (await this.getAccountAddress());
        if (!defaultRecipient &&
            withdrawalRequests?.some(({ recipient }) => !recipient)) {
            throw new Error(Constants_js_1.ERROR_MESSAGES.NO_RECIPIENT);
        }
        let tokenRequests = withdrawalRequests?.filter(({ address }) => !(0, Utils_js_1.addressEquals)(address, Constants_js_1.NATIVE_TOKEN_ALIAS)) ?? [];
        const shouldFetchMaxBalances = tokenRequests.some(({ amount }) => !amount);
        if (shouldFetchMaxBalances) {
            const balances = await this.getBalances(tokenRequests.map(({ address }) => address));
            tokenRequests = tokenRequests.map(({ amount, address }, i) => ({
                address,
                amount: amount ?? balances[i].amount,
            }));
        }
        const txs = tokenRequests.map(({ address, amount, recipient: recipientFromRequest }) => ({
            to: address,
            data: (0, viem_1.encodeFunctionData)({
                abi: (0, viem_1.parseAbi)(Constants_js_1.ERC20_ABI),
                functionName: "transfer",
                args: [recipientFromRequest || defaultRecipient, amount],
            }),
        }));
        const nativeTokenRequest = withdrawalRequests?.find(({ address }) => (0, Utils_js_1.addressEquals)(address, Constants_js_1.NATIVE_TOKEN_ALIAS));
        const hasNoRequests = !withdrawalRequests?.length;
        if (!!nativeTokenRequest || hasNoRequests) {
            if (!nativeTokenRequest?.amount &&
                !buildUseropDto?.paymasterServiceData?.mode) {
                throw new Error(Constants_js_1.ERROR_MESSAGES.NATIVE_TOKEN_WITHDRAWAL_WITHOUT_AMOUNT);
            }
            const nativeTokenAmountToWithdraw = nativeTokenRequest?.amount ??
                (await this.provider.getBalance({ address: accountAddress }));
            txs.push({
                to: (nativeTokenRequest?.recipient ?? defaultRecipient),
                value: nativeTokenAmountToWithdraw,
            });
        }
        return this.sendTransaction(txs, buildUseropDto);
    }
    async getCounterFactualAddress(params) {
        const validationModule = params?.validationModule ?? this.defaultValidationModule;
        const index = params?.index ?? this.index;
        const maxIndexForScan = params?.maxIndexForScan ?? this.maxIndexForScan;
        const scanForUpgradedAccountsFromV1 = params?.scanForUpgradedAccountsFromV1 ??
            this.scanForUpgradedAccountsFromV1;
        if (scanForUpgradedAccountsFromV1) {
            const eoaSigner = await validationModule.getSigner();
            const eoaAddress = (await eoaSigner.getAddress());
            const moduleAddress = validationModule.getAddress();
            const moduleSetupData = (await validationModule.getInitData());
            const queryParams = {
                eoaAddress,
                index,
                moduleAddress,
                moduleSetupData,
                maxIndexForScan,
            };
            const accountAddress = await this.getV1AccountsUpgradedToV2(queryParams);
            if (accountAddress !== Constants_js_1.ADDRESS_ZERO) {
                return accountAddress;
            }
        }
        const counterFactualAddressV2 = await this.getCounterFactualAddressV2({
            validationModule,
            index,
        });
        return counterFactualAddressV2;
    }
    async getCounterFactualAddressV2(params) {
        const validationModule = params?.validationModule ?? this.defaultValidationModule;
        const index = params?.index ?? this.index;
        try {
            const initCalldata = (0, viem_1.encodeFunctionData)({
                abi: SmartAccount_js_1.BiconomyAccountAbi,
                functionName: "init",
                args: [
                    this.defaultFallbackHandlerAddress,
                    validationModule.getAddress(),
                    (await validationModule.getInitData()),
                ],
            });
            const proxyCreationCodeHash = (0, viem_1.keccak256)((0, viem_1.encodePacked)(["bytes", "uint256"], [Constants_js_1.PROXY_CREATION_CODE, BigInt(this.implementationAddress)]));
            const salt = (0, viem_1.keccak256)((0, viem_1.encodePacked)(["bytes32", "uint256"], [(0, viem_1.keccak256)(initCalldata), BigInt(index)]));
            const counterFactualAddress = (0, viem_1.getCreate2Address)({
                from: this.factoryAddress,
                salt: salt,
                bytecodeHash: proxyCreationCodeHash,
            });
            return counterFactualAddress;
        }
        catch (e) {
            throw new Error(`Failed to get counterfactual address, ${e}`);
        }
    }
    async _getAccountContract() {
        if (this.accountContract == null) {
            this.accountContract = (0, viem_1.getContract)({
                address: await this.getAddress(),
                abi: SmartAccount_js_1.BiconomyAccountAbi,
                client: this.provider,
            });
        }
        return this.accountContract;
    }
    isActiveValidationModuleDefined() {
        if (!this.activeValidationModule)
            throw new Error("Must provide an instance of active validation module.");
        return true;
    }
    isDefaultValidationModuleDefined() {
        if (!this.defaultValidationModule)
            throw new Error("Must provide an instance of default validation module.");
        return true;
    }
    setActiveValidationModule(validationModule) {
        if (validationModule instanceof modules_1.BaseValidationModule) {
            this.activeValidationModule = validationModule;
        }
        return this;
    }
    setDefaultValidationModule(validationModule) {
        if (validationModule instanceof modules_1.BaseValidationModule) {
            this.defaultValidationModule = validationModule;
        }
        return this;
    }
    async getV1AccountsUpgradedToV2(params) {
        const maxIndexForScan = params.maxIndexForScan ?? this.maxIndexForScan;
        const addressResolver = (0, viem_1.getContract)({
            address: Constants_js_1.ADDRESS_RESOLVER_ADDRESS,
            abi: AccountResolver_js_1.AccountResolverAbi,
            client: {
                public: this.provider,
            },
        });
        if (params.moduleAddress && params.moduleSetupData) {
            const result = await addressResolver.read.resolveAddressesFlexibleForV2([
                params.eoaAddress,
                maxIndexForScan,
                params.moduleAddress,
                params.moduleSetupData,
            ]);
            const desiredV1Account = result.find((smartAccountInfo) => smartAccountInfo.factoryVersion === "v1" &&
                smartAccountInfo.currentVersion === "2.0.0" &&
                Number(smartAccountInfo.deploymentIndex.toString()) === params.index);
            if (desiredV1Account) {
                const smartAccountAddress = desiredV1Account.accountAddress;
                return smartAccountAddress;
            }
            return Constants_js_1.ADDRESS_ZERO;
        }
        return Constants_js_1.ADDRESS_ZERO;
    }
    async getAccountInitCode() {
        this.isDefaultValidationModuleDefined();
        if (await this.isAccountDeployed())
            return "0x";
        return (0, viem_1.concatHex)([
            this.factoryAddress,
            (await this.getFactoryData()) ?? "0x",
        ]);
    }
    async encodeExecute(to, value, data) {
        return (0, viem_1.encodeFunctionData)({
            abi: SmartAccount_js_1.BiconomyAccountAbi,
            functionName: "execute_ncC",
            args: [to, value, data],
        });
    }
    async encodeExecuteBatch(to, value, data) {
        return (0, viem_1.encodeFunctionData)({
            abi: SmartAccount_js_1.BiconomyAccountAbi,
            functionName: "executeBatch_y6U",
            args: [to, value, data],
        });
    }
    async encodeBatchExecute(txs) {
        const [targets, datas, value] = txs.reduce((accum, curr) => {
            accum[0].push(curr.target);
            accum[1].push(curr.data);
            accum[2].push(curr.value || BigInt(0));
            return accum;
        }, [[], [], []]);
        return this.encodeExecuteBatch(targets, value, datas);
    }
    async getDummySignatures(params) {
        const defaultedParams = {
            ...(this.sessionData ? this.sessionData : {}),
            ...params
        };
        this.isActiveValidationModuleDefined();
        return (await this.activeValidationModule.getDummySignature(defaultedParams));
    }
    getDummySignature() {
        throw new Error("Method not implemented! Call getDummySignatures instead.");
    }
    getDummyPaymasterData() {
        return "0x";
    }
    validateUserOp(userOp, requiredFields) {
        for (const field of requiredFields) {
            if ((0, Utils_js_1.isNullOrUndefined)(userOp[field])) {
                throw new Error(`${String(field)} is missing in the UserOp`);
            }
        }
        return true;
    }
    async signUserOp(userOp, params) {
        const defaultedParams = {
            ...(this.sessionData ? this.sessionData : {}),
            ...params,
            rawUserOperation: userOp
        };
        this.isActiveValidationModuleDefined();
        const requiredFields = [
            "sender",
            "nonce",
            "initCode",
            "callData",
            "callGasLimit",
            "verificationGasLimit",
            "preVerificationGas",
            "maxFeePerGas",
            "maxPriorityFeePerGas",
            "paymasterAndData"
        ];
        this.validateUserOp(userOp, requiredFields);
        const userOpHash = await this.getUserOpHash(userOp);
        const moduleSig = (await this.activeValidationModule.signUserOpHash(userOpHash, defaultedParams));
        const signatureWithModuleAddress = this.getSignatureWithModuleAddress(moduleSig, this.activeValidationModule.getAddress());
        userOp.signature = signatureWithModuleAddress;
        return userOp;
    }
    getSignatureWithModuleAddress(moduleSignature, moduleAddress) {
        const moduleAddressToUse = moduleAddress ?? this.activeValidationModule.getAddress();
        const result = (0, viem_1.encodeAbiParameters)((0, viem_1.parseAbiParameters)("bytes, address"), [
            moduleSignature,
            moduleAddressToUse
        ]);
        return result;
    }
    async getPaymasterUserOp(userOp, paymasterServiceData) {
        if (paymasterServiceData.mode === paymaster_1.PaymasterMode.SPONSORED) {
            return this.getPaymasterAndData(userOp, paymasterServiceData);
        }
        if (paymasterServiceData.mode === paymaster_1.PaymasterMode.ERC20) {
            if (paymasterServiceData?.feeQuote) {
                if (this.trulySender && this.trulyNonce) {
                    userOp.sender = this.trulySender;
                    userOp.nonce = this.trulyNonce;
                }
                userOp.verificationGasLimit = 1000000;
                const { feeQuote, spender, maxApproval = false } = paymasterServiceData;
                _1.Logger.log("there is a feeQuote: ", JSON.stringify(feeQuote, null, 2));
                if (!spender)
                    throw new Error(Constants_js_1.ERROR_MESSAGES.SPENDER_REQUIRED);
                if (!feeQuote)
                    throw new Error(Constants_js_1.ERROR_MESSAGES.FAILED_FEE_QUOTE_FETCH);
                if (paymasterServiceData.skipPatchCallData &&
                    paymasterServiceData.skipPatchCallData === true) {
                    return this.getPaymasterAndData(userOp, {
                        ...paymasterServiceData,
                        feeTokenAddress: feeQuote.tokenAddress,
                    });
                }
                const partialUserOp = await this.buildTokenPaymasterUserOp(userOp, {
                    ...paymasterServiceData,
                    spender,
                    maxApproval,
                    feeQuote,
                });
                return this.getPaymasterAndData(partialUserOp, {
                    ...paymasterServiceData,
                    feeTokenAddress: feeQuote.tokenAddress,
                    calculateGasLimits: paymasterServiceData.calculateGasLimits ?? true,
                });
            }
            if (paymasterServiceData?.preferredToken) {
                const { preferredToken } = paymasterServiceData;
                _1.Logger.log("there is a preferred token: ", preferredToken);
                const feeQuotesResponse = await this.getPaymasterFeeQuotesOrData(userOp, paymasterServiceData);
                const spender = feeQuotesResponse.tokenPaymasterAddress;
                const feeQuote = feeQuotesResponse.feeQuotes?.[0];
                if (!spender)
                    throw new Error(Constants_js_1.ERROR_MESSAGES.SPENDER_REQUIRED);
                if (!feeQuote)
                    throw new Error(Constants_js_1.ERROR_MESSAGES.FAILED_FEE_QUOTE_FETCH);
                return this.getPaymasterUserOp(userOp, {
                    ...paymasterServiceData,
                    feeQuote,
                    spender,
                });
            }
            _1.Logger.log("ERC20 mode without feeQuote or preferredToken provided. Passing through unchanged.");
            return userOp;
        }
        throw new Error("Invalid paymaster mode");
    }
    async getPaymasterAndData(userOp, paymasterServiceData) {
        const paymaster = this
            .paymaster;
        const paymasterData = await paymaster.getPaymasterAndData(userOp, paymasterServiceData);
        return { ...userOp, ...paymasterData };
    }
    async getPaymasterFeeQuotesOrData(userOp, feeQuotesOrData) {
        const paymaster = this
            .paymaster;
        const tokenList = feeQuotesOrData?.preferredToken
            ? [feeQuotesOrData?.preferredToken]
            : feeQuotesOrData?.tokenList?.length
                ? feeQuotesOrData?.tokenList
                : [];
        return paymaster.getPaymasterFeeQuotesOrData(userOp, {
            ...feeQuotesOrData,
            tokenList,
        });
    }
    async getTokenFees(manyOrOneTransactions, buildUseropDto) {
        const txs = Array.isArray(manyOrOneTransactions)
            ? manyOrOneTransactions
            : [manyOrOneTransactions];
        const userOp = await this.buildUserOp(txs, buildUseropDto);
        if (!buildUseropDto.paymasterServiceData)
            throw new Error("paymasterServiceData was not provided");
        return this.getPaymasterFeeQuotesOrData(userOp, buildUseropDto.paymasterServiceData);
    }
    async getSupportedTokens() {
        const feeQuotesResponse = await this.getTokenFees({
            data: "0x",
            value: BigInt(0),
            to: await this.getAccountAddress(),
        }, {
            paymasterServiceData: { mode: paymaster_1.PaymasterMode.ERC20 },
        });
        return await Promise.all((feeQuotesResponse?.feeQuotes ?? []).map(async (quote) => {
            const [tokenBalance] = await this.getBalances([
                quote.tokenAddress,
            ]);
            return {
                symbol: quote.symbol,
                tokenAddress: quote.tokenAddress,
                decimal: quote.decimal,
                logoUrl: quote.logoUrl,
                premiumPercentage: quote.premiumPercentage,
                balance: tokenBalance,
            };
        }));
    }
    async sendUserOp(userOp, params) {
        delete userOp.signature;
        const userOperation = await this.signUserOp(userOp, params);
        const bundlerResponse = await this.sendSignedUserOp(userOperation);
        return bundlerResponse;
    }
    async sendSignedUserOp(userOp, simulationType) {
        const requiredFields = [
            "sender",
            "nonce",
            "initCode",
            "callData",
            "callGasLimit",
            "verificationGasLimit",
            "preVerificationGas",
            "maxFeePerGas",
            "maxPriorityFeePerGas",
            "paymasterAndData",
            "signature",
        ];
        this.validateUserOp(userOp, requiredFields);
        if (!this.bundler)
            throw new Error("Bundler is not provided");
        _1.Logger.warn("userOp being sent to the bundler", JSON.stringify(userOp, null, 2));
        const bundlerResponse = await this.bundler.sendUserOp(userOp, simulationType);
        return bundlerResponse;
    }
    async getUserOpHash(userOp) {
        const userOpHash = (0, viem_1.keccak256)((0, Utils_js_1.packUserOp)(userOp, true));
        const enc = (0, viem_1.encodeAbiParameters)((0, viem_1.parseAbiParameters)("bytes32, address, uint256"), [userOpHash, this.entryPoint.address, BigInt(this.chainId)]);
        return (0, viem_1.keccak256)(enc);
    }
    async estimateUserOpGas(userOp, stateOverrideSet) {
        if (!this.bundler)
            throw new Error("Bundler is not provided");
        const requiredFields = [
            "sender",
            "nonce",
            "initCode",
            "callData",
        ];
        this.validateUserOp(userOp, requiredFields);
        const finalUserOp = userOp;
        const { callGasLimit, verificationGasLimit, preVerificationGas, maxFeePerGas, maxPriorityFeePerGas, } = await this.bundler.estimateUserOpGas(userOp, stateOverrideSet);
        if (!userOp.maxFeePerGas &&
            !userOp.maxPriorityFeePerGas &&
            (!maxFeePerGas || !maxPriorityFeePerGas)) {
            const feeData = await this.provider.estimateFeesPerGas();
            if (feeData.maxFeePerGas?.toString()) {
                finalUserOp.maxFeePerGas = `0x${feeData.maxFeePerGas.toString(16)}`;
            }
            else if (feeData.gasPrice?.toString()) {
                finalUserOp.maxFeePerGas = `0x${feeData.gasPrice.toString(16)}`;
            }
            else {
                finalUserOp.maxFeePerGas =
                    `0x${(await this.provider.getGasPrice()).toString(16)}`;
            }
            if (feeData.maxPriorityFeePerGas?.toString()) {
                finalUserOp.maxPriorityFeePerGas =
                    `0x${feeData.maxPriorityFeePerGas?.toString()}`;
            }
            else if (feeData.gasPrice?.toString()) {
                finalUserOp.maxPriorityFeePerGas = (0, viem_1.toHex)(Number(feeData.gasPrice?.toString()));
            }
            else {
                finalUserOp.maxPriorityFeePerGas =
                    `0x${(await this.provider.getGasPrice()).toString(16)}`;
            }
        }
        else {
            finalUserOp.maxFeePerGas =
                (0, viem_1.toHex)(Number(maxFeePerGas)) ?? userOp.maxFeePerGas;
            finalUserOp.maxPriorityFeePerGas =
                (0, viem_1.toHex)(Number(maxPriorityFeePerGas)) ?? userOp.maxPriorityFeePerGas;
        }
        finalUserOp.verificationGasLimit =
            (0, viem_1.toHex)(Number(verificationGasLimit)) ?? userOp.verificationGasLimit;
        finalUserOp.callGasLimit =
            (0, viem_1.toHex)(Number(callGasLimit)) ?? userOp.callGasLimit;
        finalUserOp.preVerificationGas =
            (0, viem_1.toHex)(Number(preVerificationGas)) ?? userOp.preVerificationGas;
        if (!finalUserOp.paymasterAndData) {
            finalUserOp.paymasterAndData = "0x";
        }
        return finalUserOp;
    }
    async getNonce(nonceKey) {
        const nonceSpace = nonceKey ?? 0;
        try {
            const address = await this.getAddress();
            return await this.entryPoint.read.getNonce([address, BigInt(nonceSpace)]);
        }
        catch (e) {
            return BigInt(0);
        }
    }
    async getBuildUserOpNonce(nonceOptions) {
        let nonce = BigInt(0);
        try {
            if (nonceOptions?.nonceOverride) {
                nonce = BigInt(nonceOptions?.nonceOverride);
            }
            else {
                const _nonceSpace = nonceOptions?.nonceKey ?? 0;
                nonce = await this.getNonce(_nonceSpace);
            }
        }
        catch (error) {
            _1.Logger.warn("Error while getting nonce for the account. This is expected for undeployed accounts set nonce to 0");
        }
        return nonce;
    }
    async transferOwnership(newOwner, moduleAddress, buildUseropDto) {
        const encodedCall = (0, viem_1.encodeFunctionData)({
            abi: (0, viem_1.parseAbi)(["function transferOwnership(address newOwner) public"]),
            functionName: "transferOwnership",
            args: [newOwner],
        });
        const transaction = {
            to: moduleAddress,
            data: encodedCall,
        };
        const userOpResponse = await this.sendTransaction(transaction, buildUseropDto);
        return userOpResponse;
    }
    async sendTransaction(manyOrOneTransactions, buildUseropDto, sessionData) {
        let defaultedBuildUseropDto = { ...buildUseropDto } ?? {};
        if (this.sessionType && sessionData) {
            const store = this.sessionStorageClient ?? sessionData?.store;
            const getSessionParameters = await this.getSessionParams({ ...sessionData, store, txs: manyOrOneTransactions });
            defaultedBuildUseropDto = {
                ...defaultedBuildUseropDto,
                ...getSessionParameters
            };
        }
        const userOp = await this.buildUserOp(Array.isArray(manyOrOneTransactions)
            ? manyOrOneTransactions
            : [manyOrOneTransactions], defaultedBuildUseropDto);
        return this.sendUserOp(userOp, { ...defaultedBuildUseropDto?.params });
    }
    async getSessionParams({ leafIndex, store, chain, txs }) {
        const accountAddress = await this.getAccountAddress();
        const defaultedTransactions = txs
            ? Array.isArray(txs)
                ? [...txs]
                : [txs]
            : [];
        const defaultedConditionalSession = store === "DEFAULT_STORE" ? (0, utils_js_1.getDefaultStorageClient)(accountAddress) :
            store ?? (await this.getAccountAddress());
        const defaultedCorrespondingIndexes = ["LAST_LEAF", "LAST_LEAVES"].includes(String(leafIndex)) ? null : leafIndex
            ? (Array.isArray(leafIndex)
                ? leafIndex
                : [leafIndex])
            : null;
        const correspondingIndex = defaultedCorrespondingIndexes
            ? defaultedCorrespondingIndexes[0]
            : null;
        const defaultedChain = chain ?? (0, _1.getChain)(await this.provider.getChainId());
        if (!defaultedChain)
            throw new Error("Chain is not provided");
        if (this.sessionType === "DISTRIBUTED_KEY") {
            return (0, modules_1.getDanSessionTxParams)(defaultedConditionalSession, defaultedChain, correspondingIndex);
        }
        if (this.sessionType === "BATCHED") {
            return (0, modules_1.getBatchSessionTxParams)(defaultedTransactions, defaultedCorrespondingIndexes, defaultedConditionalSession, defaultedChain);
        }
        if (this.sessionType === "STANDARD") {
            return (0, modules_1.getSingleSessionTxParams)(defaultedConditionalSession, defaultedChain, correspondingIndex);
        }
        throw new Error("Session type is not provided");
    }
    async buildERC20UserOpWithoutPaymaster(transactions, buildUseropDto) {
        const to = transactions.map((element) => element.to);
        const data = transactions.map((element) => element.data ?? "0x");
        const value = transactions.map((element) => element.value ?? BigInt(0));
        const initCodeFetchPromise = this.getInitCode();
        const dummySignatureFetchPromise = this.getDummySignatures(buildUseropDto?.params);
        const [nonceFromFetch, initCode, signature] = await Promise.all([
            this.getBuildUserOpNonce(buildUseropDto?.nonceOptions),
            initCodeFetchPromise,
            dummySignatureFetchPromise,
        ]);
        if (transactions.length === 0) {
            throw new Error("Transactions array cannot be empty");
        }
        let callData = "0x";
        if (!buildUseropDto?.useEmptyDeployCallData) {
            if (transactions.length > 1 || buildUseropDto?.forceEncodeForBatch) {
                callData = await this.encodeExecuteBatch(to, value, data);
            }
            else {
                callData = await this.encodeExecute(to[0], value[0], data[0]);
            }
        }
        let userOp = {
            sender: (await this.getAccountAddress()),
            nonce: (0, viem_1.toHex)(nonceFromFetch),
            initCode,
            callData,
        };
        userOp.signature = signature;
        userOp.paymasterAndData = buildUseropDto?.dummyPndOverride ?? "0x";
        userOp = await this.estimateUserOpGas(userOp);
        return userOp;
    }
    async getERC20UserOpWithPaymaster(userOp, trueSender, trueNonce, buildUseropDto) {
        this.trulySender = trueSender;
        this.trulyNonce = trueNonce;
        if (buildUseropDto?.paymasterServiceData) {
            userOp = await this.getPaymasterUserOp(userOp, buildUseropDto.paymasterServiceData);
        }
        return userOp;
    }
    async buildUserOp(transactions, buildUseropDto) {
        const to = transactions.map((element) => element.to);
        const data = transactions.map((element) => element.data ?? "0x");
        const value = transactions.map((element) => element.value ?? BigInt(0));
        const initCodeFetchPromise = this.getInitCode();
        const dummySignatureFetchPromise = this.getDummySignatures(buildUseropDto?.params);
        const [nonceFromFetch, initCode, signature] = await Promise.all([
            this.getBuildUserOpNonce(buildUseropDto?.nonceOptions),
            initCodeFetchPromise,
            dummySignatureFetchPromise,
        ]);
        if (transactions.length === 0) {
            throw new Error("Transactions array cannot be empty");
        }
        let callData = "0x";
        if (!buildUseropDto?.useEmptyDeployCallData) {
            if (transactions.length > 1 || buildUseropDto?.forceEncodeForBatch) {
                callData = await this.encodeExecuteBatch(to, value, data);
            }
            else {
                callData = await this.encodeExecute(to[0], value[0], data[0]);
            }
        }
        let userOp = {
            sender: (await this.getAccountAddress()),
            nonce: (0, viem_1.toHex)(nonceFromFetch),
            initCode,
            callData,
        };
        userOp.signature = signature;
        userOp.paymasterAndData = buildUseropDto?.dummyPndOverride ?? "0x";
        if (buildUseropDto?.paymasterServiceData &&
            buildUseropDto?.paymasterServiceData.mode === paymaster_1.PaymasterMode.SPONSORED &&
            this.paymaster instanceof paymaster_1.BiconomyPaymaster) {
            const gasFeeValues = await this.bundler?.getGasFeeValues();
            userOp.maxFeePerGas = gasFeeValues?.maxFeePerGas;
            userOp.maxPriorityFeePerGas = gasFeeValues?.maxPriorityFeePerGas;
            if (buildUseropDto.gasOffset) {
                userOp = await this.estimateUserOpGas(userOp);
                const { verificationGasLimitOffsetPct, preVerificationGasOffsetPct, callGasLimitOffsetPct, maxFeePerGasOffsetPct, maxPriorityFeePerGasOffsetPct, } = buildUseropDto.gasOffset;
                userOp.verificationGasLimit = (0, viem_1.toHex)(Number.parseInt((Number(userOp.verificationGasLimit ?? 0) *
                    (0, Utils_js_1.convertToFactor)(verificationGasLimitOffsetPct)).toString()));
                userOp.preVerificationGas = (0, viem_1.toHex)(Number.parseInt((Number(userOp.preVerificationGas ?? 0) *
                    (0, Utils_js_1.convertToFactor)(preVerificationGasOffsetPct)).toString()));
                userOp.callGasLimit = (0, viem_1.toHex)(Number.parseInt((Number(userOp.callGasLimit ?? 0) *
                    (0, Utils_js_1.convertToFactor)(callGasLimitOffsetPct)).toString()));
                userOp.maxFeePerGas = (0, viem_1.toHex)(Number.parseInt((Number(userOp.maxFeePerGas ?? 0) *
                    (0, Utils_js_1.convertToFactor)(maxFeePerGasOffsetPct)).toString()));
                userOp.maxPriorityFeePerGas = (0, viem_1.toHex)(Number.parseInt((Number(userOp.maxPriorityFeePerGas ?? 0) *
                    (0, Utils_js_1.convertToFactor)(maxPriorityFeePerGasOffsetPct)).toString()));
                userOp = await this.getPaymasterUserOp(userOp, {
                    ...buildUseropDto.paymasterServiceData,
                    calculateGasLimits: false,
                });
                return userOp;
            }
            if (buildUseropDto.paymasterServiceData.calculateGasLimits === false) {
                userOp = await this.estimateUserOpGas(userOp);
            }
            userOp = await this.getPaymasterUserOp(userOp, buildUseropDto.paymasterServiceData);
            return userOp;
        }
        userOp = await this.estimateUserOpGas(userOp);
        if (buildUseropDto?.gasOffset) {
            if (buildUseropDto?.paymasterServiceData) {
                userOp = await this.getPaymasterUserOp(userOp, {
                    ...buildUseropDto.paymasterServiceData,
                    calculateGasLimits: false,
                });
            }
            const { verificationGasLimitOffsetPct, preVerificationGasOffsetPct, callGasLimitOffsetPct, maxFeePerGasOffsetPct, maxPriorityFeePerGasOffsetPct, } = buildUseropDto.gasOffset;
            userOp.verificationGasLimit = (0, viem_1.toHex)(Number.parseInt((Number(userOp.verificationGasLimit ?? 0) *
                (0, Utils_js_1.convertToFactor)(verificationGasLimitOffsetPct)).toString()));
            userOp.preVerificationGas = (0, viem_1.toHex)(Number.parseInt((Number(userOp.preVerificationGas ?? 0) *
                (0, Utils_js_1.convertToFactor)(preVerificationGasOffsetPct)).toString()));
            userOp.callGasLimit = (0, viem_1.toHex)(Number.parseInt((Number(userOp.callGasLimit ?? 0) *
                (0, Utils_js_1.convertToFactor)(callGasLimitOffsetPct)).toString()));
            userOp.maxFeePerGas = (0, viem_1.toHex)(Number.parseInt((Number(userOp.maxFeePerGas ?? 0) *
                (0, Utils_js_1.convertToFactor)(maxFeePerGasOffsetPct)).toString()));
            userOp.maxPriorityFeePerGas = (0, viem_1.toHex)(Number.parseInt((Number(userOp.maxPriorityFeePerGas ?? 0) *
                (0, Utils_js_1.convertToFactor)(maxPriorityFeePerGasOffsetPct)).toString()));
            return userOp;
        }
        if (buildUseropDto?.paymasterServiceData) {
            userOp = await this.getPaymasterUserOp(userOp, buildUseropDto.paymasterServiceData);
        }
        return userOp;
    }
    validateUserOpAndPaymasterRequest(userOp, tokenPaymasterRequest) {
        if ((0, Utils_js_1.isNullOrUndefined)(userOp.callData)) {
            throw new Error("UserOp callData cannot be undefined");
        }
        const feeTokenAddress = tokenPaymasterRequest?.feeQuote?.tokenAddress;
        _1.Logger.warn("Requested fee token is ", feeTokenAddress);
        if (!feeTokenAddress || feeTokenAddress === Constants_js_1.ADDRESS_ZERO) {
            throw new Error("Invalid or missing token address. Token address must be part of the feeQuote in tokenPaymasterRequest");
        }
        const spender = tokenPaymasterRequest?.spender;
        _1.Logger.warn("Spender address is ", spender);
        if (!spender || spender === Constants_js_1.ADDRESS_ZERO) {
            throw new Error("Invalid or missing spender address. Sepnder address must be part of tokenPaymasterRequest");
        }
    }
    async buildTokenPaymasterUserOp(userOp, tokenPaymasterRequest) {
        this.validateUserOpAndPaymasterRequest(userOp, tokenPaymasterRequest);
        try {
            let batchTo = [];
            let batchValue = [];
            let batchData = [];
            let newCallData = userOp.callData;
            _1.Logger.warn("Received information about fee token address and quote ", tokenPaymasterRequest.toString());
            if (this.paymaster && this.paymaster instanceof paymaster_1.Paymaster) {
                const approvalRequest = await this.paymaster.buildTokenApprovalTransaction(tokenPaymasterRequest);
                _1.Logger.warn("ApprovalRequest is for erc20 token ", approvalRequest.to);
                if (approvalRequest.data === "0x" ||
                    approvalRequest.to === Constants_js_1.ADDRESS_ZERO) {
                    return userOp;
                }
                if ((0, Utils_js_1.isNullOrUndefined)(userOp.callData)) {
                    throw new Error("UserOp callData cannot be undefined");
                }
                const decodedSmartAccountData = (0, viem_1.decodeFunctionData)({
                    abi: SmartAccount_js_1.BiconomyAccountAbi,
                    data: userOp.callData,
                });
                if (!decodedSmartAccountData) {
                    throw new Error("Could not parse userOp call data for this smart account");
                }
                const smartAccountExecFunctionName = decodedSmartAccountData.functionName;
                _1.Logger.warn(`Originally an ${smartAccountExecFunctionName} method call for Biconomy Account V2`);
                if (smartAccountExecFunctionName === "execute" ||
                    smartAccountExecFunctionName === "execute_ncC") {
                    const methodArgsSmartWalletExecuteCall = decodedSmartAccountData.args;
                    const toOriginal = methodArgsSmartWalletExecuteCall[0];
                    const valueOriginal = methodArgsSmartWalletExecuteCall[1];
                    const dataOriginal = methodArgsSmartWalletExecuteCall[2];
                    batchTo.push(toOriginal);
                    batchValue.push(valueOriginal);
                    batchData.push(dataOriginal);
                }
                else if (smartAccountExecFunctionName === "executeBatch" ||
                    smartAccountExecFunctionName === "executeBatch_y6U") {
                    const methodArgsSmartWalletExecuteCall = decodedSmartAccountData.args;
                    batchTo = [...methodArgsSmartWalletExecuteCall[0]];
                    batchValue = [...methodArgsSmartWalletExecuteCall[1]];
                    batchData = [...methodArgsSmartWalletExecuteCall[2]];
                }
                if (approvalRequest.to &&
                    approvalRequest.data &&
                    approvalRequest.value) {
                    batchTo = [approvalRequest.to, ...batchTo];
                    batchValue = [
                        BigInt(Number(approvalRequest.value.toString())),
                        ...batchValue,
                    ];
                    batchData = [approvalRequest.data, ...batchData];
                    newCallData = await this.encodeExecuteBatch(batchTo, batchValue, batchData);
                }
                const finalUserOp = {
                    ...userOp,
                    callData: newCallData,
                };
                return finalUserOp;
            }
        }
        catch (error) {
            _1.Logger.log("Failed to update userOp. Sending back original op");
            _1.Logger.error("Failed to update callData with error", JSON.stringify(error));
            return userOp;
        }
        return userOp;
    }
    async signUserOpHash(userOpHash, params) {
        this.isActiveValidationModuleDefined();
        const moduleSig = (await this.activeValidationModule.signUserOpHash(userOpHash, params));
        const signatureWithModuleAddress = (0, viem_1.encodeAbiParameters)((0, viem_1.parseAbiParameters)("bytes, address"), [moduleSig, this.activeValidationModule.getAddress()]);
        return signatureWithModuleAddress;
    }
    async deploy(buildUseropDto) {
        const accountAddress = this.accountAddress ?? (await this.getAccountAddress());
        const byteCode = await this.provider?.getBytecode({
            address: accountAddress,
        });
        if (byteCode !== undefined) {
            throw new Error(Constants_js_1.ERROR_MESSAGES.ACCOUNT_ALREADY_DEPLOYED);
        }
        if (!buildUseropDto?.paymasterServiceData?.mode) {
            const nativeTokenBalance = await this.provider?.getBalance({
                address: accountAddress,
            });
            if (nativeTokenBalance === BigInt(0)) {
                throw new Error(Constants_js_1.ERROR_MESSAGES.NO_NATIVE_TOKEN_BALANCE_DURING_DEPLOY);
            }
        }
        const useEmptyDeployCallData = true;
        return this.sendTransaction({
            to: accountAddress,
            data: "0x",
        }, { ...buildUseropDto, useEmptyDeployCallData });
    }
    async getFactoryData() {
        if (await this.isAccountDeployed())
            return undefined;
        this.isDefaultValidationModuleDefined();
        return (0, viem_1.encodeFunctionData)({
            abi: Factory_js_1.BiconomyFactoryAbi,
            functionName: "deployCounterFactualAccount",
            args: [
                this.defaultValidationModule.getAddress(),
                (await this.defaultValidationModule.getInitData()),
                BigInt(this.index),
            ],
        });
    }
    async signMessage(message) {
        let signature;
        this.isActiveValidationModuleDefined();
        const dataHash = typeof message === "string" ? (0, viem_1.toBytes)(message) : message;
        signature = await this.activeValidationModule.signMessage(dataHash);
        const potentiallyIncorrectV = Number.parseInt(signature.slice(-2), 16);
        if (![27, 28].includes(potentiallyIncorrectV)) {
            const correctV = potentiallyIncorrectV + 27;
            signature = signature.slice(0, -2) + correctV.toString(16);
        }
        if (signature.slice(0, 2) !== "0x") {
            signature = `0x${signature}`;
        }
        signature = (0, viem_1.encodeAbiParameters)([{ type: "bytes" }, { type: "address" }], [signature, this.defaultValidationModule.getAddress()]);
        if (await this.isAccountDeployed()) {
            return signature;
        }
        const abiEncodedMessage = (0, viem_1.encodeAbiParameters)([
            {
                type: "address",
                name: "create2Factory",
            },
            {
                type: "bytes",
                name: "factoryCalldata",
            },
            {
                type: "bytes",
                name: "originalERC1271Signature",
            },
        ], [
            this.getFactoryAddress() ?? "0x",
            (await this.getFactoryData()) ?? "0x",
            signature,
        ]);
        return (0, viem_1.concat)([abiEncodedMessage, Constants_js_1.MAGIC_BYTES]);
    }
    async getIsValidSignatureData(messageHash, signature) {
        return (0, viem_1.encodeFunctionData)({
            abi: SmartAccount_js_1.BiconomyAccountAbi,
            functionName: "isValidSignature",
            args: [messageHash, signature],
        });
    }
    async enableModule(moduleAddress) {
        const tx = await this.getEnableModuleData(moduleAddress);
        const partialUserOp = await this.buildUserOp([tx]);
        return this.sendUserOp(partialUserOp);
    }
    async getEnableModuleData(moduleAddress) {
        const callData = (0, viem_1.encodeFunctionData)({
            abi: SmartAccount_js_1.BiconomyAccountAbi,
            functionName: "enableModule",
            args: [moduleAddress],
        });
        const tx = {
            to: await this.getAddress(),
            value: "0x00",
            data: callData,
        };
        return tx;
    }
    async getSetupAndEnableModuleData(moduleAddress, moduleSetupData) {
        const callData = (0, viem_1.encodeFunctionData)({
            abi: SmartAccount_js_1.BiconomyAccountAbi,
            functionName: "setupAndEnableModule",
            args: [moduleAddress, moduleSetupData],
        });
        const tx = {
            to: await this.getAddress(),
            value: "0x00",
            data: callData,
        };
        return tx;
    }
    async disableModule(prevModule, moduleAddress) {
        const tx = await this.getDisableModuleData(prevModule, moduleAddress);
        const partialUserOp = await this.buildUserOp([tx]);
        return this.sendUserOp(partialUserOp);
    }
    async getDisableModuleData(prevModule, moduleAddress) {
        const callData = (0, viem_1.encodeFunctionData)({
            abi: SmartAccount_js_1.BiconomyAccountAbi,
            functionName: "disableModule",
            args: [prevModule, moduleAddress],
        });
        const tx = {
            to: await this.getAddress(),
            value: "0x00",
            data: callData,
        };
        return tx;
    }
    async isModuleEnabled(moduleAddress) {
        const accountContract = await this._getAccountContract();
        return accountContract.read.isModuleEnabled([moduleAddress]);
    }
    async getAllModules(pageSize) {
        const _pageSize = pageSize ?? 100;
        const accountContract = await this._getAccountContract();
        const result = await accountContract.read.getModulesPaginated([
            this.SENTINEL_MODULE,
            BigInt(_pageSize),
        ]);
        const modules = result[0];
        return modules;
    }
}
exports.BiconomySmartAccountV2 = BiconomySmartAccountV2;
//# sourceMappingURL=BiconomySmartAccountV2.js.map