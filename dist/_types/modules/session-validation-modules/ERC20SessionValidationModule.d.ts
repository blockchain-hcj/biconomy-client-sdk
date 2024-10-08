import type { ISessionValidationModule } from "../interfaces/ISessionValidationModule.js";
import type { ERC20SessionKeyData, SessionValidationModuleConfig } from "../utils/Types.js";
/**
 * Session validation module for ERC20 token transfers.
 * It encodes session data into a sessionKeyData bytes to be verified by ERC20SessionValidationModule on chain.
 *
 * @author Sachin Tomar <sachin.tomar@biconomy.io>
 */
export declare class ERC20SessionValidationModule implements ISessionValidationModule<ERC20SessionKeyData> {
    moduleAddress: string;
    version: string;
    /**
     * This constructor is private. Use the static create method to instantiate ERC20SessionValidationModule
     * @param moduleConfig The configuration for the module
     * @returns An instance of ERC20SessionValidationModule
     */
    private constructor();
    /**
     * Asynchronously creates and initializes an instance of ERC20SessionValidationModule
     * @param moduleConfig The configuration for the module
     * @returns A Promise that resolves to an instance of ERC20SessionValidationModule
     */
    static create(moduleConfig: SessionValidationModuleConfig): Promise<ERC20SessionValidationModule>;
    getSessionKeyData(sessionData: ERC20SessionKeyData): Promise<string>;
    private _validateSessionKeyData;
    getAddress(): string;
}
//# sourceMappingURL=ERC20SessionValidationModule.d.ts.map