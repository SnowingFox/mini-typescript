import {
  Program,
  Statement,
  Expression,
  TypeNode,
  Type,
  CompilerError,
  VariableDeclaration,
  FunctionDeclaration,
  InterfaceDeclaration,
  TypeAliasDeclaration,
  ClassDeclaration,
  EnumDeclaration,
  ReturnStatement,
  IfStatement,
  WhileStatement,
  ForStatement,
  ForOfStatement,
  ForInStatement,
  SwitchStatement,
  ThrowStatement,
  TryStatement,
  ExpressionStatement,
  BlockStatement,
  PrimitiveType,
  FunctionType,
  InterfaceType,
  ClassType,
  EnumType,
  ArrayTypeValue,
  UnionTypeValue,
  IntersectionTypeValue,
  TupleTypeValue,
  LiteralTypeValue,
  AnyType,
  UnknownType,
  NeverType,
  createNumberType,
  createStringType,
  createBooleanType,
  createVoidType,
  createNullType,
  createUndefinedType,
  createAnyType,
  createUnknownType,
  createNeverType,
  createArrayType,
  createUnionType,
} from "./types";

// Symbol table entry
interface SymbolEntry {
  type: Type;
  kind: "variable" | "function" | "interface" | "class" | "enum" | "typeAlias";
  mutable?: boolean;
}

// Type environment (scope)
class TypeEnvironment {
  private symbols: Map<string, SymbolEntry> = new Map();
  private types: Map<string, Type> = new Map();
  private parent: TypeEnvironment | null;

  constructor(parent: TypeEnvironment | null = null) {
    this.parent = parent;
  }

  define(name: string, entry: SymbolEntry): void {
    this.symbols.set(name, entry);
  }

  defineType(name: string, type: Type): void {
    this.types.set(name, type);
  }

  lookup(name: string): SymbolEntry | undefined {
    const entry = this.symbols.get(name);
    if (entry) return entry;
    if (this.parent) return this.parent.lookup(name);
    return undefined;
  }

  lookupType(name: string): Type | undefined {
    const type = this.types.get(name);
    if (type) return type;
    if (this.parent) return this.parent.lookupType(name);
    return undefined;
  }

  hasLocal(name: string): boolean {
    return this.symbols.has(name);
  }
}

export class TypeChecker {
  private errors: CompilerError[] = [];
  private globalEnv: TypeEnvironment;
  private currentEnv: TypeEnvironment;
  private currentReturnType: Type | null = null;
  private inLoop: boolean = false;

  constructor() {
    this.globalEnv = new TypeEnvironment();
    this.currentEnv = this.globalEnv;
    this.registerBuiltins();
  }

  private registerBuiltins(): void {
    // Register console with variadic functions
    const consoleMembers = new Map<string, { type: Type; optional?: boolean }>();
    const logFn: FunctionType = {
      kind: "function",
      params: [{ name: "...args", type: createAnyType(), optional: true }],
      returnType: createVoidType(),
    };
    consoleMembers.set("log", { type: logFn });
    consoleMembers.set("error", { type: logFn });
    consoleMembers.set("warn", { type: logFn });
    consoleMembers.set("info", { type: logFn });
    consoleMembers.set("debug", { type: logFn });

    this.globalEnv.define("console", {
      type: { kind: "interface", name: "Console", members: consoleMembers } as InterfaceType,
      kind: "variable",
    });

    // Register Array constructor
    this.globalEnv.define("Array", {
      type: createAnyType(),
      kind: "variable",
    });

    // Register Object
    this.globalEnv.define("Object", {
      type: createAnyType(),
      kind: "variable",
    });

    // Register Math
    this.globalEnv.define("Math", {
      type: createAnyType(),
      kind: "variable",
    });

    // Register JSON
    this.globalEnv.define("JSON", {
      type: createAnyType(),
      kind: "variable",
    });

    // Register Promise
    this.globalEnv.defineType("Promise", createAnyType());

    // Register Error
    this.globalEnv.define("Error", {
      type: createAnyType(),
      kind: "class",
    });
  }

  check(program: Program): CompilerError[] {
    this.errors = [];

    // First pass: collect type aliases and enums (they are simpler)
    for (const stmt of program.statements) {
      if (stmt.kind === "TypeAliasDeclaration") {
        this.registerTypeAlias(stmt);
      } else if (stmt.kind === "EnumDeclaration") {
        this.registerEnumType(stmt);
      }
    }

    // Second pass: collect interfaces (may reference type aliases)
    for (const stmt of program.statements) {
      if (stmt.kind === "InterfaceDeclaration") {
        this.registerInterfaceType(stmt);
      }
    }

    // Third pass: collect classes (may extend other classes)
    for (const stmt of program.statements) {
      if (stmt.kind === "ClassDeclaration") {
        this.registerClassType(stmt);
      }
    }

    // Fourth pass: collect function declarations
    for (const stmt of program.statements) {
      if (stmt.kind === "FunctionDeclaration") {
        this.registerFunctionType(stmt);
      }
    }

    // Fifth pass: check all statements
    for (const stmt of program.statements) {
      this.checkStatement(stmt);
    }

    return this.errors;
  }

