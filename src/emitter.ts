import { Program, Statement, Expression, ClassMember } from "./types";

export class Emitter {
  private output: string = "";
  private indentLevel: number = 0;
  private indentString: string = "  ";

  emit(program: Program): string {
    this.output = "";
    this.indentLevel = 0;

    for (const stmt of program.statements) {
      this.emitStatement(stmt);
    }

    return this.output;
  }

  private emitStatement(stmt: Statement): void {
    switch (stmt.kind) {
      case "VariableDeclaration":
        this.emitVariableDeclaration(stmt);
        break;
      case "FunctionDeclaration":
        this.emitFunctionDeclaration(stmt);
        break;
      case "InterfaceDeclaration":
        this.emitLine(`// interface ${stmt.name} removed`);
        break;
      case "TypeAliasDeclaration":
        this.emitLine(`// type ${stmt.name} removed`);
        break;
      case "ClassDeclaration":
        this.emitClassDeclaration(stmt);
        break;
      case "EnumDeclaration":
        this.emitEnumDeclaration(stmt);
        break;
      case "ReturnStatement":
        this.emitReturnStatement(stmt);
        break;
      case "IfStatement":
        this.emitIfStatement(stmt);
        break;
      case "WhileStatement":
        this.emitWhileStatement(stmt);
        break;
      case "ForStatement":
        this.emitForStatement(stmt);
        break;
      case "ForOfStatement":
        this.emitForOfStatement(stmt);
        break;
      case "ForInStatement":
        this.emitForInStatement(stmt);
        break;
      case "DoWhileStatement":
        this.emitDoWhileStatement(stmt);
        break;
      case "SwitchStatement":
        this.emitSwitchStatement(stmt);
        break;
      case "BreakStatement":
        this.emitLine(stmt.label ? `break ${stmt.label};` : "break;");
        break;
      case "ContinueStatement":
        this.emitLine(stmt.label ? `continue ${stmt.label};` : "continue;");
        break;
      case "ThrowStatement":
        this.emitLine(`throw ${this.emitExpression(stmt.argument)};`);
        break;
      case "TryStatement":
        this.emitTryStatement(stmt);
        break;
      case "ExpressionStatement":
        this.emitLine(`${this.emitExpression(stmt.expression)};`);
        break;
      case "BlockStatement":
        this.emitBlockStatement(stmt);
        break;
      case "ImportDeclaration":
        this.emitImportDeclaration(stmt);
        break;
      case "ExportDeclaration":
        this.emitExportDeclaration(stmt);
        break;
      case "EmptyStatement":
        this.emitLine(";");
        break;
    }
  }

  private emitVariableDeclaration(decl: any): void {
    let line = `${decl.varKind} ${decl.name}`;
    if (decl.initializer) {
      line += ` = ${this.emitExpression(decl.initializer)}`;
    }
    line += ";";
    this.emitLine(line);
  }

  private emitFunctionDeclaration(decl: any): void {
    let prefix = "";
    if (decl.isAsync) prefix += "async ";
    prefix += "function";
    if (decl.isGenerator) prefix += "*";

    const params = decl.parameters
      .map((p: any) => {
        let param = "";
        if (p.rest) param += "...";
        param += p.name;
        if (p.defaultValue) {
          param += ` = ${this.emitExpression(p.defaultValue)}`;
        }
        return param;
      })
      .join(", ");

    this.emitLine(`${prefix} ${decl.name}(${params}) {`);
    this.indentLevel++;

    for (const stmt of decl.body.statements) {
      this.emitStatement(stmt);
    }

    this.indentLevel--;
    this.emitLine("}");
  }

  private emitClassDeclaration(decl: any): void {
    let line = "";
    if (decl.isAbstract) line += "/* abstract */ ";
    line += `class ${decl.name}`;

    if (decl.superClass) {
      line += ` extends ${this.emitExpression(decl.superClass)}`;
    }

    line += " {";
    this.emitLine(line);
    this.indentLevel++;

    for (const member of decl.members) {
      this.emitClassMember(member);
    }

    this.indentLevel--;
    this.emitLine("}");
  }

