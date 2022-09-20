import { Token } from './Token'
import { TokenType } from './TokenType'
import { ErrorReporter } from './ErrorReporter'


class Scanner {
    private readonly source: String
    private readonly tokens:  Array<Token> = []
    private line: number = 1
    private start: number = 0
    private current: number = 0
    private scannerError: boolean

    private readonly keywords:  Array<{key:string, value: TokenType}> = 
    [
        {key:"and",    value:TokenType.AND},
        {key:"class",  value:TokenType.CLASS},
        {key:"else",   value:TokenType.ELSE},
        {key:"false",  value:TokenType.FALSE},
        {key:"for",    value:TokenType.FOR},
        {key:"fun",    value:TokenType.FUN},
        {key:"if",     value:TokenType.IF},
        {key:"nil",    value:TokenType.NIL},
        {key:"or",     value:TokenType.OR},
        {key:"print",  value:TokenType.PRINT},
        {key:"return", value:TokenType.RETURN},
        {key:"super",  value:TokenType.SUPER},
        {key:"this",   value:TokenType.THIS},
        {key:"true",   value:TokenType.TRUE},
        {key:"var",    value:TokenType.VAR},
        {key:"while",  value:TokenType.WHILE},
        {key:"break",  value:TokenType.BREAK}
    ]
     
    constructor(source: String) {
        this.source = source
        this.scannerError = false
    }

    scanTokens(): Array<Token> | null {
        while(!this.isAtEnd()) {
            this.start = this.current
            this.scanToken()
            if(this.scannerError) return null
        }

        this.tokens.push(new Token(TokenType.EOF, "",null, this.line))
        return this.tokens
    }

    scanToken(): void {
        
        let c = this.advance()

        switch (c) {
            case '(': this.addToken(TokenType.LEFT_PAREN, null); break;
            case ')': this.addToken(TokenType.RIGHT_PAREN, null); break;
            case '{': this.addToken(TokenType.LEFT_BRACE, null); break;
            case '}': this.addToken(TokenType.RIGHT_BRACE, null); break;
            case ',': this.addToken(TokenType.COMMA, null); break;
            case '.': this.addToken(TokenType.DOT, null); break;
            case '-': this.addToken(TokenType.MINUS, null); break;
            case '+': this.addToken(TokenType.PLUS, null); break;
            case ';': this.addToken(TokenType.SEMICOLON, null); break;
            case '?': this.addToken(TokenType.QUESTION, null); break;
            case ':': this.addToken(TokenType.COLON, null); break;
            case '*':
                if (this.match('/')) {
                    this.scannerError = true;
                    new ErrorReporter().error(this.line, "Unexpected closing block comment."); break;
                } else { 
                    this.addToken(TokenType.STAR, null); break;
                }
            case '!': this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG, null); break;
            case '=': this.addToken(this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL, null); break;
            case '<': this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS, null); break;
            case '>': this.addToken(this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER, null); break;
            //Comments
            case '/':
                if (this.match('/')) {
                    while (this.peek() != '\n' && !this.isAtEnd()) this.advance()
                } else if (this.match('*')) {
                    this.blockComment()
                } else {
                    this.addToken(TokenType.SLASH, null)
                }
                break;
            //Whitespaces
            case ' ':
            case '\r':
            case '\t': break;
            //Newlines
            case '\n': this.line++; break;
            //String literals
            case '"': this.string(); break;
            default:
                if (this.isDigit(c)) {
                    this.number();
                } else if (this.isAlpha(c)) {
                    this.identifier()
                } else {
                    this.scannerError = true;
                    new ErrorReporter().error(this.line, "Unexpected character."); break;
                }
        }
    }

    private match(expected: string): boolean {
        if(this.isAtEnd()) return false
        if(this.source.charAt(this.current) != expected) return false

        this.current++
        return true
    }

    private isAtEnd(): boolean {
        return this.current >= this.source.length
    }

    private advance() : string {
        return this.source.charAt(this.current++);
    }

    private addToken (type: TokenType, literal: Object | null): void {
        const text = this.source.substring(this.start, this.current);
        this.tokens.push(new Token(type, text, literal, this.line));
    }

    private peek(): string {
        if (this.isAtEnd()) return '\0';
        return this.source.charAt(this.current);
    }

    private string(): void {
        while (this.peek()!='"' && !this.isAtEnd()) {
            if(this.peek()=='\n') this.line++
            this.advance()
        }

        if (this.isAtEnd()) {
            this.scannerError = true
            new ErrorReporter().error(this.line, "Unterminated string")
            return
        }

        this.advance()

        const value = this.source.substring(this.start+1, this.current-1)
        this.addToken(TokenType.STRING, value) 
    }

    private isDigit(c: string): boolean {
        return c>='0' && c<='9'
    }

    private number(): void {
        while (this.isDigit(this.peek())) this.advance()

        if (this.peek()=='.' && this.isDigit(this.peekNext())) {
            this.advance()

            while (this.isDigit(this.peek())) this.advance()
        }

        this.addToken(TokenType.NUMBER, parseFloat(this.source.substring(this.start, this.current)) )

    }

    private peekNext(): string {
        if (this.current + 1 >= this.source.length) return '\0'
        return this.source.charAt(this.current + 1)
    }

    private isAlpha(c: string): boolean {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_'
    }

    private identifier(): void {
        while (this.isAlphaNumeric(this.peek())) this.advance()

        const text = this.source.substring(this.start, this.current);
        let type = this.keywords.find(el => el.key == text)?.value;
        if (type == undefined) type = TokenType.IDENTIFIER;
        
        this.addToken(type,null);

    }

    private isAlphaNumeric(c: string):  boolean {
        return this.isAlpha(c) || this.isDigit(c);
    }
    private blockComment(): void {
        let nestedBlocksCount = 1
        while (!this.isAtEnd()) {
            if (this.peek() === '/' && this.peekNext() === '*') {
                nestedBlocksCount++
                this.advance()
                this.advance()
            } else if (this.peek() === '*' && this.peekNext() === '/') {
                nestedBlocksCount--
                this.advance()
                this.advance()
                if(nestedBlocksCount === 0) {
                    break
                }
            } else {
                this.advance()
            }
        }
        if (this.isAtEnd() && nestedBlocksCount !== 0) {
            this.scannerError = true
            new ErrorReporter().error(this.line, "Unclosed block comment.")
        }
    }

}

export {
    Scanner
}