  private checkStatement(stmt: Statement): void {
    switch (stmt.kind) {
      case "VariableDeclaration":
        this.checkVariableDeclaration(stmt);
        break;
      case "FunctionDeclaration":
        this.checkFunctionDeclaration(stmt);
        break;
      case "InterfaceDeclaration":
      case "TypeAliasDeclaration":
        // Already processed
        break;
      case "ClassDeclaration":
        this.checkClassDeclaration(stmt);
        break;
      case "EnumDeclaration":
        // Already processed, but check initializers
        this.checkEnumDeclaration(stmt);
        break;
      case "ReturnStatement":
        this.checkReturnStatement(stmt);
        break;
      case "IfStatement":
        this.checkIfStatement(stmt);
        break;
      case "WhileStatement":
        this.checkWhileStatement(stmt);
        break;
      case "ForStatement":
        this.checkForStatement(stmt);
        break;
      case "ForOfStatement":
        this.checkForOfStatement(stmt);
        break;
      case "ForInStatement":
        this.checkForInStatement(stmt);
        break;
      case "DoWhileStatement":
        this.checkStatement(stmt.body);
        this.checkExpression(stmt.condition);
        break;
      case "SwitchStatement":
        this.checkSwitchStatement(stmt);
        break;
      case "BreakStatement":
      case "ContinueStatement":
        // Just validate we're in a loop/switch
        break;
      case "ThrowStatement":
        this.checkExpression(stmt.argument);
        break;
      case "TryStatement":
        this.checkTryStatement(stmt);
        break;
      case "ExpressionStatement":
        this.checkExpression(stmt.expression);
        break;
      case "BlockStatement":
        this.checkBlockStatement(stmt);
        break;
      case "ImportDeclaration":
      case "ExportDeclaration":
        // Module declarations - skip for now
        break;
      case "EmptyStatement":
        break;
    }
  }

  private checkVariableDeclaration(decl: VariableDeclaration): void {
    let declaredType: Type | undefined;
    if (decl.typeAnnotation) {
      declaredType = this.resolveTypeNode(decl.typeAnnotation);
    }

    let inferredType: Type | undefined;
    if (decl.initializer) {
      inferredType = this.checkExpression(decl.initializer);
    }

    let finalType: Type;
    if (declaredType && inferredType) {
      if (!this.isAssignable(inferredType, declaredType)) {
        this.addError(
          `Type '${this.typeToString(inferredType)}' is not assignable to type '${this.typeToString(declaredType)}'`,
          decl.line
        );
      }
      finalType = declaredType;
    } else if (declaredType) {
      finalType = declaredType;
    } else if (inferredType) {
      finalType = inferredType;
    } else {
      finalType = createAnyType();
    }

    if (this.currentEnv.hasLocal(decl.name)) {
      this.addError(`Variable '${decl.name}' is already declared in this scope`, decl.line);
    } else {
      this.currentEnv.define(decl.name, {
        type: finalType,
        kind: "variable",
        mutable: decl.varKind !== "const",
      });
    }
  }

  private registerFunctionType(decl: FunctionDeclaration): void {
    const params = decl.parameters.map((p) => ({
      name: p.name,
      type: p.typeAnnotation ? this.resolveTypeNode(p.typeAnnotation) : createAnyType(),
      optional: p.optional,
    }));

    const returnType = decl.returnType
      ? this.resolveTypeNode(decl.returnType)
      : createVoidType();

    const funcType: FunctionType = {
      kind: "function",
      params,
      returnType,
    };

    this.globalEnv.define(decl.name, { type: funcType, kind: "function" });
  }

  private checkFunctionDeclaration(decl: FunctionDeclaration): void {
    const entry = this.currentEnv.lookup(decl.name);
    if (!entry || entry.kind !== "function") return;

    const funcType = entry.type as FunctionType;

    const previousEnv = this.currentEnv;
    this.currentEnv = new TypeEnvironment(this.globalEnv);

    for (const param of funcType.params) {
      this.currentEnv.define(param.name, { type: param.type, kind: "variable" });
    }

    const previousReturnType = this.currentReturnType;
    this.currentReturnType = funcType.returnType;

    this.checkBlockStatement(decl.body);

    this.currentReturnType = previousReturnType;
    this.currentEnv = previousEnv;
  }

  private registerInterfaceType(decl: InterfaceDeclaration): void {
    const members = new Map<string, { type: Type; optional?: boolean; readonly?: boolean }>();

    for (const member of decl.members) {
      const memberType = this.resolveTypeNode(member.typeAnnotation);
      members.set(member.name, {
        type: memberType,
        optional: member.optional,
        readonly: member.readonly,
      });
    }

    const interfaceType: InterfaceType = {
      kind: "interface",
      name: decl.name,
      members,
    };

    this.globalEnv.define(decl.name, { type: interfaceType, kind: "interface" });
    this.globalEnv.defineType(decl.name, interfaceType);
  }

  private registerTypeAlias(decl: TypeAliasDeclaration): void {
    const type = this.resolveTypeNode(decl.type);
    this.globalEnv.defineType(decl.name, type);
  }

