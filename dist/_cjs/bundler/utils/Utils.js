"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractChainIdFromPaymasterUrl = exports.extractChainIdFromBundlerUrl = void 0;
const extractChainIdFromBundlerUrl = (url) => {
    try {
        const regex = /\/api\/v2\/(\d+)\/[a-zA-Z0-9.-]+$/;
        const match = regex.exec(url);
        return Number.parseInt(match[1]);
    }
    catch (error) {
        throw new Error("Invalid chain id");
    }
};
exports.extractChainIdFromBundlerUrl = extractChainIdFromBundlerUrl;
const extractChainIdFromPaymasterUrl = (url) => {
    try {
        const regex = /\/api\/v\d+\/(\d+)\//;
        const match = regex.exec(url);
        if (!match) {
            throw new Error("Invalid URL format");
        }
        return Number.parseInt(match[1]);
    }
    catch (error) {
        throw new Error("Invalid chain id");
    }
};
exports.extractChainIdFromPaymasterUrl = extractChainIdFromPaymasterUrl;
//# sourceMappingURL=Utils.js.map