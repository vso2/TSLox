import { Assign, Binary, Block, Break, Call, Conditional, Expr, Expression, ExprVisitor, Function, Grouping, If, Literal, Logical, Print, Stmt, StmtVisitor, Unary, Var, Variable, While } from "./ast";
import { Environment } from "./environment";
import { ErrorReporter } from "./ErrorReporter";
import { LoxCallable, LoxFunction } from "./LoxCallable";
import { RuntimeError } from "./RuntimeError";
import { Token } from "./Token";
import { TokenType } from "./TokenType";

class Interpreter implements ExprVisitor<Object | null>, StmtVisitor<void> {

    readonly globals: Environment = new Environment(null)
    private environment: Environment = this.globals

    constructor() {
        this.globals.define("clock", new class implements LoxCallable{
            
            public arity(): number {
                return 0
            }

            public call(interpreter: Interpreter, args: (Object | null)[]): Object | null {
                return (new Date().getTime())/1000.0
            }

            public toString(): string {
                return "<native fn>"
            }
        })
    }
    
    public interpret(statements: Array<Stmt>): boolean { 
        try {
            for(let statement of statements) {
                this.execute(statement)
            }
            return false;
        } catch (error : any) {
            console.log("SOMETHING WENT WRONG ON INTERPRETER")
            return new ErrorReporter().runtimeError(error as RuntimeError);
        }
    }

    //Statements

    public visitExpressionStmt(stmt: Expression): void {
        this.evaluate(stmt.expression)
    }

    public visitPrintStmt(stmt: Print): void {
        let value = this.evaluate(stmt.expression)
        console.log(this.stringify(value))
    }

    public visitVarStmt(stmt: Var): void {
        let value: Object | null = null
        if (stmt.initializer !== null) {
            value = this.evaluate(stmt.initializer)
        }

        this.environment.define(stmt.name.lexeme,value)
        return;
    }

    public visitAssignExpr(expr: Assign): Object | null {
        let value: Object | null = this.evaluate(expr.value);
        this.environment.assign(expr.name, value);
        return value;
    }

    public visitBlockStmt(stmt: Block): void {
        this.executeBlock(stmt.statements, new Environment(this.environment));
    }

