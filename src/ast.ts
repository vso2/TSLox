import { Token } from './Token' 


interface Expr {
    accept<R>(visitor: ExprVisitor<R>): R
}

interface ExprVisitor<R> {
	visitBinaryExpr(Expr: Binary): R
	visitGroupingExpr(Expr: Grouping): R
	visitLiteralExpr(Expr: Literal): R
	visitUnaryExpr(Expr: Unary): R
	visitConditionalExpr(Expr: Conditional): R
	visitVariableExpr(Expr: Variable): R
	visitAssignExpr(Expr: Assign): R
	visitLogicalExpr(Expr: Logical): R
	visitCallExpr(Expr: Call): R
}

interface Stmt {
    accept<R>(visitor: StmtVisitor<R>): R
}

interface StmtVisitor<R> {
	visitVarStmt(Stmt: Var): R
	visitWhileStmt(Stmt: While): R
	visitExpressionStmt(Stmt: Expression): R
	visitPrintStmt(Stmt: Print): R
	visitBlockStmt(Stmt: Block): R
	visitIfStmt(Stmt: If): R
	visitBreakStmt(Stmt: Break): R
	visitFunctionStmt(Stmt: Function): R
}

class Binary implements Expr {

	left : Expr
	operator : Token
	right : Expr

	constructor (left : Expr, operator : Token, right : Expr) {
		this.left = left
		this.operator = operator
		this.right = right
	}

	accept<R>(visitor: ExprVisitor<R>): R {
		return visitor.visitBinaryExpr(this)
	}
}

class Grouping implements Expr {

	expression : Expr

	constructor (expression : Expr) {
		this.expression = expression
	}

	accept<R>(visitor: ExprVisitor<R>): R {
		return visitor.visitGroupingExpr(this)
	}
}

class Literal implements Expr {

	value : Object | null

	constructor (value : Object | null) {
		this.value = value
	}

	accept<R>(visitor: ExprVisitor<R>): R {
		return visitor.visitLiteralExpr(this)
	}
}

class Unary implements Expr {

	operator : Token
	right : Expr

	constructor (operator : Token, right : Expr) {
		this.operator = operator
		this.right = right
	}

	accept<R>(visitor: ExprVisitor<R>): R {
		return visitor.visitUnaryExpr(this)
	}
}

class Conditional implements Expr {

	left : Expr
	thenBranch : Expr
	elseBranch : Expr

	constructor (left : Expr, thenBranch : Expr, elseBranch : Expr) {
		this.left = left
		this.thenBranch = thenBranch
		this.elseBranch = elseBranch
	}

	accept<R>(visitor: ExprVisitor<R>): R {
		return visitor.visitConditionalExpr(this)
	}
}

class Variable implements Expr {

	name : Token

	constructor (name : Token) {
		this.name = name
	}

	accept<R>(visitor: ExprVisitor<R>): R {
		return visitor.visitVariableExpr(this)
	}
}

class Assign implements Expr {

	name : Token
	value : Expr

	constructor (name : Token, value : Expr) {
		this.name = name
		this.value = value
	}

	accept<R>(visitor: ExprVisitor<R>): R {
		return visitor.visitAssignExpr(this)
	}
}

class Logical implements Expr {

	left : Expr
	operator : Token
	right : Expr

	constructor (left : Expr, operator : Token, right : Expr) {
		this.left = left
		this.operator = operator
		this.right = right
	}

	accept<R>(visitor: ExprVisitor<R>): R {
		return visitor.visitLogicalExpr(this)
	}
}

class Call implements Expr {

	callee : Expr
	paren : Token
	args : Array<Expr>

	constructor (callee : Expr, paren : Token, args : Array<Expr>) {
		this.callee = callee
		this.paren = paren
		this.args = args
	}

	accept<R>(visitor: ExprVisitor<R>): R {
		return visitor.visitCallExpr(this)
	}
}

class Var implements Stmt {

	name : Token
	initializer : Expr | null

	constructor (name : Token, initializer : Expr | null) {
		this.name = name
		this.initializer = initializer
	}

	accept<R>(visitor: StmtVisitor<R>): R {
		return visitor.visitVarStmt(this)
	}
}

class While implements Stmt {

	condition : Expr
	body : Stmt

	constructor (condition : Expr, body : Stmt) {
		this.condition = condition
		this.body = body
	}

	accept<R>(visitor: StmtVisitor<R>): R {
		return visitor.visitWhileStmt(this)
	}
}

class Expression implements Stmt {

	expression : Expr

	constructor (expression : Expr) {
		this.expression = expression
	}

	accept<R>(visitor: StmtVisitor<R>): R {
		return visitor.visitExpressionStmt(this)
	}
}

class Print implements Stmt {

	expression : Expr

	constructor (expression : Expr) {
		this.expression = expression
	}

	accept<R>(visitor: StmtVisitor<R>): R {
		return visitor.visitPrintStmt(this)
	}
}

class Block implements Stmt {

	statements : Array<Stmt>

	constructor (statements : Array<Stmt>) {
		this.statements = statements
	}

	accept<R>(visitor: StmtVisitor<R>): R {
		return visitor.visitBlockStmt(this)
	}
}

class If implements Stmt {

	condition : Expr
	thenBranch : Stmt
	elseBranch : Stmt | null

	constructor (condition : Expr, thenBranch : Stmt, elseBranch : Stmt | null) {
		this.condition = condition
		this.thenBranch = thenBranch
		this.elseBranch = elseBranch
	}

	accept<R>(visitor: StmtVisitor<R>): R {
		return visitor.visitIfStmt(this)
	}
}

class Break implements Stmt {

	accept<R>(visitor: StmtVisitor<R>): R {
		return visitor.visitBreakStmt(this)
	}
}

class Function implements Stmt {

	name : Token
	params : Array<Token>
	body : Array<Stmt>

	constructor (name : Token, params : Array<Token>, body : Array<Stmt>) {
		this.name = name
		this.params = params
		this.body = body
	}

	accept<R>(visitor: StmtVisitor<R>): R {
		return visitor.visitFunctionStmt(this)
	}
}

export {
	Expr,
	ExprVisitor,
	Stmt,
	StmtVisitor,
	Binary,
	Grouping,
	Literal,
	Unary,
	Conditional,
	Variable,
	Assign,
	Logical,
	Call,
	Var,
	While,
	Expression,
	Print,
	Block,
	If,
	Break,
	Function

}
