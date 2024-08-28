"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDebugging = void 0;
const VARS_T0_CHECK = [
    "BICONOMY_SDK_DEBUG",
    "REACT_APP_BICONOMY_SDK_DEBUG",
    "NEXT_PUBLIC_BICONOMY_SDK_DEBUG"
];
const isDebugging = () => {
    try {
        return VARS_T0_CHECK.some((key) => process?.env?.[key]?.toString() === "true");
    }
    catch (e) {
        return false;
    }
};
exports.isDebugging = isDebugging;
//# sourceMappingURL=Helpers.js.map