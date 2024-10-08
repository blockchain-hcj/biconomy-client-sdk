"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERC20_ABI = exports.ADDRESS_ZERO = exports.ENTRYPOINT_ADDRESS = exports.MAX_UINT256 = void 0;
exports.MAX_UINT256 = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
exports.ENTRYPOINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
exports.ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
exports.ERC20_ABI = [
    "function transfer(address to, uint256 value) external returns (bool)",
    "function transferFrom(address from, address to, uint256 value) external returns (bool)",
    "function approve(address spender, uint256 value) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address owner) external view returns (uint256)"
];
//# sourceMappingURL=Constants.js.map