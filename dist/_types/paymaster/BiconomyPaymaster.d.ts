import { type BiconomyTokenPaymasterRequest, type Transaction, type UserOperationStruct } from "../account";
import type { IHybridPaymaster } from "./interfaces/IHybridPaymaster.js";
import { type FeeQuotesOrDataDto, type FeeQuotesOrDataResponse, type PaymasterAndDataResponse, type PaymasterConfig, type SponsorUserOperationDto } from "./utils/Types.js";
/**
 * @dev Hybrid - Generic Gas Abstraction paymaster
 */
export declare class BiconomyPaymaster implements IHybridPaymaster<SponsorUserOperationDto> {
    paymasterConfig: PaymasterConfig;
    constructor(config: PaymasterConfig);
    /**
     * @dev Prepares the user operation by resolving properties and converting certain values to hexadecimal format.
     * @param userOp The partial user operation.
     * @returns A Promise that resolves to the prepared partial user operation.
     */
    private prepareUserOperation;
    /**
     * @dev Builds a token approval transaction for the Biconomy token paymaster.
     * @param tokenPaymasterRequest The token paymaster request data. This will include information about chosen feeQuote, spender address and optional flag to provide maxApproval
     * @param provider Optional provider object.
     * @returns A Promise that resolves to the built transaction object.
     */
    buildTokenApprovalTransaction(tokenPaymasterRequest: BiconomyTokenPaymasterRequest): Promise<Transaction>;
    /**
     * @dev Retrieves paymaster fee quotes or data based on the provided user operation and paymaster service data.
     * @param userOp The partial user operation.
     * @param paymasterServiceData The paymaster service data containing token information and sponsorship details. Devs can send just the preferred token or array of token addresses in case of mode "ERC20" and sartAccountInfo in case of "sponsored" mode.
     * @returns A Promise that resolves to the fee quotes or data response.
     */
    getPaymasterFeeQuotesOrData(_userOp: Partial<UserOperationStruct>, paymasterServiceData: FeeQuotesOrDataDto): Promise<FeeQuotesOrDataResponse>;
    /**
     * @dev Retrieves the paymaster and data based on the provided user operation and paymaster service data.
     * @param userOp The partial user operation.
     * @param paymasterServiceData Optional paymaster service data.
     * @returns A Promise that resolves to the paymaster and data string.
     */
    getPaymasterAndData(_userOp: Partial<UserOperationStruct>, paymasterServiceData?: SponsorUserOperationDto): Promise<PaymasterAndDataResponse>;
    /**
     *
     * @param userOp user operation
     * @param paymasterServiceData optional extra information to be passed to paymaster service
     * @returns "0x"
     */
    getDummyPaymasterAndData(_userOp: Partial<UserOperationStruct>, _paymasterServiceData?: SponsorUserOperationDto): Promise<string>;
    static create(config: PaymasterConfig): Promise<BiconomyPaymaster>;
}
//# sourceMappingURL=BiconomyPaymaster.d.ts.map