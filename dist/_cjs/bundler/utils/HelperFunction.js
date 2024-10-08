"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimestampInSeconds = exports.transformUserOP = void 0;
const transformUserOP = (userOp) => {
    try {
        const userOperation = { ...userOp };
        const keys = [
            "nonce",
            "callGasLimit",
            "verificationGasLimit",
            "preVerificationGas",
            "maxFeePerGas",
            "maxPriorityFeePerGas"
        ];
        for (const key of keys) {
            if (userOperation[key] && userOperation[key] !== "0x") {
                userOperation[key] = `0x${BigInt(userOp[key]).toString(16)}`;
            }
        }
        return userOperation;
    }
    catch (error) {
        throw `Failed to transform user operation: ${error}`;
    }
};
exports.transformUserOP = transformUserOP;
const getTimestampInSeconds = () => {
    return Math.floor(Date.now() / 1000);
};
exports.getTimestampInSeconds = getTimestampInSeconds;
//# sourceMappingURL=HelperFunction.js.map