  private emitClassMember(member: ClassMember): void {
    switch (member.kind) {
      case "PropertyDeclaration": {
        let line = "";
        if (member.isStatic) line += "static ";
        line += member.name;
        if (member.initializer) {
          line += ` = ${this.emitExpression(member.initializer)}`;
        }
        line += ";";
        this.emitLine(line);
        break;
      }

      case "MethodDeclaration": {
        let prefix = "";
        if (member.isStatic) prefix += "static ";
        if (member.isAsync) prefix += "async ";

        const params = member.parameters
          .map((p: any) => {
            let param = "";
            if (p.rest) param += "...";
            param += p.name;
            if (p.defaultValue) {
              param += ` = ${this.emitExpression(p.defaultValue)}`;
            }
            return param;
          })
          .join(", ");

        if (member.body) {
          this.emitLine(`${prefix}${member.name}(${params}) {`);
          this.indentLevel++;
          for (const stmt of member.body.statements) {
            this.emitStatement(stmt);
          }
          this.indentLevel--;
          this.emitLine("}");
        } else {
          // Abstract method - skip in output
          this.emitLine(`// abstract ${member.name}(${params})`);
        }
        break;
      }

      case "ConstructorDeclaration": {
        const params = member.parameters
          .map((p: any) => {
            let param = "";
            if (p.rest) param += "...";
            param += p.name;
            if (p.defaultValue) {
              param += ` = ${this.emitExpression(p.defaultValue)}`;
            }
            return param;
          })
          .join(", ");

        this.emitLine(`constructor(${params}) {`);
        this.indentLevel++;
        for (const stmt of member.body.statements) {
          this.emitStatement(stmt);
        }
        this.indentLevel--;
        this.emitLine("}");
        break;
      }

      case "GetterDeclaration": {
        let prefix = "";
        if (member.isStatic) prefix += "static ";

        this.emitLine(`${prefix}get ${member.name}() {`);
        this.indentLevel++;
        for (const stmt of member.body.statements) {
          this.emitStatement(stmt);
        }
        this.indentLevel--;
        this.emitLine("}");
        break;
      }

      case "SetterDeclaration": {
        let prefix = "";
        if (member.isStatic) prefix += "static ";
        const paramName = member.parameter.name;

        this.emitLine(`${prefix}set ${member.name}(${paramName}) {`);
        this.indentLevel++;
        for (const stmt of member.body.statements) {
          this.emitStatement(stmt);
        }
        this.indentLevel--;
        this.emitLine("}");
        break;
      }
    }
  }

  private emitEnumDeclaration(decl: any): void {
    // Emit enum as object
    if (decl.isConst) {
      this.emitLine(`// const enum ${decl.name} - inlined`);
      return;
    }

    this.emitLine(`var ${decl.name};`);
    this.emitLine(`(function (${decl.name}) {`);
    this.indentLevel++;

    let currentValue = 0;
    for (const member of decl.members) {
      let value: string | number;
      if (member.initializer) {
        if (member.initializer.kind === "NumericLiteral") {
          value = member.initializer.value;
          currentValue = member.initializer.value + 1;
        } else if (member.initializer.kind === "StringLiteral") {
          value = `"${member.initializer.value}"`;
        } else {
          value = this.emitExpression(member.initializer);
        }
      } else {
        value = currentValue;
        currentValue++;
      }

      if (typeof value === "number") {
        this.emitLine(
          `${decl.name}[${decl.name}["${member.name}"] = ${value}] = "${member.name}";`
        );
      } else {
        this.emitLine(`${decl.name}["${member.name}"] = ${value};`);
      }
    }

    this.indentLevel--;
    this.emitLine(`})(${decl.name} || (${decl.name} = {}));`);
  }

