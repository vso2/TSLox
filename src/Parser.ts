import { Assign, Binary, Block, Break, Call, Conditional, Expr, Expression, Function, Grouping, If, Literal, Logical, Print, Stmt, Unary, Var, Variable, While } from "./ast"
import { ErrorReporter } from "./ErrorReporter"
import { Token } from "./Token"
import { TokenType } from "./TokenType"

class ParserError extends Error{}

class Parser {

    private loopDepth: number = 0
    private readonly tokens:  Array<Token>
    private current: number = 0

    constructor(tokens:  Array<Token>) {
        this.tokens = tokens
    }

    //Parsing is a list of statements

    // program → statement* EOF ;

    parse(): Array<Stmt> | null {
        try {
            let statements: Array<Stmt> = []
            while(!this.isAtEnd()) {
                let stmt = this.declaration()
                if(stmt) statements.push(stmt)
            }
            return statements
        } catch (error: any) {
            console.log('Something went wrong on Parsing!!')
            return null
        }
    }

    //Statements Grammar rules

    private varDeclaration(): Stmt {
        let name: Token = this.consume(TokenType.IDENTIFIER, "Expect variable name.");
    
        let initializer: Expr | null = null;
        if (this.match(TokenType.EQUAL)) {
          initializer = this.expression();
        }
    
        this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
        return new Var(name, initializer);
      }

    private declaration(): Stmt | null {
        try {
            if (this.match(TokenType.VAR)) return this.varDeclaration()
            if (this.match(TokenType.FUN)) return this.funDeclaration("function")
            return this.statement()

          } catch (error) {

            this.synchronize()
            return null
          }
    }



    private statement(): Stmt {
        if (this.match(TokenType.IF)) return this.ifStatement()
        if (this.match(TokenType.FOR)) return this.forStatement()
        if (this.match(TokenType.WHILE)) return this.whileStatement()
        if (this.match(TokenType.PRINT)) return this.printStatement()
        if (this.match(TokenType.LEFT_BRACE)) return new Block(this.block())
        if (this.match(TokenType.BREAK)) return this.breakStatement()
    
        return this.expressionStatement();
    }

    private printStatement(): Stmt {
        const value: Expr = this.expression();
        this.consume(TokenType.SEMICOLON, "Expect ';' after value.")
        return new Print(value);
    }

    private expressionStatement() {
        const expr: Expr = this.expression();
        this.consume(TokenType.SEMICOLON, "Expect ';' after expression.")
        return new Expression(expr);
    }