  private registerClassType(decl: ClassDeclaration): void {
    const members = new Map<string, { type: Type; accessibility?: string; static?: boolean }>();
    const staticMembers = new Map<string, { type: Type }>();

    // Inherit from superclass if exists
    if (decl.superClass && decl.superClass.kind === "Identifier") {
      const superEntry = this.globalEnv.lookup(decl.superClass.name);
      if (superEntry && superEntry.type.kind === "class") {
        const superClass = superEntry.type as ClassType;
        // Copy all members from superclass
        for (const [name, member] of superClass.members) {
          members.set(name, member);
        }
        for (const [name, member] of superClass.staticMembers) {
          staticMembers.set(name, member);
        }
      }
    }

    for (const member of decl.members) {
      if (member.kind === "PropertyDeclaration") {
        const propType = member.typeAnnotation
          ? this.resolveTypeNode(member.typeAnnotation)
          : createAnyType();
        
        if (member.isStatic) {
          staticMembers.set(member.name, { type: propType });
        } else {
          members.set(member.name, {
            type: propType,
            accessibility: member.accessibility,
            static: member.isStatic,
          });
        }
      } else if (member.kind === "MethodDeclaration") {
        const params = member.parameters.map((p) => ({
          name: p.name,
          type: p.typeAnnotation ? this.resolveTypeNode(p.typeAnnotation) : createAnyType(),
        }));
        const returnType = member.returnType
          ? this.resolveTypeNode(member.returnType)
          : createVoidType();

        const methodType: FunctionType = {
          kind: "function",
          params,
          returnType,
        };

        if (member.isStatic) {
          staticMembers.set(member.name, { type: methodType });
        } else {
          members.set(member.name, {
            type: methodType,
            accessibility: member.accessibility,
            static: member.isStatic,
          });
        }
      }
    }

    const classType: ClassType = {
      kind: "class",
      name: decl.name,
      members,
      staticMembers,
    };

    this.globalEnv.define(decl.name, { type: classType, kind: "class" });
    this.globalEnv.defineType(decl.name, classType);
  }

  private checkClassDeclaration(decl: ClassDeclaration): void {
    const previousEnv = this.currentEnv;
    this.currentEnv = new TypeEnvironment(this.globalEnv);

    // Add 'this' to scope
    const classType = this.globalEnv.lookupType(decl.name);
    if (classType) {
      this.currentEnv.define("this", { type: classType, kind: "variable" });
    }

    for (const member of decl.members) {
      if (member.kind === "MethodDeclaration" && member.body) {
        const methodEnv = new TypeEnvironment(this.currentEnv);
        
        for (const param of member.parameters) {
          const paramType = param.typeAnnotation
            ? this.resolveTypeNode(param.typeAnnotation)
            : createAnyType();
          methodEnv.define(param.name, { type: paramType, kind: "variable" });
        }

        const previousReturn = this.currentReturnType;
        this.currentReturnType = member.returnType
          ? this.resolveTypeNode(member.returnType)
          : createVoidType();

        const savedEnv = this.currentEnv;
        this.currentEnv = methodEnv;
        this.checkBlockStatement(member.body);
        this.currentEnv = savedEnv;
        this.currentReturnType = previousReturn;
      } else if (member.kind === "ConstructorDeclaration") {
        const ctorEnv = new TypeEnvironment(this.currentEnv);
        
        for (const param of member.parameters) {
          const paramType = param.typeAnnotation
            ? this.resolveTypeNode(param.typeAnnotation)
            : createAnyType();
          ctorEnv.define(param.name, { type: paramType, kind: "variable" });
        }

        const savedEnv = this.currentEnv;
        this.currentEnv = ctorEnv;
        this.checkBlockStatement(member.body);
        this.currentEnv = savedEnv;
      } else if (member.kind === "PropertyDeclaration" && member.initializer) {
        this.checkExpression(member.initializer);
      }
    }

    this.currentEnv = previousEnv;
  }

  private registerEnumType(decl: EnumDeclaration): void {
    const members = new Map<string, number | string>();
    let currentValue = 0;

    for (const member of decl.members) {
      if (member.initializer) {
        if (member.initializer.kind === "NumericLiteral") {
          currentValue = member.initializer.value;
          members.set(member.name, currentValue);
          currentValue++;
        } else if (member.initializer.kind === "StringLiteral") {
          members.set(member.name, member.initializer.value);
        }
      } else {
        members.set(member.name, currentValue);
        currentValue++;
      }
    }

    const enumType: EnumType = {
      kind: "enum",
      name: decl.name,
      members,
    };

    this.globalEnv.define(decl.name, { type: enumType, kind: "enum" });
    this.globalEnv.defineType(decl.name, enumType);
  }

  private checkEnumDeclaration(decl: EnumDeclaration): void {
    for (const member of decl.members) {
      if (member.initializer) {
        this.checkExpression(member.initializer);
      }
    }
  }

  private checkReturnStatement(stmt: ReturnStatement): void {
    if (!this.currentReturnType) {
      this.addError("Return statement outside of function", stmt.line);
      return;
    }

    if (stmt.argument) {
      const argType = this.checkExpression(stmt.argument);
      if (!this.isAssignable(argType, this.currentReturnType)) {
        this.addError(
          `Type '${this.typeToString(argType)}' is not assignable to return type '${this.typeToString(this.currentReturnType)}'`,
          stmt.line
        );
      }
    } else if (
      this.currentReturnType.kind !== "void" &&
      this.currentReturnType.kind !== "undefined"
    ) {
      this.addError("A function whose return type is not 'void' must return a value", stmt.line);
    }
  }

