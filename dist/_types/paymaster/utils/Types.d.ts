export type Hex = `0x${string}`;
import type { BigNumberish } from "../../account";
import type { JsonRpcError } from "../../bundler/utils/Types";
export type PaymasterServiceErrorResponse = {
    jsonrpc: string;
    id: number;
    error: JsonRpcError;
};
export type JsonRpcResponse = {
    jsonrpc: string;
    id: number;
    result?: any;
    error?: JsonRpcError;
};
export type PaymasterConfig = {
    paymasterUrl: string;
    strictMode?: boolean;
};
export type SponsorUserOperationDto = {
    /** mode: sponsored or erc20 */
    mode: PaymasterMode;
    /** Always recommended, especially when using token paymaster */
    calculateGasLimits?: boolean;
    /** Expiry duration in seconds */
    expiryDuration?: number;
    /** Webhooks to be fired after user op is sent */
    webhookData?: Record<string, any>;
    /** Smart account meta data */
    smartAccountInfo?: SmartAccountData;
    /** the fee-paying token address */
    feeTokenAddress?: string;
};
export type FeeQuotesOrDataDto = {
    /** mode: sponsored or erc20 */
    mode?: PaymasterMode;
    /** Expiry duration in seconds */
    expiryDuration?: number;
    /** Always recommended, especially when using token paymaster */
    calculateGasLimits?: boolean;
    /** List of tokens to be used for fee quotes, if ommitted fees for all supported will be returned */
    tokenList?: string[];
    /** preferredToken: Can be ommitted to return all quotes */
    preferredToken?: string;
    /** Webhooks to be fired after user op is sent */
    webhookData?: Record<string, any>;
    /** Smart account meta data */
    smartAccountInfo?: SmartAccountData;
};
export type FeeQuoteParams = {
    tokenList?: string[];
    preferredToken?: string;
};
export type FeeTokenInfo = {
    feeTokenAddress: string;
};
export type SponsorpshipInfo = {
    /** Webhooks to be fired after user op is sent */
    webhookData?: Record<string, any>;
    /** Smart account meta data */
    smartAccountInfo: SmartAccountData;
};
export type SmartAccountData = {
    /** name: Name of the smart account */
    name: string;
    /** version: Version of the smart account */
    version: string;
};
export type PaymasterFeeQuote = {
    /** symbol: Token symbol */
    symbol: string;
    /** tokenAddress: Token address */
    tokenAddress: string;
    /** decimal: Token decimal */
    decimal: number;
    logoUrl?: string;
    /** maxGasFee: in wei */
    maxGasFee: number;
    /** maxGasFee: in dollars */
    maxGasFeeUSD?: number;
    usdPayment?: number;
    /** The premium paid on the token */
    premiumPercentage: number;
    /** validUntil: Unix timestamp */
    validUntil?: number;
};
export type FeeQuotesOrDataResponse = {
    /** Array of results from the paymaster */
    feeQuotes?: PaymasterFeeQuote[];
    /** Normally set to the spender in the proceeding call to send the tx */
    tokenPaymasterAddress?: Hex;
    /** Relevant Data returned from the paymaster */
    paymasterAndData?: Uint8Array | Hex;
    preVerificationGas?: BigNumberish;
    verificationGasLimit?: BigNumberish;
    callGasLimit?: BigNumberish;
};
export type PaymasterAndDataResponse = {
    paymasterAndData: Hex;
    preVerificationGas: number;
    verificationGasLimit: number;
    callGasLimit: number;
};
export declare enum PaymasterMode {
    ERC20 = "ERC20",
    SPONSORED = "SPONSORED"
}
//# sourceMappingURL=Types.d.ts.map