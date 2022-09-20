import readline from 'readline'
import { readFileSync } from "fs"
import { Scanner } from './Scanner'
import { Parser } from './Parser'
import { AstPrinter } from './astPrinter'
import { Interpreter } from './interpreter'
import { Stmt } from './ast'

class Lox {
    public hadError = false
    public hadRuntimeError = false
    private readonly interpreter = new Interpreter()

    run(source: String) {
        const scanner = new Scanner(source)
        const tokens = scanner.scanTokens()
        if(tokens) {
            const parser = new Parser(tokens)
            const statements: Array<Stmt> | null = parser.parse()
            if(statements) this.hadRuntimeError = this.interpreter.interpret(statements)
            else {
                console.log('NO PARSEABLE EXPRESSION')
            }
        }

        if (!tokens) {
            this.hadError = true
            return process.exit(64)
        }
    }
    
    runPrompt() {
    
        const rl = readline.createInterface({input: process.stdin, output:process.stdout })
    
        rl.on('line',
        (input)=>{
            input = input.trim()
            if (input == null) return
            this.run(input)
            this.hadError = false


        }
        )
    }
    
    runFile(path: string) {
        const script = readFileSync( path, { encoding: 'utf8' } )
        this.run(script)
        if (this.hadError) process.exit(65)
        if (this.hadRuntimeError) process.exit(70)
    }

    main() {
        const cli_args = process.argv.slice(2)
        //Check mode
        if (cli_args.length>1) {
            console.log('Usage: tslox <script>')
            return
        } else if(cli_args.length == 1) {
            this.runFile(cli_args[0])
        } else {
            this.runPrompt()
        }
    }
}

export {
    Lox
}