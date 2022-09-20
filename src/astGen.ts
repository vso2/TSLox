import { readFileSync, writeFileSync } from 'fs'

const file = readFileSync('./src/inputAst.txt', 'utf-8')

const commands = file.split(';')

let docs: any = []
let interfaces: Array<string> = []
let visitorInterfaces: Array<string> = []

for (let command of commands) {
    let doc: any = {}
    const vals = command.split(':')
    const interfaceName = vals[0].trim()
    if(!interfaces.find(e => e == interfaceName)) {
        interfaces.push(interfaceName)
        visitorInterfaces.push(`${interfaceName}Visitor`)
    }
    const className = vals[1].trim()
    doc.class = className
    doc.interface = interfaceName
    let listAtrs:Array<Object> = []
    if (vals.length > 2) {
        const rawAtrs = vals[2].split(',')
        for (let atr of rawAtrs) {
            let aux = atr.trim().split(' ')
            let type = aux.slice(0,aux.length-1).toString().replace(",|,",' | ')
            listAtrs.push( {type: type, name: aux[aux.length-1]})
        }
    }
    doc.atributes = listAtrs

    //console.log(doc)
    docs.push(doc)

}

writeFileSync('./src/ast.ts', `import { Token } from './Token' \n\n\n`, {flag: 'w'} )


for (let name of interfaces) {
    writeFileSync('./src/ast.ts', 
    `interface ${name} {
    accept<R>(visitor: ${name}Visitor<R>): R
}\n\n`, {flag: 'a+'} )


//Visitor Expr Interface

writeFileSync('./src/ast.ts', `interface ${name}Visitor<R> {\n`, {flag: 'a+'} )
for(let doc of docs) {
    if (doc.interface == name) {
        writeFileSync('./src/ast.ts',
        `\tvisit${doc.class}${name}(${name}: ${doc.class}): R\n`, {flag: 'a+'} )
    }
}
writeFileSync('./src/ast.ts', `}\n\n`, {flag: 'a+'} )


}

for(let doc of docs) {

    const ast = `class ${doc.class} implements ${doc.interface} {\n\n`

    writeFileSync('./src/ast.ts', ast, {flag: 'a+'})

    if (doc.atributes.length > 0) {
        for(let i in doc.atributes) {
            const val = `\t${doc.atributes[i].name} : ${doc.atributes[i].type}\n`
            writeFileSync('./src/ast.ts', val, {flag: 'a+'})
        }
    
        writeFileSync('./src/ast.ts', `\n\tconstructor (`, {flag: 'a+'})
    
        for(let i in doc.atributes) {
            const val = `${doc.atributes[i].name} : ${doc.atributes[i].type}`
            writeFileSync('./src/ast.ts', val, {flag: 'a+'})
            if(parseInt(i) !== doc.atributes.length-1) writeFileSync('./src/ast.ts', ', ', {flag: 'a+'})
        }
    
        writeFileSync('./src/ast.ts', `) {\n`, {flag: 'a+'})
    
        for(let i in doc.atributes) {
            const val = `\t\tthis.${doc.atributes[i].name} = ${doc.atributes[i].name}\n`
            writeFileSync('./src/ast.ts', val, {flag: 'a+'})
        }
    
        writeFileSync('./src/ast.ts', `\t}\n\n`, {flag: 'a+'})
    
    }
    writeFileSync('./src/ast.ts', `\taccept<R>(visitor: ${doc.interface}Visitor<R>): R {\n`, {flag: 'a+'})
    writeFileSync('./src/ast.ts', `\t\treturn visitor.visit${doc.class}${doc.interface}(this)\n\t}\n`, {flag: 'a+'})

    writeFileSync('./src/ast.ts', `}\n\n`, {flag: 'a+'})

}

//Export
writeFileSync('./src/ast.ts', `export {`, {flag: 'a+'})
for (let val in interfaces) {
    writeFileSync('./src/ast.ts', `\n\t${interfaces[val]},`, {flag: 'a+'})
    writeFileSync('./src/ast.ts', `\n\t${visitorInterfaces[val]}`, {flag: 'a+'})
    if ( parseInt(val,10) !== interfaces.length-1 ) writeFileSync('./src/ast.ts', `,`, {flag: 'a+'})
    
}
for (let val of docs) {
    writeFileSync('./src/ast.ts', `,\n\t${val.class}`, {flag: 'a+'})
    
}

writeFileSync('./src/ast.ts', `\n\n}\n`, {flag: 'a+'})
