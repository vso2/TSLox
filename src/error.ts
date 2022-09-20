class LoxError extends Error {

    public line: number
    public location: string

    constructor(message?: string, line?: number, location?: string) {
        super()
        this.message = message
        this.line = line
        this.location = location
    }

    private report_error(line:number, location: string, message: string): void {
        const report = "[line " + this.line + "] Error" + this.location + ": " + this.message
        console.log(report)
    }
    
    error(line:number, message:string): void {
        return this.report_error(this.line, "", this.message);
    }
}

export{
    LoxError
}