  private emitReturnStatement(stmt: any): void {
    if (stmt.argument) {
      this.emitLine(`return ${this.emitExpression(stmt.argument)};`);
    } else {
      this.emitLine("return;");
    }
  }

  private emitIfStatement(stmt: any): void {
    const condition = this.emitExpression(stmt.condition);
    this.emitLine(`if (${condition}) {`);
    this.indentLevel++;

    if (stmt.consequent.kind === "BlockStatement") {
      for (const s of stmt.consequent.statements) {
        this.emitStatement(s);
      }
    } else {
      this.emitStatement(stmt.consequent);
    }

    this.indentLevel--;

    if (stmt.alternate) {
      if (stmt.alternate.kind === "IfStatement") {
        this.output = this.output.trimEnd() + "} else ";
        this.emitIfStatement(stmt.alternate);
      } else {
        this.emitLine("} else {");
        this.indentLevel++;

        if (stmt.alternate.kind === "BlockStatement") {
          for (const s of stmt.alternate.statements) {
            this.emitStatement(s);
          }
        } else {
          this.emitStatement(stmt.alternate);
        }

        this.indentLevel--;
        this.emitLine("}");
      }
    } else {
      this.emitLine("}");
    }
  }

  private emitWhileStatement(stmt: any): void {
    this.emitLine(`while (${this.emitExpression(stmt.condition)}) {`);
    this.indentLevel++;

    if (stmt.body.kind === "BlockStatement") {
      for (const s of stmt.body.statements) {
        this.emitStatement(s);
      }
    } else {
      this.emitStatement(stmt.body);
    }

    this.indentLevel--;
    this.emitLine("}");
  }

  private emitForStatement(stmt: any): void {
    let init = "";
    if (stmt.init) {
      if (stmt.init.kind === "VariableDeclaration") {
        init = `${stmt.init.varKind} ${stmt.init.name}`;
        if (stmt.init.initializer) {
          init += ` = ${this.emitExpression(stmt.init.initializer)}`;
        }
      } else {
        init = this.emitExpression(stmt.init);
      }
    }

    const condition = stmt.condition ? this.emitExpression(stmt.condition) : "";
    const update = stmt.update ? this.emitExpression(stmt.update) : "";

    this.emitLine(`for (${init}; ${condition}; ${update}) {`);
    this.indentLevel++;

    if (stmt.body.kind === "BlockStatement") {
      for (const s of stmt.body.statements) {
        this.emitStatement(s);
      }
    } else {
      this.emitStatement(stmt.body);
    }

    this.indentLevel--;
    this.emitLine("}");
  }

  private emitForOfStatement(stmt: any): void {
    let variable = "";
    if (stmt.variable.kind === "VariableDeclaration") {
      variable = `${stmt.variable.varKind} ${stmt.variable.name}`;
    } else {
      variable = stmt.variable.name;
    }

    const keyword = stmt.isAwait ? "for await" : "for";
    this.emitLine(
      `${keyword} (${variable} of ${this.emitExpression(stmt.iterable)}) {`
    );
    this.indentLevel++;

    if (stmt.body.kind === "BlockStatement") {
      for (const s of stmt.body.statements) {
        this.emitStatement(s);
      }
    } else {
      this.emitStatement(stmt.body);
    }

    this.indentLevel--;
    this.emitLine("}");
  }

  private emitForInStatement(stmt: any): void {
    let variable = "";
    if (stmt.variable.kind === "VariableDeclaration") {
      variable = `${stmt.variable.varKind} ${stmt.variable.name}`;
    } else {
      variable = stmt.variable.name;
    }

    this.emitLine(`for (${variable} in ${this.emitExpression(stmt.object)}) {`);
    this.indentLevel++;

    if (stmt.body.kind === "BlockStatement") {
      for (const s of stmt.body.statements) {
        this.emitStatement(s);
      }
    } else {
      this.emitStatement(stmt.body);
    }

    this.indentLevel--;
    this.emitLine("}");
  }