    private funDeclaration (kind: string): Function {
        let name: Token = this.consume(TokenType.IDENTIFIER, "Expect " + kind + " name.")
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after " + kind + " name.")
        let parameters: Array<Token> = []
        
        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                if (parameters.length >= 255) {
                new ErrorReporter().parseError(this.peek(), "Can't have more than 255 parameters.")
            }
            parameters.push(this.consume(TokenType.IDENTIFIER, "Expect parameter name."))
            } while (this.match(TokenType.COMMA))
        }

        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters.");

        this.consume(TokenType.LEFT_BRACE, "Expect '{' before " + kind + " body.");
        const body: Array<Stmt> = this.block();
        return new Function(name, parameters, body);
    }

    private block(): Array<Stmt> {
        let statements: Array<Stmt> = new Array<Stmt>();

        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            let decl = this.declaration()
            if(decl) statements.push(decl)
        }

        this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.")
        return statements
    }

    private ifStatement(): Stmt {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
        let condition: Expr | null = this.expression();
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition."); 

        let thenBranch: Stmt = this.statement();
        let elseBranch: Stmt | null = null;
        if (this.match(TokenType.ELSE)) {
          elseBranch = this.statement();
        }

        return new If(condition, thenBranch, elseBranch);
    }

    private whileStatement(): Stmt {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.")
        try {
            this.loopDepth += 1
            const condition: Expr = this.expression()
            this.consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.")
            const body: Stmt = this.statement()

            return new While(condition, body)
        } finally {
            this.loopDepth -= 1
        }
    }

    private forStatement(): Stmt {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.")
        try {
            this.loopDepth += 1
            let initializer: Stmt | null
            if (this.match(TokenType.SEMICOLON)) initializer = null
            else if (this.match(TokenType.VAR)) initializer = this.varDeclaration()
            else initializer = this.expressionStatement()

            let condition: Expr | null = null
            if (!this.check(TokenType.SEMICOLON)) condition = this.expression()
            this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.")

            let increment: Expr | null = null
            if (!this.check(TokenType.RIGHT_PAREN)) increment = this.expression()
            this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.")

            let body: Stmt = this.statement()

            if ( increment !== null ) {
                const blockStmt: Array<Stmt> = [body, new Expression(increment)] 
                body = new Block(blockStmt)
            }

            if (condition === null) condition = new Literal(true)
            if (condition) body = new While(condition, body)

            if (initializer !== null) {
                const blockStmt: Array<Stmt> = [initializer, body] 
                body = new Block(blockStmt)
            }

            return body
        } finally {
            this.loopDepth -= 1
        }
    }

    private breakStatement(): Stmt {
        if( this.loopDepth === 0 ) new ErrorReporter().parseError(this.previous(), "Must be inside a loop to use 'break'.");
        this.consume(TokenType.SEMICOLON, "Expect ';' after 'break'.")
        return new Break()
    }

    //Expression Grammar

    // expression → comma 

    private expression(): Expr {
        return this.assignment()
    }

    //assignment → IDENTIFIER "=" assignment | or ;

    private assignment(): Expr {
        let expr: Expr = this.or();

        if (this.match(TokenType.EQUAL)) {
            let equals: Token = this.previous();
            let value: Expr = this.assignment();

            if (expr instanceof Variable) {
            let name: Token = ((expr as Variable).name)
            return new Assign(name, value);
            }

            this.error(equals, "Invalid assignment target."); 
        }

        return expr;
    }

    // Logical operators

    // logic_or  → logic_and ( "or" logic_and )* 

    private or(): Expr {
        let expr: Expr = this.and()

        while(this.match(TokenType.OR)) {
            const operator: Token = this.previous()
            let right: Expr = this.and()
            expr = new Logical(expr, operator,right)
        }

        return expr
    }

    //logic_and → conditional ( "and" conditional )* 

    private and(): Expr {
        let expr: Expr = this.conditional()

        while(this.match(TokenType.AND)) {
            let operator: Token = this.previous()

            let right: Expr = this.conditional()

            expr = new Logical(expr, operator, right)
        }

        return expr
    }




    // conditional → equality ( "?" expression ":" conditional )?

    private conditional(): Expr {
        let expr: Expr = this.comma()
        while (this.match(TokenType.QUESTION)) {
            let thenBranch: Expr = this.expression()
            this.consume(TokenType.COLON,"Expect ':' after then branch of conditional expression.")
            let elseBranch: Expr = this.conditional()
            expr = new Conditional(expr,thenBranch, elseBranch )
        }
        return expr
    }

    // comma → equality ( "," equality )*

    private comma(): Expr {
        let expr: Expr = this.equality()
        while (this.match(TokenType.COMMA)) {
            const operator: Token = this.previous()
            const right: Expr = this.equality()
            expr = new Binary(expr, operator, right)
        }

        return expr
    }

    // equality   → comparison ( ( "!=" | "==" ) comparison )* 

    private equality(): Expr {

        let expr: Expr = this.comparison() 

        while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
            const operator: Token = this.previous()
            const right: Expr = this.comparison()
            expr = new Binary(expr, operator, right)
        }

        return expr
    }

    // comparison → term ( ( ">" | ">=" | "<" | "<=" ) term )* 

    private comparison(): Expr {
        let expr: Expr = this.term()

        while (this.match(TokenType.LESS, TokenType.LESS_EQUAL, TokenType.GREATER, TokenType.GREATER_EQUAL)) {
            const operator: Token = this.previous()
            const right: Expr = this.term()
            expr = new Binary(expr, operator, right) 
        }

        return expr
    }

    // term → factor ( ( "-" | "+" ) factor )*

    private term(): Expr {
        let expr: Expr = this.factor()

        while (this.match(TokenType.MINUS, TokenType.PLUS)) {
            const operator: Token = this.previous()
            const right: Expr = this.factor()
            expr = new Binary(expr, operator, right)
        }

        return expr
    }

    // factor → unary ( ( "/" | "*" ) unary )*

    private factor(): Expr {
        let expr: Expr = this.unary()

        while (this.match(TokenType.SLASH, TokenType.STAR)) {
            const operator: Token = this.previous()
            const right: Expr = this.unary()
            expr = new Binary(expr, operator, right)
        }

        return expr
    }

    // unary → ( "!" | "-" ) unary | call

    private unary(): Expr {
        if (this.match(TokenType.BANG, TokenType.MINUS)) {
            const operator: Token = this.previous()
            const right: Expr = this.unary()
            return new Unary(operator, right)
        }

        return this.call()
    }

    // call → primary ( "(" arguments? ")" )*

    private call(): Expr {
        
        let expr: Expr = this.primary()

        while(true) {
            if(this.match(TokenType.LEFT_PAREN)) {
                expr = this.finishCall(expr)
            } else {
                break
            }
        }

        return expr
    }

    private finishCall(callee: Expr) {
        let args: Array<Expr> = []
    if (!this.check(TokenType.RIGHT_PAREN)) {
        do {
            if(args.length >= 255) {
                new ErrorReporter().parseError(this.peek(), "Can't have more than 255 arguments.")
            }
            args.push(this.equality())
        } while (this.match(TokenType.COMMA))
    }
    
    let paren: Token = this.consume(TokenType.RIGHT_PAREN, "Expect ')' after arguments.")

        return new Call(callee, paren, args);
    }



    // arguments → expression ( "," expression )* 

    private primary(): Expr {
        if (this.match(TokenType.FALSE)) return new Literal(false)
        if (this.match(TokenType.TRUE)) return new Literal(true)
        if (this.match(TokenType.NIL)) return new Literal(null)

        if (this.match(TokenType.LEFT_PAREN)) {
            let expr: Expr = this.expression()
            this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.")
            return new Grouping(expr)
        }

        if (this.match(TokenType.IDENTIFIER)) {
            return new Variable(this.previous());
        }
// CHANGED
 /*       if (this.match(TokenType.NUMBER, TokenType.STRING)) {
            let literal = this.previous().literal
            if ( literal ) return new Literal(literal)
        }
*/
// PROVISORY SOLUTION
        if (this.match(TokenType.NUMBER, TokenType.STRING)) {}
        let literal = this.previous().literal
        return new Literal(literal)
    }

    // utilities

    private match(...types: Array<TokenType>): boolean {
        for(let type of types) {
            if (this.check(type)) {
                this.advance()
                return true
            }
        }
        return false
    }

    private consume(type: TokenType, message: string) {
        if (this.check(type)) return this.advance();
        
        throw this.error(this.peek(), message);
    }

    private check(type: TokenType): boolean {
        if (this.isAtEnd()) return false
        return this.peek().type == type
    }

    private isAtEnd(): boolean {
        return this.peek().type == TokenType.EOF
    }

    private advance(): Token {
        if (!this.isAtEnd()) this.current++
        return this.previous()
    }

    private peek(): Token {
        return this.tokens[this.current]
        
    }

    private previous(): Token {
        return this.tokens[this.current -1]
    }

    private error(token: Token, message: string) {
        new ErrorReporter().parseError(token, message)
        return new ParserError()
    }

    private synchronize() {
        this.advance()
    
        while (!this.isAtEnd()) {
          if (this.previous().type == TokenType.SEMICOLON) return;
    
          switch (this.peek().type) {
            case TokenType.CLASS:
            case TokenType.FUN:
            case TokenType.VAR:
            case TokenType.FOR:
            case TokenType.IF:
            case TokenType.WHILE:
            case TokenType.PRINT:
            case TokenType.RETURN:
                return
          }
    
          this.advance();
        }
      }

}

export {
    Parser
}