import { Binary, Expr, ExprVisitor, Grouping, Literal, Unary } from './ast'
import { Token } from './Token'
import { TokenType } from './TokenType'

class AstPrinter implements ExprVisitor<string> {
    
    print(expr: Expr): string {
        return expr.accept(this)
    }

    visitBinaryExpr(expr: Binary): string {
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right)
    }

    visitGroupingExpr(expr: Grouping): string {
        return this.parenthesize("group", expr.expression)
    }

    visitLiteralExpr(expr: Literal): string {
        if (expr.value == null) return "nil"
        return expr.value.toString()
    }

    visitUnaryExpr(expr: Unary): string {
        return this.parenthesize(expr.operator.lexeme, expr.right);
    }

    private parenthesize(name: string, ...exprs : Array<Expr>): string {
        let ret = "(";
        ret += name
        for (let expr of exprs) {
            ret += " "
            ret += expr.accept(this)
        }
        ret+= ")"
        return ret
    }
}

export {
    AstPrinter
}