  private emitDoWhileStatement(stmt: any): void {
    this.emitLine("do {");
    this.indentLevel++;

    if (stmt.body.kind === "BlockStatement") {
      for (const s of stmt.body.statements) {
        this.emitStatement(s);
      }
    } else {
      this.emitStatement(stmt.body);
    }

    this.indentLevel--;
    this.emitLine(`} while (${this.emitExpression(stmt.condition)});`);
  }

  private emitSwitchStatement(stmt: any): void {
    this.emitLine(`switch (${this.emitExpression(stmt.discriminant)}) {`);
    this.indentLevel++;

    for (const caseClause of stmt.cases) {
      if (caseClause.test) {
        this.emitLine(`case ${this.emitExpression(caseClause.test)}:`);
      } else {
        this.emitLine("default:");
      }
      this.indentLevel++;
      for (const consequent of caseClause.consequent) {
        this.emitStatement(consequent);
      }
      this.indentLevel--;
    }

    this.indentLevel--;
    this.emitLine("}");
  }

  private emitTryStatement(stmt: any): void {
    this.emitLine("try {");
    this.indentLevel++;
    for (const s of stmt.block.statements) {
      this.emitStatement(s);
    }
    this.indentLevel--;

    if (stmt.handler) {
      const param = stmt.handler.param ? stmt.handler.param.name : "";
      this.emitLine(`} catch (${param}) {`);
      this.indentLevel++;
      for (const s of stmt.handler.body.statements) {
        this.emitStatement(s);
      }
      this.indentLevel--;
    }

    if (stmt.finalizer) {
      this.emitLine("} finally {");
      this.indentLevel++;
      for (const s of stmt.finalizer.statements) {
        this.emitStatement(s);
      }
      this.indentLevel--;
    }

    this.emitLine("}");
  }

  private emitBlockStatement(block: any): void {
    this.emitLine("{");
    this.indentLevel++;

    for (const stmt of block.statements) {
      this.emitStatement(stmt);
    }

    this.indentLevel--;
    this.emitLine("}");
  }

  private emitImportDeclaration(decl: any): void {
    if (decl.specifiers.length === 0) {
      this.emitLine(`import "${decl.source}";`);
      return;
    }

    const parts: string[] = [];
    let hasDefault = false;
    let hasNamespace = false;
    const named: string[] = [];

    for (const spec of decl.specifiers) {
      if (spec.kind === "ImportDefaultSpecifier") {
        hasDefault = true;
        parts.push(spec.local);
      } else if (spec.kind === "ImportNamespaceSpecifier") {
        hasNamespace = true;
        parts.push(`* as ${spec.local}`);
      } else if (spec.kind === "ImportNamedSpecifier") {
        if (spec.imported === spec.local) {
          named.push(spec.local);
        } else {
          named.push(`${spec.imported} as ${spec.local}`);
        }
      }
    }

    if (named.length > 0) {
      if (hasDefault) {
        parts.push(`{ ${named.join(", ")} }`);
      } else {
        parts.push(`{ ${named.join(", ")} }`);
      }
    }

    this.emitLine(`import ${parts.join(", ")} from "${decl.source}";`);
  }

