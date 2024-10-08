/**
 * Single class to be used for logging purpose.
 *
 * @param {any} message Message to be logged
 */
declare class Logger {
    static isDebug: boolean;
    /**
     * \x1b[0m is an escape sequence to reset the color of the text
     * All color codes used - 31 - Red, 33 - Yellow, 34 - Blue, 35 - Magenta, 36 - Cyan
     * log -   Magenta[time]               Cyan[message]:  [value]
     * warn -  Magenta[time] Yellow[WARN]: Cyan[message]:  [value]
     * error - Magenta[time] Red[ERROR]:   Cyan[message]:  [value]
     */
    static log(message: string, value?: any): void;
    static warn(message: string, value?: any): void;
    static error(message: string, value?: any): void;
}
export { Logger };
//# sourceMappingURL=Logger.d.ts.map