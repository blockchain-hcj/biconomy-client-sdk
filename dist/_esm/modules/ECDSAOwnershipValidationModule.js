import { encodeFunctionData, getAddress, parseAbi, toBytes } from "viem";
import { convertSigner } from "../account/index.js";
import { BaseValidationModule } from "./BaseValidationModule.js";
import { DEFAULT_ECDSA_OWNERSHIP_MODULE, ECDSA_OWNERSHIP_MODULE_ADDRESSES_BY_VERSION } from "./utils/Constants.js";
// Could be renamed with suffix API
export class ECDSAOwnershipValidationModule extends BaseValidationModule {
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
        // Signer needs to be initialised here before defaultValidationModule is set
        const { signer } = await convertSigner(moduleConfig.signer, false);
        const configForConstructor = { ...moduleConfig, signer };
        // TODO: (Joe) stop doing things in a 'create' call after the instance has been created
        const instance = new ECDSAOwnershipValidationModule(configForConstructor);
        if (moduleConfig.moduleAddress) {
            instance.moduleAddress = moduleConfig.moduleAddress;
        }
        else if (moduleConfig.version) {
            const moduleAddr = ECDSA_OWNERSHIP_MODULE_ADDRESSES_BY_VERSION[moduleConfig.version];
            if (!moduleAddr) {
                throw new Error(`Invalid version ${moduleConfig.version}`);
            }
            instance.moduleAddress = moduleAddr;
            instance.version = moduleConfig.version;
        }
        else {
            instance.moduleAddress = DEFAULT_ECDSA_OWNERSHIP_MODULE;
            // Note: in this case Version remains the default one
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
        const moduleAddress = getAddress(this.getAddress());
        const dynamicPart = moduleAddress.substring(2).padEnd(40, "0");
        return `0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000${dynamicPart}000000000000000000000000000000000000000000000000000000000000004181d4b4981670cb18f99f0b4a66446df1bf5b204d24cfcb659bf38ba27a4359b5711649ec2423c5e1247245eba2964679b6a1dbb85c992ae40b9b00c6935b02ff1b00000000000000000000000000000000000000000000000000000000000000`;
    }
    // Note: other modules may need additional attributes to build init data
    async getInitData() {
        const ecdsaOwnerAddress = await this.signer.getAddress();
        const moduleRegistryParsedAbi = parseAbi([
            "function initForSmartAccount(address owner)"
        ]);
        const ecdsaOwnershipInitData = encodeFunctionData({
            abi: moduleRegistryParsedAbi,
            functionName: "initForSmartAccount",
            args: [ecdsaOwnerAddress]
        });
        return ecdsaOwnershipInitData;
    }
    async signUserOpHash(userOpHash) {
        const sig = await this.signer.signMessage({ raw: toBytes(userOpHash) });
        return sig;
    }
    /**
     * Signs a message using the appropriate method based on the type of signer.
     *
     * @param {Uint8Array | string} message - The message to be signed.
     * @returns {Promise<string>} A promise resolving to the signature or error message.
     * @throws {Error} If the signer type is invalid or unsupported.
     */
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
//# sourceMappingURL=ECDSAOwnershipValidationModule.js.map