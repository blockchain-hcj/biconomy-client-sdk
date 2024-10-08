export const ECDSAModuleAbi = [
    {
        inputs: [
            { internalType: "address", name: "smartAccount", type: "address" }
        ],
        name: "AlreadyInitedForSmartAccount",
        type: "error"
    },
    {
        inputs: [
            { internalType: "address", name: "smartAccount", type: "address" }
        ],
        name: "NoOwnerRegisteredForSmartAccount",
        type: "error"
    },
    {
        inputs: [{ internalType: "address", name: "account", type: "address" }],
        name: "NotEOA",
        type: "error"
    },
    { inputs: [], name: "WrongSignatureLength", type: "error" },
    { inputs: [], name: "ZeroAddressNotAllowedAsOwner", type: "error" },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "smartAccount",
                type: "address"
            },
            {
                indexed: true,
                internalType: "address",
                name: "oldOwner",
                type: "address"
            },
            {
                indexed: true,
                internalType: "address",
                name: "newOwner",
                type: "address"
            }
        ],
        name: "OwnershipTransferred",
        type: "event"
    },
    {
        inputs: [],
        name: "NAME",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "VERSION",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            { internalType: "address", name: "smartAccount", type: "address" }
        ],
        name: "getOwner",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [{ internalType: "address", name: "eoaOwner", type: "address" }],
        name: "initForSmartAccount",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            { internalType: "bytes32", name: "dataHash", type: "bytes32" },
            { internalType: "bytes", name: "moduleSignature", type: "bytes" }
        ],
        name: "isValidSignature",
        outputs: [{ internalType: "bytes4", name: "", type: "bytes4" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [
            { internalType: "bytes32", name: "dataHash", type: "bytes32" },
            { internalType: "bytes", name: "moduleSignature", type: "bytes" },
            { internalType: "address", name: "smartAccount", type: "address" }
        ],
        name: "isValidSignatureForAddress",
        outputs: [{ internalType: "bytes4", name: "", type: "bytes4" }],
        stateMutability: "view",
        type: "function"
    },
    {
        inputs: [],
        name: "renounceOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [{ internalType: "address", name: "owner", type: "address" }],
        name: "transferOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    },
    {
        inputs: [
            {
                components: [
                    { internalType: "address", name: "sender", type: "address" },
                    { internalType: "uint256", name: "nonce", type: "uint256" },
                    { internalType: "bytes", name: "initCode", type: "bytes" },
                    { internalType: "bytes", name: "callData", type: "bytes" },
                    { internalType: "uint256", name: "callGasLimit", type: "uint256" },
                    {
                        internalType: "uint256",
                        name: "verificationGasLimit",
                        type: "uint256"
                    },
                    {
                        internalType: "uint256",
                        name: "preVerificationGas",
                        type: "uint256"
                    },
                    { internalType: "uint256", name: "maxFeePerGas", type: "uint256" },
                    {
                        internalType: "uint256",
                        name: "maxPriorityFeePerGas",
                        type: "uint256"
                    },
                    { internalType: "bytes", name: "paymasterAndData", type: "bytes" },
                    { internalType: "bytes", name: "signature", type: "bytes" }
                ],
                internalType: "struct UserOperation",
                name: "userOp",
                type: "tuple"
            },
            { internalType: "bytes32", name: "userOpHash", type: "bytes32" }
        ],
        name: "validateUserOp",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
    }
];
//# sourceMappingURL=ECDSAModule.js.map