  private checkIfStatement(stmt: IfStatement): void {
    this.checkExpression(stmt.condition);
    this.checkStatement(stmt.consequent);
    if (stmt.alternate) {
      this.checkStatement(stmt.alternate);
    }
  }

  private checkWhileStatement(stmt: WhileStatement): void {
    this.checkExpression(stmt.condition);
    const wasInLoop = this.inLoop;
    this.inLoop = true;
    this.checkStatement(stmt.body);
    this.inLoop = wasInLoop;
  }

  private checkForStatement(stmt: ForStatement): void {
    const previousEnv = this.currentEnv;
    this.currentEnv = new TypeEnvironment(previousEnv);

    if (stmt.init) {
      if (stmt.init.kind === "VariableDeclaration") {
        this.checkVariableDeclaration(stmt.init);
      } else {
        this.checkExpression(stmt.init);
      }
    }

    if (stmt.condition) {
      this.checkExpression(stmt.condition);
    }

    if (stmt.update) {
      this.checkExpression(stmt.update);
    }

    const wasInLoop = this.inLoop;
    this.inLoop = true;
    this.checkStatement(stmt.body);
    this.inLoop = wasInLoop;

    this.currentEnv = previousEnv;
  }

  private checkForOfStatement(stmt: ForOfStatement): void {
    const previousEnv = this.currentEnv;
    this.currentEnv = new TypeEnvironment(previousEnv);

    const iterableType = this.checkExpression(stmt.iterable);

    if (stmt.variable.kind === "VariableDeclaration") {
      // Infer element type from iterable
      let elementType: Type = createAnyType();
      if (iterableType.kind === "array") {
        elementType = iterableType.elementType;
      }

      this.currentEnv.define(stmt.variable.name, {
        type: stmt.variable.typeAnnotation
          ? this.resolveTypeNode(stmt.variable.typeAnnotation)
          : elementType,
        kind: "variable",
      });
    }

    const wasInLoop = this.inLoop;
    this.inLoop = true;
    this.checkStatement(stmt.body);
    this.inLoop = wasInLoop;

    this.currentEnv = previousEnv;
  }

  private checkForInStatement(stmt: ForInStatement): void {
    const previousEnv = this.currentEnv;
    this.currentEnv = new TypeEnvironment(previousEnv);

    this.checkExpression(stmt.object);

    if (stmt.variable.kind === "VariableDeclaration") {
      this.currentEnv.define(stmt.variable.name, {
        type: createStringType(),
        kind: "variable",
      });
    }

    const wasInLoop = this.inLoop;
    this.inLoop = true;
    this.checkStatement(stmt.body);
    this.inLoop = wasInLoop;

    this.currentEnv = previousEnv;
  }

  private checkSwitchStatement(stmt: SwitchStatement): void {
    this.checkExpression(stmt.discriminant);

    for (const caseClause of stmt.cases) {
      if (caseClause.test) {
        this.checkExpression(caseClause.test);
      }
      for (const consequent of caseClause.consequent) {
        this.checkStatement(consequent);
      }
    }
  }

  private checkTryStatement(stmt: TryStatement): void {
    this.checkBlockStatement(stmt.block);

    if (stmt.handler) {
      const previousEnv = this.currentEnv;
      this.currentEnv = new TypeEnvironment(previousEnv);

      if (stmt.handler.param) {
        this.currentEnv.define(stmt.handler.param.name, {
          type: createAnyType(),
          kind: "variable",
        });
      }

      this.checkBlockStatement(stmt.handler.body);
      this.currentEnv = previousEnv;
    }

    if (stmt.finalizer) {
      this.checkBlockStatement(stmt.finalizer);
    }
  }

  private checkBlockStatement(block: BlockStatement): void {
    const previousEnv = this.currentEnv;
    this.currentEnv = new TypeEnvironment(previousEnv);

    for (const stmt of block.statements) {
      this.checkStatement(stmt);
    }

    this.currentEnv = previousEnv;
  }

