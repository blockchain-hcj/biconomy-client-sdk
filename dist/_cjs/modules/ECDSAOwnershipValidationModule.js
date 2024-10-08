"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ECDSAOwnershipValidationModule = void 0;
const viem_1 = require("viem");
const account_1 = require("../account/index.js");
const BaseValidationModule_js_1 = require("./BaseValidationModule.js");
const Constants_js_1 = require("./utils/Constants.js");
class ECDSAOwnershipValidationModule extends BaseValidationModule_js_1.BaseValidationModule {
    constructor(moduleConfig) {
        super(moduleConfig);
        Object.defineProperty(this, "signer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "moduleAddress", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "version", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "V1_0_0"
        });
        this.signer = moduleConfig.signer;
    }
    static async create(moduleConfig) {
        const { signer } = await (0, account_1.convertSigner)(moduleConfig.signer, false);
        const configForConstructor = { ...moduleConfig, signer };
        const instance = new ECDSAOwnershipValidationModule(configForConstructor);
        if (moduleConfig.moduleAddress) {
            instance.moduleAddress = moduleConfig.moduleAddress;
        }
        else if (moduleConfig.version) {
            const moduleAddr = Constants_js_1.ECDSA_OWNERSHIP_MODULE_ADDRESSES_BY_VERSION[moduleConfig.version];
            if (!moduleAddr) {
                throw new Error(`Invalid version ${moduleConfig.version}`);
            }
            instance.moduleAddress = moduleAddr;
            instance.version = moduleConfig.version;
        }
        else {
            instance.moduleAddress = Constants_js_1.DEFAULT_ECDSA_OWNERSHIP_MODULE;
        }
        return instance;
    }
    getAddress() {
        return this.moduleAddress;
    }
    async getSigner() {
        return Promise.resolve(this.signer);
    }
    async getDummySignature() {
        const moduleAddress = (0, viem_1.getAddress)(this.getAddress());
        const dynamicPart = moduleAddress.substring(2).padEnd(40, "0");
        return `0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000${dynamicPart}000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000`;
    }
    async getInitData() {
        const ecdsaOwnerAddress = await this.signer.getAddress();
        const moduleRegistryParsedAbi = (0, viem_1.parseAbi)([
            "function initForSmartAccount(address owner)"
        ]);
        const ecdsaOwnershipInitData = (0, viem_1.encodeFunctionData)({
            abi: moduleRegistryParsedAbi,
            functionName: "initForSmartAccount",
            args: [ecdsaOwnerAddress]
        });
        return ecdsaOwnershipInitData;
    }
    async signUserOpHash(userOpHash) {
        const sig = await this.signer.signMessage({ raw: (0, viem_1.toBytes)(userOpHash) });
        return sig;
    }
    async signMessage(_message) {
        const message = typeof _message === "string" ? _message : { raw: _message };
        let signature = await this.signer.signMessage(message);
        const potentiallyIncorrectV = Number.parseInt(signature.slice(-2), 16);
        if (![27, 28].includes(potentiallyIncorrectV)) {
            const correctV = potentiallyIncorrectV + 27;
            signature = signature.slice(0, -2) + correctV.toString(16);
        }
        return signature;
    }
}
exports.ECDSAOwnershipValidationModule = ECDSAOwnershipValidationModule;
//# sourceMappingURL=ECDSAOwnershipValidationModule.js.map