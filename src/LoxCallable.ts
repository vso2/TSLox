import { Function } from "./ast";
import { Environment } from "./environment";
import { Interpreter } from "./interpreter";

interface LoxCallable {
    arity(): number
    call(interpreter: Interpreter, args: Array<Object | null>): Object | null
}

class LoxFunction implements LoxCallable {
    readonly declaration: Function
    
    constructor(declaration: Function) {
        this.declaration = declaration
    }

    call(interpreter: Interpreter, args: (Object | null)[]): Object | null {
        let environment = new Environment(interpreter.globals)
        for (let i = 0; i < this.declaration.params.length; i+= 1) {
            let tokenParam = this.declaration.params.at(i)
            let valueParam = args.at(i)
            if(tokenParam !== undefined && valueParam !== undefined) environment.define(tokenParam.lexeme, valueParam);
        }
      
        interpreter.executeBlock(this.declaration.body, environment)
        return null
    }

    arity(): number {
        return this.declaration.params.length;
    }

    toString(): string {
        return "<fn " + this.declaration.name.lexeme + ">";
      }

}

export {
    LoxCallable,
    LoxFunction
}