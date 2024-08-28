"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAccountSigner = void 0;
const accounts_1 = require("viem/accounts");
class LocalAccountSigner {
    constructor(inner) {
        Object.defineProperty(this, "inner", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "signerType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "signMessage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (message) => {
                return this.inner.signMessage({ message });
            }
        });
        Object.defineProperty(this, "signTypedData", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async (params) => {
                return this.inner.signTypedData(params);
            }
        });
        Object.defineProperty(this, "getAddress", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: async () => {
                return this.inner.address;
            }
        });
        this.inner = inner;
        this.signerType = inner.type;
    }
    static mnemonicToAccountSigner(key) {
        const signer = (0, accounts_1.mnemonicToAccount)(key);
        return new LocalAccountSigner(signer);
    }
    static privateKeyToAccountSigner(key) {
        const signer = (0, accounts_1.privateKeyToAccount)(key);
        return new LocalAccountSigner(signer);
    }
}
exports.LocalAccountSigner = LocalAccountSigner;
//# sourceMappingURL=local-account.js.map