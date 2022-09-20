import { RuntimeError } from "./RuntimeError";
import { Token } from "./Token";
import { TokenType } from "./TokenType";

class ErrorReporter {
    private hadError: boolean
    private hadRuntimeError: boolean

    constructor() {
        this.hadError = false
        this.hadRuntimeError = false
    }

    private reportError(line: number, location: string, message: string): void {
        console.log("[line " + line + "] Error" + location + ": " + message)
        this.hadError = true
    }
    
    error(line: number, message: string): void {
        this.reportError(line, "", message);
    }

    thereIsError(): boolean {
        return this.hadError
    }

    //Parse
    parseError (token: Token, message: string) {
        if (token.type == TokenType.EOF) {
            this.reportError(token.line, " at end", message);
        } else {
            this.reportError(token.line, " at '" + token.lexeme + "'", message);
        }
    }

    //Interpreter
    runtimeError (error: RuntimeError): boolean {
        console.log(error.message + "\n[line " + error.token.line + "]")
        return true
    }

}

export {
    ErrorReporter
}