  private checkExpression(expr: Expression): Type {
    switch (expr.kind) {
      case "NumericLiteral":
        return createNumberType();

      case "StringLiteral":
        return createStringType();

      case "BooleanLiteral":
        return createBooleanType();

      case "NullLiteral":
        return createNullType();

      case "UndefinedLiteral":
        return createUndefinedType();

      case "Identifier": {
        const entry = this.currentEnv.lookup(expr.name);
        if (!entry) {
          this.addError(`Cannot find name '${expr.name}'`, expr.line);
          return createAnyType();
        }
        return entry.type;
      }

      case "BinaryExpression":
        return this.checkBinaryExpression(expr);

      case "UnaryExpression":
        return this.checkUnaryExpression(expr);

      case "UpdateExpression": {
        const argType = this.checkExpression(expr.argument);
        if (argType.kind !== "number" && argType.kind !== "any") {
          this.addError("Update expression requires a number operand", expr.line);
        }
        return createNumberType();
      }

      case "CallExpression":
        return this.checkCallExpression(expr);

      case "MemberExpression":
        return this.checkMemberExpression(expr);

      case "ComputedMemberExpression":
        return this.checkComputedMemberExpression(expr);

      case "ObjectLiteral":
        return this.checkObjectLiteral(expr);

      case "ArrayLiteral":
        return this.checkArrayLiteral(expr);

      case "ArrowFunction":
        return this.checkArrowFunction(expr);

      case "FunctionExpression":
        return this.checkFunctionExpression(expr);

      case "ConditionalExpression": {
        this.checkExpression(expr.condition);
        const consequent = this.checkExpression(expr.consequent);
        const alternate = this.checkExpression(expr.alternate);
        return createUnionType([consequent, alternate]);
      }

      case "AssignmentExpression": {
        const rightType = this.checkExpression(expr.right);
        const leftType = this.checkExpression(expr.left);
        if (!this.isAssignable(rightType, leftType)) {
          this.addError(
            `Type '${this.typeToString(rightType)}' is not assignable to type '${this.typeToString(leftType)}'`,
            expr.line
          );
        }
        return rightType;
      }

      case "LogicalExpression": {
        const left = this.checkExpression(expr.left);
        const right = this.checkExpression(expr.right);
        if (expr.operator === "??") {
          return createUnionType([left, right]);
        }
        return createUnionType([left, right]);
      }

      case "NewExpression":
        return this.checkNewExpression(expr);

      case "ThisExpression": {
        const thisEntry = this.currentEnv.lookup("this");
        return thisEntry?.type ?? createAnyType();
      }

      case "SuperExpression":
        return createAnyType();

      case "SpreadElement":
        return this.checkExpression(expr.argument);

      case "AwaitExpression": {
        const argType = this.checkExpression(expr.argument);
        // Simplified: just return any for Promise<T>
        return createAnyType();
      }

      case "YieldExpression":
        if (expr.argument) {
          return this.checkExpression(expr.argument);
        }
        return createUndefinedType();

      case "TemplateLiteralExpr":
        for (const expression of expr.expressions) {
          this.checkExpression(expression);
        }
        return createStringType();

      case "TaggedTemplateExpression":
        this.checkExpression(expr.tag);
        return createAnyType();

      case "TypeAssertion":
        this.checkExpression(expr.expression);
        return this.resolveTypeNode(expr.typeAnnotation);

      case "AsExpression":
        this.checkExpression(expr.expression);
        return this.resolveTypeNode(expr.typeAnnotation);

      case "NonNullExpression":
        return this.checkExpression(expr.expression);

      case "ClassExpression":
        return createAnyType();

      case "ParenthesizedExpression":
        return this.checkExpression(expr.expression);

      default:
        return createAnyType();
    }
  }

  private checkBinaryExpression(expr: any): Type {
    const leftType = this.checkExpression(expr.left);
    const rightType = this.checkExpression(expr.right);
    const op = expr.operator;

    // Arithmetic operators
    if (["+", "-", "*", "/", "%", "**"].includes(op)) {
      if (op === "+") {
        if (leftType.kind === "string" || rightType.kind === "string") {
          return createStringType();
        }
      }

      if (leftType.kind === "number" && rightType.kind === "number") {
        return createNumberType();
      }

      if (leftType.kind !== "number" && leftType.kind !== "any") {
        this.addError("The left-hand side of an arithmetic operation must be of type 'number'", expr.line);
      }
      if (rightType.kind !== "number" && rightType.kind !== "any") {
        this.addError("The right-hand side of an arithmetic operation must be of type 'number'", expr.line);
      }

      return createNumberType();
    }

    // Comparison operators
    if (["==", "===", "!=", "!==", "<", ">", "<=", ">="].includes(op)) {
      return createBooleanType();
    }

    // Bitwise operators
    if (["&", "|", "^", "<<", ">>", ">>>"].includes(op)) {
      return createNumberType();
    }

    // instanceof, in
    if (op === "instanceof" || op === "in") {
      return createBooleanType();
    }

    return createAnyType();
  }

  private checkUnaryExpression(expr: any): Type {
    const operandType = this.checkExpression(expr.operand);

    if (expr.operator === "-" || expr.operator === "+" || expr.operator === "~") {
      if (operandType.kind !== "number" && operandType.kind !== "any") {
        this.addError(`Unary '${expr.operator}' requires a number operand`, expr.line);
      }
      return createNumberType();
    }

    if (expr.operator === "!") {
      return createBooleanType();
    }

    if (expr.operator === "typeof") {
      return createStringType();
    }

    if (expr.operator === "delete") {
      return createBooleanType();
    }

    return createAnyType();
  }

