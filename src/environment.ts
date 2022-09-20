import { RuntimeError } from "./RuntimeError"
import { Token } from "./Token"

class Environment {
    readonly enclosing: Environment | null
    private readonly map: Map<string, Object | null> = new Map<string, Object | null>()

    constructor(enclosing: Environment | null) {
        this.enclosing = enclosing
    }

    define(name: string, value: Object | null): void {
        this.map.set(name,value)
    }

    get(name: Token): Object | null {
        if(this.map.has(name.lexeme)) {
            let val =  this.map.get(name.lexeme)
            if(val=== undefined) return null
            else return val
        }

        if(this.enclosing !== null) {
            return this.enclosing.get(name)
        }

        throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.")
    }

    assign(name: Token, value: Object | null): void {
        if (this.map.has(name.lexeme)) {
            this.map.set(name.lexeme, value)
            return
        }

        if (this.enclosing !== null) {
            this.enclosing.assign(name, value);
            return
        }
    
        throw new RuntimeError(name, "Undefined variable '" + name.lexeme + "'.")
      }
}

export{
    Environment
}