/* eslint-disable no-console */
/**
 * Single class to be used for logging purpose.
 *
 * @param {any} message Message to be logged
 */
import { isDebugging } from "./Helpers.js";
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class Logger {
    /**
     * \x1b[0m is an escape sequence to reset the color of the text
     * All color codes used - 31 - Red, 33 - Yellow, 34 - Blue, 35 - Magenta, 36 - Cyan
     * log -   Magenta[time]               Cyan[message]:  [value]
     * warn -  Magenta[time] Yellow[WARN]: Cyan[message]:  [value]
     * error - Magenta[time] Red[ERROR]:   Cyan[message]:  [value]
     */
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    static log(message, value = "") {
        const timestamp = new Date().toISOString();
        const logMessage = `\x1b[35m[${timestamp}]\x1b[0m \x1b[36m${message}\x1b[0m:`;
        if (Logger.isDebug) {
            console.log(logMessage, value === undefined ? "" : value);
        }
    }
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    static warn(message, value = "") {
        const timestamp = new Date().toISOString();
        const warnMessage = `\x1b[35m[${timestamp}]\x1b[0m \x1b[33mWARN\x1b[0m: \x1b[36m${message}\x1b[0m`;
        if (Logger.isDebug) {
            console.warn(warnMessage, value === undefined ? "" : value);
        }
    }
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    static error(message, value = "") {
        const timestamp = new Date().toISOString();
        const errorMessage = `\x1b[35m[${timestamp}]\x1b[0m \x1b[31mERROR\x1b[0m: \x1b[36m${message}\x1b[0m`;
        if (Logger.isDebug) {
            console.error(errorMessage, value === undefined ? "" : value);
        }
    }
}
// By default, the logger is not in debug mode.
Object.defineProperty(Logger, "isDebug", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: isDebugging()
});
export { Logger };
//# sourceMappingURL=Logger.js.map