  private checkCallExpression(expr: any): Type {
    const calleeType = this.checkExpression(expr.callee);

    if (calleeType.kind === "any") {
      // Check arguments anyway
      for (const arg of expr.arguments) {
        this.checkExpression(arg);
      }
      return createAnyType();
    }

    if (calleeType.kind !== "function") {
      this.addError("This expression is not callable", expr.line);
      return createAnyType();
    }

    const funcType = calleeType as FunctionType;

    // Check if function has rest parameter
    const hasRestParam = funcType.params.some((p) => p.name.startsWith("..."));
    
    // Check argument count
    const requiredParams = funcType.params.filter((p) => !p.optional && !p.name.startsWith("...")).length;
    if (expr.arguments.length < requiredParams) {
      this.addError(
        `Expected at least ${requiredParams} arguments, but got ${expr.arguments.length}`,
        expr.line
      );
    } else if (!hasRestParam && expr.arguments.length > funcType.params.length) {
      this.addError(
        `Expected at most ${funcType.params.length} arguments, but got ${expr.arguments.length}`,
        expr.line
      );
    }

    // Check argument types
    const checkCount = hasRestParam ? Math.min(expr.arguments.length, funcType.params.length - 1) : Math.min(expr.arguments.length, funcType.params.length);
    for (let i = 0; i < checkCount; i++) {
      const arg = expr.arguments[i];
      if (arg.kind === "SpreadElement") {
        this.checkExpression(arg.argument);
        continue;
      }
      const argType = this.checkExpression(arg);
      const paramType = funcType.params[i].type;

      if (!this.isAssignable(argType, paramType)) {
        this.addError(
          `Argument of type '${this.typeToString(argType)}' is not assignable to parameter of type '${this.typeToString(paramType)}'`,
          expr.line
        );
      }
    }

    return funcType.returnType;
  }

  private checkMemberExpression(expr: any): Type {
    const objectType = this.checkExpression(expr.object);

    if (objectType.kind === "any") {
      return createAnyType();
    }

    if (objectType.kind === "interface") {
      const member = objectType.members.get(expr.property);
      if (!member) {
        this.addError(
          `Property '${expr.property}' does not exist on type '${objectType.name}'`,
          expr.line
        );
        return createAnyType();
      }
      return member.type;
    }

    if (objectType.kind === "class") {
      const member = objectType.members.get(expr.property);
      if (!member) {
        this.addError(
          `Property '${expr.property}' does not exist on type '${objectType.name}'`,
          expr.line
        );
        return createAnyType();
      }
      return member.type;
    }

    if (objectType.kind === "array") {
      if (expr.property === "length") {
        return createNumberType();
      }
      // Array methods
      const arrayMethods = ["push", "pop", "shift", "unshift", "slice", "splice", "map", "filter", "reduce", "forEach", "find", "findIndex", "includes", "indexOf", "join", "concat", "reverse", "sort"];
      if (arrayMethods.includes(expr.property)) {
        return createAnyType(); // Simplified
      }
    }

    if (objectType.kind === "string") {
      const stringMethods = ["length", "charAt", "charCodeAt", "concat", "includes", "indexOf", "lastIndexOf", "match", "replace", "slice", "split", "substring", "toLowerCase", "toUpperCase", "trim", "startsWith", "endsWith"];
      if (stringMethods.includes(expr.property)) {
        return expr.property === "length" ? createNumberType() : createAnyType();
      }
    }

    return createAnyType();
  }

  private checkComputedMemberExpression(expr: any): Type {
    const objectType = this.checkExpression(expr.object);
    const indexType = this.checkExpression(expr.property);

    if (objectType.kind === "array") {
      if (indexType.kind !== "number" && indexType.kind !== "any") {
        this.addError("Array index must be a number", expr.line);
      }
      return objectType.elementType;
    }

    if (objectType.kind === "tuple") {
      return createUnionType(objectType.elementTypes);
    }

    return createAnyType();
  }

  private checkObjectLiteral(expr: any): Type {
    const members = new Map<string, { type: Type }>();

    for (const prop of expr.properties) {
      if (prop.value.kind === "SpreadElement") {
        // Spread - just check the argument
        this.checkExpression(prop.value.argument);
        continue;
      }
      const valueType = this.checkExpression(prop.value);
      const key = typeof prop.key === "string" ? prop.key : "<computed>";
      members.set(key, { type: valueType });
    }

    return {
      kind: "interface",
      name: "<anonymous>",
      members,
    } as InterfaceType;
  }

  private checkArrayLiteral(expr: any): Type {
    if (expr.elements.length === 0) {
      return createArrayType(createAnyType());
    }

    const types: Type[] = [];
    for (const element of expr.elements) {
      if (element === null) continue;
      if (element.kind === "SpreadElement") {
        const spreadType = this.checkExpression(element.argument);
        // Extract element type from array
        if (spreadType.kind === "array") {
          types.push((spreadType as ArrayTypeValue).elementType);
        } else {
          types.push(spreadType);
        }
      } else {
        types.push(this.checkExpression(element));
      }
    }

    // Find common type or create union
    if (types.length === 1) {
      return createArrayType(types[0]);
    }

    // For simplicity, just use first element type or union
    const uniqueTypes = this.deduplicateTypes(types);
    if (uniqueTypes.length === 1) {
      return createArrayType(uniqueTypes[0]);
    }

    return createArrayType(createUnionType(uniqueTypes));
  }