    public visitIfStmt(stmt: If): void {
        if(this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.thenBranch)
        } else if (stmt.elseBranch !== null){
            this.execute(stmt.elseBranch)
        }
    }

    public visitWhileStmt(stmt: While): void {
        try {
            while(this.isTruthy(this.evaluate(stmt.condition))) {
                this.execute(stmt.body)
            }
        } catch (error) {
            
        }
    }

    public visitBreakStmt(stmt: Break): void {
        throw new Error()
    }

    public visitCallExpr(expr: Call): Object | null {
        let callee = this.evaluate(expr.callee)

        let args: Array<Object | null> = []
        for(let arg of expr.args) {
            args.push(this.evaluate(arg))
        }

        if (!(callee instanceof LoxFunction )) {
            throw new RuntimeError(expr.paren,
                "Can only call functions and classes.")
          }

        let func: LoxCallable = (callee as LoxCallable)
        if (args.length != func.arity()) {
            throw new RuntimeError(expr.paren, "Expected " + func.arity() + " arguments but got " + args.length + ".")
        }
        return func.call(this, args)
    }

    public visitFunctionStmt(stmt: Function): void {
        let func: LoxFunction = new LoxFunction(stmt)
            this.environment.define(stmt.name.lexeme, func)
    }


    //Expressions

    public visitConditionalExpr(expr: Conditional): Object | null {
        let left : Object | null = this.evaluate(expr.left)
        if (this.isTruthy(left)) {
            return this.evaluate(expr.thenBranch)
        } else {
            return this.evaluate(expr.elseBranch)
        }
    }
    
    
    public visitLiteralExpr(expr: Literal): Object | null {
        return expr.value
    }

    public visitGroupingExpr(expr: Grouping): Object | null {
        return this.evaluate(expr.expression)
    }

    public visitUnaryExpr(expr: Unary): Object | null {
        const right: Object | null = this.evaluate(expr.right)

        switch(expr.operator.type) {
            case TokenType.MINUS:
                this.checkNumberOperand(expr.operator, right)
                return -(right as number)
            case TokenType.BANG:
                return !this.isTruthy(right)
        }

        return null

    }

    public visitBinaryExpr(expr: Binary): Object | null {
        const left: Object | null = this.evaluate(expr.left)
        const right: Object | null = this.evaluate(expr.right)

        switch(expr.operator.type) {
            case TokenType.PLUS:
                if (( typeof left == 'number') && (typeof right == 'number')) {
                    return (left as number) + (right as number)
                } 

                if ((typeof left == 'string') && (typeof right == 'string')) {
                    return (left as string) + (right as string)
                }

                throw new RuntimeError(expr.operator, "Operands must be two numbers or two strings.")

            case TokenType.MINUS:
                this.checkNumberOperands(expr.operator, left, right)
                return (left as number) - (right as number)
            case TokenType.SLASH:
                this.checkNumberOperands(expr.operator, left, right)
                return (left as number) / (right as number)
            case TokenType.STAR:
                this.checkNumberOperands(expr.operator, left, right)
                return (left as number) * (right as number)
            case TokenType.GREATER:
                this.checkNumberOperands(expr.operator, left, right)
                return (left as number) > (right as number)
            case TokenType.LESS:
                this.checkNumberOperands(expr.operator, left, right)
                return (left as number) < (right as number)
            case TokenType.GREATER_EQUAL:
                this.checkNumberOperands(expr.operator, left, right)
                return (left as number) >= (right as number)
            case TokenType.LESS_EQUAL:
                this.checkNumberOperands(expr.operator, left, right)
                return (left as number) <= (right as number)
            case TokenType.BANG_EQUAL: 
                return !this.isEqual(left, right)
            case TokenType.EQUAL_EQUAL:
                return this.isEqual(left, right)
        }

        return null
    }

    visitVariableExpr(expr: Variable): Object | null {
        return this.environment.get(expr.name)
    }

    visitLogicalExpr(expr: Logical): Object | null {
        let left: Object | null = this.evaluate(expr.left)

        if (expr.operator.type === TokenType.OR) {
            if (this.isTruthy(left)) return left
        } else {
            if (!this.isTruthy(left)) return left
        }

        return this.evaluate(expr.right)
    }


    //Helper Methods

    private isEqual(a: Object | null, b: Object | null): boolean {
        if (a === null && b === null ) return true
        if (a === null ) return false
        return Object.is(a, b)
    }

    private stringify(object: Object | null): string {
        if (object === null) return "nil"
        let val = typeof(object) == 'number'
        if (val) {
            let text: string = object.toString()
          if (text.endsWith(".0")) {
            text = text.substring(0, text.length - 2)
          }
          return text
        }
    
        return object.toString()
      }

    private evaluate(expr: Expr | null): Object | null {
        if (expr === null) return null
        return expr.accept(this)
    }

    private isTruthy(object: Object | null): boolean {
        if(object === null) return false
        if(typeof object == 'boolean') return (object as boolean)
        return true
    }

    private checkNumberOperand(operator: Token, operand: Object | null) {
        if (typeof(operand)=='number') return;
        throw new RuntimeError(operator, "Operand must be a number.")
    }

    private checkNumberOperands(operator: Token, left: Object | null, right: Object | null) {
        if (typeof left == 'number' && typeof right == 'number') return
        throw new RuntimeError(operator, "Operands must be numbers.")
    }

    private execute(statement: Stmt): void {
        statement.accept(this)
    }

    public executeBlock(statements: Array<Stmt>, environment: Environment) {
        const previous: Environment = this.environment
        try {
            this.environment = environment
            for (let statement of statements) {
                this.execute(statement)
            }
        } finally {
            this.environment = previous
        }
    }
}

export {
    Interpreter
}