  private emitExportDeclaration(decl: any): void {
    if (decl.isDefault) {
      if (decl.declaration) {
        if (decl.declaration.kind === "FunctionDeclaration") {
          this.output += this.indent() + "export default ";
          this.emitFunctionDeclaration(decl.declaration);
          return;
        }
        if (decl.declaration.kind === "ClassDeclaration") {
          this.output += this.indent() + "export default ";
          this.emitClassDeclaration(decl.declaration);
          return;
        }
        if (decl.declaration.kind === "ExpressionStatement") {
          this.emitLine(
            `export default ${this.emitExpression(
              decl.declaration.expression
            )};`
          );
          return;
        }
      }
    }

    if (decl.specifiers && decl.specifiers.length > 0) {
      const specs = decl.specifiers
        .map((s: any) => {
          if (s.local === s.exported) {
            return s.local;
          }
          return `${s.local} as ${s.exported}`;
        })
        .join(", ");

      if (decl.source) {
        this.emitLine(`export { ${specs} } from "${decl.source}";`);
      } else {
        this.emitLine(`export { ${specs} };`);
      }
      return;
    }

    if (decl.source && !decl.specifiers) {
      this.emitLine(`export * from "${decl.source}";`);
      return;
    }

    if (decl.declaration) {
      this.output += this.indent() + "export ";
      // Remove indent from the declaration itself
      const savedIndent = this.indentLevel;
      this.indentLevel = 0;

      if (decl.declaration.kind === "FunctionDeclaration") {
        this.emitFunctionDeclaration(decl.declaration);
      } else if (decl.declaration.kind === "ClassDeclaration") {
        this.emitClassDeclaration(decl.declaration);
      } else if (decl.declaration.kind === "VariableDeclaration") {
        let line = `${decl.declaration.varKind} ${decl.declaration.name}`;
        if (decl.declaration.initializer) {
          line += ` = ${this.emitExpression(decl.declaration.initializer)}`;
        }
        this.output += line + ";\n";
      } else if (decl.declaration.kind === "InterfaceDeclaration") {
        this.output += `// interface ${decl.declaration.name} removed\n`;
      } else if (decl.declaration.kind === "TypeAliasDeclaration") {
        this.output += `// type ${decl.declaration.name} removed\n`;
      } else if (decl.declaration.kind === "EnumDeclaration") {
        this.indentLevel = savedIndent;
        this.emitEnumDeclaration(decl.declaration);
        return;
      }

      this.indentLevel = savedIndent;
    }
  }