  private checkArrowFunction(expr: any): Type {
    const params = expr.parameters.map((p: any) => ({
      name: p.name,
      type: p.typeAnnotation ? this.resolveTypeNode(p.typeAnnotation) : createAnyType(),
      optional: p.optional,
    }));

    const previousEnv = this.currentEnv;
    this.currentEnv = new TypeEnvironment(previousEnv);

    for (const param of params) {
      this.currentEnv.define(param.name, { type: param.type, kind: "variable" });
    }

    let returnType: Type;
    if (expr.returnType) {
      returnType = this.resolveTypeNode(expr.returnType);
    } else if (expr.body.kind === "BlockStatement") {
      returnType = createVoidType();
    } else {
      returnType = this.checkExpression(expr.body);
    }

    if (expr.body.kind === "BlockStatement") {
      const previousReturn = this.currentReturnType;
      this.currentReturnType = returnType;
      this.checkBlockStatement(expr.body);
      this.currentReturnType = previousReturn;
    }

    this.currentEnv = previousEnv;

    return {
      kind: "function",
      params,
      returnType,
    } as FunctionType;
  }

  private checkFunctionExpression(expr: any): Type {
    const params = expr.parameters.map((p: any) => ({
      name: p.name,
      type: p.typeAnnotation ? this.resolveTypeNode(p.typeAnnotation) : createAnyType(),
      optional: p.optional,
    }));

    const returnType = expr.returnType
      ? this.resolveTypeNode(expr.returnType)
      : createVoidType();

    const previousEnv = this.currentEnv;
    this.currentEnv = new TypeEnvironment(previousEnv);

    if (expr.name) {
      this.currentEnv.define(expr.name, {
        type: { kind: "function", params, returnType } as FunctionType,
        kind: "function",
      });
    }

    for (const param of params) {
      this.currentEnv.define(param.name, { type: param.type, kind: "variable" });
    }

    const previousReturn = this.currentReturnType;
    this.currentReturnType = returnType;
    this.checkBlockStatement(expr.body);
    this.currentReturnType = previousReturn;

    this.currentEnv = previousEnv;

    return { kind: "function", params, returnType } as FunctionType;
  }

  private checkNewExpression(expr: any): Type {
    const calleeType = this.checkExpression(expr.callee);

    for (const arg of expr.arguments) {
      this.checkExpression(arg);
    }

    if (calleeType.kind === "class") {
      return calleeType;
    }

    return createAnyType();
  }

  private resolveTypeNode(node: TypeNode): Type {
    switch (node.kind) {
      case "TypeReference": {
        switch (node.typeName) {
          case "number":
            return createNumberType();
          case "string":
            return createStringType();
          case "boolean":
            return createBooleanType();
          case "void":
            return createVoidType();
          case "null":
            return createNullType();
          case "undefined":
            return createUndefinedType();
          case "any":
            return createAnyType();
          case "unknown":
            return createUnknownType();
          case "never":
            return createNeverType();
          case "object":
            return createAnyType();
          case "symbol":
            return { kind: "symbol" } as PrimitiveType;
          case "bigint":
            return { kind: "bigint" } as PrimitiveType;
          default: {
            // Look up type
            const typeEntry = this.currentEnv.lookupType(node.typeName);
            if (typeEntry) {
              return typeEntry;
            }
            const entry = this.currentEnv.lookup(node.typeName);
            if (entry) {
              return entry.type;
            }
            this.addError(`Cannot find name '${node.typeName}'`, node.line);
            return createAnyType();
          }
        }
      }

      case "ArrayType":
        return createArrayType(this.resolveTypeNode(node.elementType));

      case "TupleType":
        return {
          kind: "tuple",
          elementTypes: node.elementTypes.map((t) => this.resolveTypeNode(t)),
        } as TupleTypeValue;

      case "UnionType":
        return createUnionType(node.types.map((t) => this.resolveTypeNode(t)));

      case "IntersectionType":
        return {
          kind: "intersection",
          types: node.types.map((t) => this.resolveTypeNode(t)),
        } as IntersectionTypeValue;

      case "FunctionTypeNode": {
        const params = node.parameters.map((p) => ({
          name: p.name,
          type: p.typeAnnotation ? this.resolveTypeNode(p.typeAnnotation) : createAnyType(),
          optional: p.optional,
        }));
        return {
          kind: "function",
          params,
          returnType: this.resolveTypeNode(node.returnType),
        } as FunctionType;
      }

      case "ObjectTypeNode": {
        const members = new Map<string, { type: Type; optional?: boolean }>();
        for (const member of node.members) {
          if (member.name) {
            members.set(member.name, {
              type: this.resolveTypeNode(member.typeAnnotation),
              optional: member.optional,
            });
          }
        }
        return { kind: "interface", name: "<anonymous>", members } as InterfaceType;
      }

      case "LiteralType":
        return {
          kind: "literal",
          value: node.value,
        } as LiteralTypeValue;

      case "ParenthesizedType":
        return this.resolveTypeNode(node.type);

      case "TypeQuery":
        return createAnyType();

      case "ConditionalType":
      case "IndexedAccessType":
      case "MappedType":
      case "InferType":
      case "OptionalType":
      case "RestType":
        return createAnyType();

      default:
        return createAnyType();
    }
  }

