"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ENTRYPOINT_ADDRESS = exports.UserOpWaitForTxHashMaxDurationIntervals = exports.UserOpReceiptMaxDurationIntervals = exports.UserOpWaitForTxHashIntervals = exports.UserOpReceiptIntervals = void 0;
exports.UserOpReceiptIntervals = {
    [1]: 10000
};
exports.UserOpWaitForTxHashIntervals = {
    [1]: 1000
};
exports.UserOpReceiptMaxDurationIntervals = {
    [1]: 300000,
    [80002]: 50000,
    [137]: 60000,
    [56]: 50000,
    [97]: 50000,
    [421613]: 50000,
    [42161]: 50000,
    [59140]: 50000
};
exports.UserOpWaitForTxHashMaxDurationIntervals = {
    [1]: 20000
};
exports.DEFAULT_ENTRYPOINT_ADDRESS = "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789";
//# sourceMappingURL=Constants.js.map