  private emitExpression(expr: Expression): string {
    switch (expr.kind) {
      case "NumericLiteral":
        return String(expr.value);

      case "StringLiteral":
        return JSON.stringify(expr.value);

      case "BooleanLiteral":
        return String(expr.value);

      case "NullLiteral":
        return "null";

      case "UndefinedLiteral":
        return "undefined";

      case "Identifier":
        return expr.name;

      case "ThisExpression":
        return "this";

      case "SuperExpression":
        return "super";

      case "BinaryExpression":
        return `${this.emitExpression(expr.left)} ${
          expr.operator
        } ${this.emitExpression(expr.right)}`;

      case "UnaryExpression":
        if (expr.prefix) {
          const op = expr.operator;
          const space = op === "typeof" || op === "delete" ? " " : "";
          return `${op}${space}${this.emitExpression(expr.operand)}`;
        }
        return `${this.emitExpression(expr.operand)}${expr.operator}`;

      case "UpdateExpression":
        if (expr.prefix) {
          return `${expr.operator}${this.emitExpression(expr.argument)}`;
        }
        return `${this.emitExpression(expr.argument)}${expr.operator}`;

      case "CallExpression": {
        const callee = this.emitExpression(expr.callee);
        const args = expr.arguments
          .map((arg) => this.emitExpression(arg))
          .join(", ");
        const optionalChain = expr.optional ? "?." : "";
        return `${callee}${optionalChain}(${args})`;
      }

      case "MemberExpression": {
        const obj = this.emitExpression(expr.object);
        const optionalChain = expr.optional ? "?." : ".";
        return `${obj}${optionalChain}${expr.property}`;
      }

      case "ComputedMemberExpression": {
        const obj = this.emitExpression(expr.object);
        const prop = this.emitExpression(expr.property);
        const optionalChain = expr.optional ? "?." : "";
        return `${obj}${optionalChain}[${prop}]`;
      }

      case "ObjectLiteral": {
        if (expr.properties.length === 0) {
          return "{}";
        }
        const props = expr.properties
          .map((p) => {
            if (p.value.kind === "SpreadElement") {
              return `...${this.emitExpression((p.value as any).argument)}`;
            }
            if (p.shorthand) {
              return typeof p.key === "string"
                ? p.key
                : this.emitExpression(p.key);
            }
            if (p.computed) {
              return `[${this.emitExpression(
                p.key as Expression
              )}]: ${this.emitExpression(p.value)}`;
            }
            if (p.method) {
              const funcExpr = p.value as any;
              const params =
                funcExpr.parameters
                  ?.map((param: any) => param.name)
                  .join(", ") || "";
              let body = "";
              if (funcExpr.body?.statements) {
                body = funcExpr.body.statements
                  .map((s: any) => this.emitStatementInline(s))
                  .join(" ");
              }
              return `${p.key}(${params}) { ${body} }`;
            }
            const key =
              typeof p.key === "string" ? p.key : this.emitExpression(p.key);
            return `${key}: ${this.emitExpression(p.value)}`;
          })
          .join(", ");
        return `{ ${props} }`;
      }

      case "ArrayLiteral": {
        const elements = expr.elements
          .map((el) => {
            if (el === null) return "";
            if (el.kind === "SpreadElement") {
              return `...${this.emitExpression(el.argument)}`;
            }
            return this.emitExpression(el);
          })
          .join(", ");
        return `[${elements}]`;
      }

      case "ArrowFunction": {
        let prefix = expr.isAsync ? "async " : "";
        const params = expr.parameters
          .map((p) => {
            let param = "";
            if (p.rest) param += "...";
            param += p.name;
            if (p.defaultValue) {
              param += ` = ${this.emitExpression(p.defaultValue)}`;
            }
            return param;
          })
          .join(", ");

        let body: string;
        if (expr.body.kind === "BlockStatement") {
          const stmts = (expr.body as any).statements
            .map((s: any) => this.emitStatementInline(s))
            .join(" ");
          body = `{ ${stmts} }`;
        } else {
          body = this.emitExpression(expr.body as Expression);
        }

        if (
          expr.parameters.length === 1 &&
          !expr.parameters[0].typeAnnotation &&
          !expr.parameters[0].defaultValue
        ) {
          return `${prefix}${params} => ${body}`;
        }
        return `${prefix}(${params}) => ${body}`;
      }

      case "FunctionExpression": {
        let prefix = expr.isAsync ? "async " : "";
        prefix += "function";
        if (expr.isGenerator) prefix += "*";
        if (expr.name) prefix += ` ${expr.name}`;

        const params = expr.parameters
          .map((p) => {
            let param = "";
            if (p.rest) param += "...";
            param += p.name;
            if (p.defaultValue) {
              param += ` = ${this.emitExpression(p.defaultValue)}`;
            }
            return param;
          })
          .join(", ");

        const stmts = expr.body.statements
          .map((s: any) => this.emitStatementInline(s))
          .join(" ");
        return `${prefix}(${params}) { ${stmts} }`;
      }

      case "ConditionalExpression":
        return `${this.emitExpression(expr.condition)} ? ${this.emitExpression(
          expr.consequent
        )} : ${this.emitExpression(expr.alternate)}`;

      case "AssignmentExpression":
        return `${this.emitExpression(expr.left)} ${
          expr.operator
        } ${this.emitExpression(expr.right)}`;

      case "LogicalExpression":
        return `${this.emitExpression(expr.left)} ${
          expr.operator
        } ${this.emitExpression(expr.right)}`;

      case "NewExpression": {
        const callee = this.emitExpression(expr.callee);
        const args = expr.arguments
          .map((arg) => this.emitExpression(arg))
          .join(", ");
        return `new ${callee}(${args})`;
      }

      case "SpreadElement":
        return `...${this.emitExpression(expr.argument)}`;

      case "AwaitExpression":
        return `await ${this.emitExpression(expr.argument)}`;

      case "YieldExpression":
        if (expr.argument) {
          return expr.delegate
            ? `yield* ${this.emitExpression(expr.argument)}`
            : `yield ${this.emitExpression(expr.argument)}`;
        }
        return "yield";

      case "TemplateLiteralExpr": {
        let result = "`";
        for (let i = 0; i < expr.quasis.length; i++) {
          result += expr.quasis[i];
          if (i < expr.expressions.length) {
            result += "${" + this.emitExpression(expr.expressions[i]) + "}";
          }
        }
        result += "`";
        return result;
      }

      case "TaggedTemplateExpression":
        return `${this.emitExpression(expr.tag)}${this.emitExpression(
          expr.quasi
        )}`;

      case "TypeAssertion":
        return this.emitExpression(expr.expression);

      case "AsExpression":
        return this.emitExpression(expr.expression);

      case "NonNullExpression":
        return this.emitExpression(expr.expression);

      case "ClassExpression": {
        let result = "class";
        if (expr.name) result += ` ${expr.name}`;
        if (expr.superClass) {
          result += ` extends ${this.emitExpression(expr.superClass)}`;
        }
        result += " { }"; // Simplified
        return result;
      }

      case "ParenthesizedExpression":
        return `(${this.emitExpression(expr.expression)})`;

      default:
        return "";
    }
  }