  private isAssignable(source: Type, target: Type): boolean {
    // Any is assignable to anything and anything is assignable to any
    if (source.kind === "any" || target.kind === "any") {
      return true;
    }

    // Unknown accepts any but can only be assigned to unknown or any
    if (target.kind === "unknown") {
      return true;
    }
    if (source.kind === "unknown") {
      return target.kind === "unknown" || target.kind === "any";
    }

    // Never is assignable to anything
    if (source.kind === "never") {
      return true;
    }

    // Null and undefined
    if (source.kind === "null" || source.kind === "undefined") {
      return (
        target.kind === source.kind ||
        target.kind === "any" ||
        target.kind === "unknown"
      );
    }

    // Same primitive types
    if (source.kind === target.kind) {
      if (source.kind === "interface" && target.kind === "interface") {
        return this.isInterfaceAssignable(
          source as InterfaceType,
          target as InterfaceType
        );
      }
      if (source.kind === "array" && target.kind === "array") {
        return this.isAssignable(
          (source as ArrayTypeValue).elementType,
          (target as ArrayTypeValue).elementType
        );
      }
      if (source.kind === "tuple" && target.kind === "tuple") {
        const srcTuple = source as TupleTypeValue;
        const tgtTuple = target as TupleTypeValue;
        if (srcTuple.elementTypes.length !== tgtTuple.elementTypes.length) {
          return false;
        }
        return srcTuple.elementTypes.every((t, i) =>
          this.isAssignable(t, tgtTuple.elementTypes[i])
        );
      }
      if (source.kind === "function" && target.kind === "function") {
        return this.isFunctionAssignable(
          source as FunctionType,
          target as FunctionType
        );
      }
      return true;
    }

    // Union type target
    if (target.kind === "union") {
      return (target as UnionTypeValue).types.some((t) =>
        this.isAssignable(source, t)
      );
    }

    // Union type source
    if (source.kind === "union") {
      return (source as UnionTypeValue).types.every((t) =>
        this.isAssignable(t, target)
      );
    }

    // String is assignable to union of string literals (relaxed for convenience)
    if (source.kind === "string" && target.kind === "union") {
      const unionTypes = (target as UnionTypeValue).types;
      // If all union members are string literals, allow string assignment
      if (unionTypes.every((t) => t.kind === "literal" && typeof (t as LiteralTypeValue).value === "string")) {
        return true;
      }
    }

    // Literal type assignable to primitive
    if (source.kind === "literal") {
      const literalType = source as LiteralTypeValue;
      if (typeof literalType.value === "number" && target.kind === "number") {
        return true;
      }
      if (typeof literalType.value === "string" && target.kind === "string") {
        return true;
      }
      if (typeof literalType.value === "boolean" && target.kind === "boolean") {
        return true;
      }
    }

    return false;
  }

  private isInterfaceAssignable(source: InterfaceType, target: InterfaceType): boolean {
    for (const [key, targetMember] of target.members) {
      const sourceMember = source.members.get(key);
      if (!sourceMember) {
        if (!targetMember.optional) {
          return false;
        }
        continue;
      }
      if (!this.isAssignable(sourceMember.type, targetMember.type)) {
        return false;
      }
    }
    return true;
  }

  private isFunctionAssignable(source: FunctionType, target: FunctionType): boolean {
    // Check return type (covariant)
    if (!this.isAssignable(source.returnType, target.returnType)) {
      return false;
    }

    // Check parameters (contravariant)
    if (source.params.length < target.params.length) {
      return false;
    }

    for (let i = 0; i < target.params.length; i++) {
      if (!this.isAssignable(target.params[i].type, source.params[i].type)) {
        return false;
      }
    }

    return true;
  }

  private deduplicateTypes(types: Type[]): Type[] {
    const seen = new Set<string>();
    const result: Type[] = [];

    for (const type of types) {
      const key = this.typeToString(type);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(type);
      }
    }

    return result;
  }

  private typeToString(type: Type): string {
    switch (type.kind) {
      case "number":
      case "string":
      case "boolean":
      case "void":
      case "null":
      case "undefined":
      case "any":
      case "unknown":
      case "never":
      case "symbol":
      case "bigint":
        return type.kind;

      case "literal":
        const literal = type as LiteralTypeValue;
        if (typeof literal.value === "string") {
          return `"${literal.value}"`;
        }
        return String(literal.value);

      case "array":
        return `${this.typeToString((type as ArrayTypeValue).elementType)}[]`;

      case "tuple":
        return `[${(type as TupleTypeValue).elementTypes.map((t) => this.typeToString(t)).join(", ")}]`;

      case "union":
        return (type as UnionTypeValue).types.map((t) => this.typeToString(t)).join(" | ");

      case "intersection":
        return (type as IntersectionTypeValue).types.map((t) => this.typeToString(t)).join(" & ");

      case "function": {
        const func = type as FunctionType;
        const params = func.params
          .map((p) => `${p.name}: ${this.typeToString(p.type)}`)
          .join(", ");
        return `(${params}) => ${this.typeToString(func.returnType)}`;
      }

      case "interface":
        return (type as InterfaceType).name;

      case "class":
        return (type as ClassType).name;

      case "enum":
        return (type as EnumType).name;

      default:
        return "unknown";
    }
  }

  private addError(message: string, line: number): void {
    this.errors.push({ message, line });
  }
}

export function typeCheck(program: Program): CompilerError[] {
  const checker = new TypeChecker();
  return checker.check(program);
}