  private emitStatementInline(stmt: Statement): string {
    switch (stmt.kind) {
      case "ReturnStatement":
        return stmt.argument
          ? `return ${this.emitExpression(stmt.argument)};`
          : "return;";
      case "ExpressionStatement":
        return `${this.emitExpression(stmt.expression)};`;
      case "VariableDeclaration": {
        let result = `${stmt.varKind} ${stmt.name}`;
        if (stmt.initializer) {
          result += ` = ${this.emitExpression(stmt.initializer)}`;
        }
        return result + ";";
      }
      case "BreakStatement":
        return stmt.label ? `break ${stmt.label};` : "break;";
      case "ContinueStatement":
        return stmt.label ? `continue ${stmt.label};` : "continue;";
      case "ThrowStatement":
        return `throw ${this.emitExpression(stmt.argument)};`;
      case "IfStatement":
        return this.emitIfStatementInline(stmt);
      case "BlockStatement": {
        const stmts = (stmt as any).statements
          .map((s: any) => this.emitStatementInline(s))
          .join(" ");
        return `{ ${stmts} }`;
      }
      case "ForOfStatement":
      case "ForInStatement": {
        const s = stmt as any;
        const keyword = s.kind === "ForOfStatement" ? "of" : "in";
        const variable = `${s.variableKind || "const"} ${s.variable}`;
        const bodyStr = this.emitStatementInline(s.body);
        return `for (${variable} ${keyword} ${this.emitExpression(
          s.iterable
        )}) ${bodyStr}`;
      }
      default:
        return "";
    }
  }

  private emitIfStatementInline(stmt: any): string {
    const condition = this.emitExpression(stmt.condition);
    let result = `if (${condition}) `;

    if (stmt.consequent.kind === "BlockStatement") {
      const stmts = stmt.consequent.statements
        .map((s: any) => this.emitStatementInline(s))
        .join(" ");
      result += `{ ${stmts} }`;
    } else {
      result += this.emitStatementInline(stmt.consequent);
    }

    if (stmt.alternate) {
      result += " else ";
      if (stmt.alternate.kind === "IfStatement") {
        result += this.emitIfStatementInline(stmt.alternate);
      } else if (stmt.alternate.kind === "BlockStatement") {
        const stmts = stmt.alternate.statements
          .map((s: any) => this.emitStatementInline(s))
          .join(" ");
        result += `{ ${stmts} }`;
      } else {
        result += this.emitStatementInline(stmt.alternate);
      }
    }

    return result;
  }

  private indent(): string {
    return this.indentString.repeat(this.indentLevel);
  }

  private emitLine(line: string): void {
    this.output += this.indent() + line + "\n";
  }
}

export function emit(program: Program): string {
  const emitter = new Emitter();
  return emitter.emit(program);
}
