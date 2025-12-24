import {
  Token,
  TokenType,
  Program,
  Statement,
  Expression,
  TypeNode,
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
  DoWhileStatement,
  SwitchStatement,
  BreakStatement,
  ContinueStatement,
  ThrowStatement,
  TryStatement,
  ExpressionStatement,
  BlockStatement,
  ImportDeclaration,
  ExportDeclaration,
  Parameter,
  InterfaceMember,
  ClassMember,
  PropertyDeclaration,
  MethodDeclaration,
  ConstructorDeclaration,
  GetterDeclaration,
  SetterDeclaration,
  EnumMember,
  TypeReference,
  ArrayType,
  TupleType,
  UnionType,
  IntersectionType,
  FunctionTypeNode,
  ObjectTypeNode,
  TypeMember,
  LiteralType,
  TypeParameterDeclaration,
  BinaryExpression,
  UnaryExpression,
  UpdateExpression,
  CallExpression,
  MemberExpression,
  ComputedMemberExpression,
  Identifier,
  NumericLiteral,
  StringLiteral,
  BooleanLiteral,
  NullLiteral,
  UndefinedLiteral,
  ObjectLiteral,
  ArrayLiteral,
  ArrowFunction,
  FunctionExpression,
  ConditionalExpression,
  AssignmentExpression,
  LogicalExpression,
  NewExpression,
  ThisExpression,
  SuperExpression,
  SpreadElement,
  AwaitExpression,
  TemplateLiteralExpr,
  AsExpression,
  NonNullExpression,
  ParenthesizedExpression,
  ObjectProperty,
  SwitchCase,
  CatchClause,
  ImportSpecifier,
  ExportSpecifier,
  Decorator,
} from "./types";

export class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Program {
    const statements: Statement[] = [];

    while (!this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }
    }

    return {
      kind: "Program",
      statements,
    };
  }

  private parseStatement(): Statement | null {
    // Check for decorators
    if (this.check(TokenType.At)) {
      const decorators = this.parseDecorators();
      // After decorators, expect class declaration
      if (this.check(TokenType.Class) || this.check(TokenType.Abstract)) {
        return this.parseClassDeclaration(decorators);
      }
      if (this.check(TokenType.Export)) {
        return this.parseExportDeclaration(decorators);
      }
      throw new Error(
        `Decorators can only be applied to classes at line ${this.peek().line}`
      );
    }

    const token = this.peek();

    switch (token.type) {
      case TokenType.Let:
      case TokenType.Const:
      case TokenType.Var:
        return this.parseVariableDeclaration();
      case TokenType.Async:
        // async function declaration
        if (this.peekNext()?.type === TokenType.Function) {
          return this.parseFunctionDeclaration();
        }
        return this.parseExpressionStatement();
      case TokenType.Function:
        return this.parseFunctionDeclaration();
      case TokenType.Interface:
        return this.parseInterfaceDeclaration();
      case TokenType.Type:
        return this.parseTypeAliasDeclaration();
      case TokenType.Class:
        return this.parseClassDeclaration();
      case TokenType.Abstract:
        if (this.peekNext()?.type === TokenType.Class) {
          return this.parseClassDeclaration();
        }
        return this.parseExpressionStatement();
      case TokenType.Enum:
        return this.parseEnumDeclaration();
      case TokenType.Return:
        return this.parseReturnStatement();
      case TokenType.If:
        return this.parseIfStatement();
      case TokenType.While:
        return this.parseWhileStatement();
      case TokenType.For:
        return this.parseForStatement();
      case TokenType.Do:
        return this.parseDoWhileStatement();
      case TokenType.Switch:
        return this.parseSwitchStatement();
      case TokenType.Break:
        return this.parseBreakStatement();
      case TokenType.Continue:
        return this.parseContinueStatement();
      case TokenType.Throw:
        return this.parseThrowStatement();
      case TokenType.Try:
        return this.parseTryStatement();
      case TokenType.LeftBrace:
        return this.parseBlockStatement();
      case TokenType.Import:
        return this.parseImportDeclaration();
      case TokenType.Export:
        return this.parseExportDeclaration();
      case TokenType.Semicolon:
        this.advance();
        return { kind: "EmptyStatement", line: token.line };
      case TokenType.EOF:
        return null;
      default:
        return this.parseExpressionStatement();
    }
  }

  private parseVariableDeclaration(): VariableDeclaration {
    const startToken = this.advance();
    const varKind =
      startToken.type === TokenType.Let
        ? "let"
        : startToken.type === TokenType.Const
        ? "const"
        : "var";

    const nameToken = this.expect(
      TokenType.Identifier,
      "Expected variable name"
    );
    const name = nameToken.value;

    let typeAnnotation: TypeNode | undefined;
    if (this.check(TokenType.Colon)) {
      this.advance();
      typeAnnotation = this.parseType();
    }

    let initializer: Expression | undefined;
    if (this.check(TokenType.Equals)) {
      this.advance();
      initializer = this.parseExpression();
    }

    this.expect(TokenType.Semicolon, "Expected ';' after variable declaration");

    return {
      kind: "VariableDeclaration",
      name,
      varKind,
      typeAnnotation,
      initializer,
      line: startToken.line,
    };
  }

  private parseFunctionDeclaration(): FunctionDeclaration {
    const startToken = this.advance(); // consume 'function'

    const isAsync = startToken.type === TokenType.Async;
    if (isAsync) {
      this.expect(TokenType.Function, "Expected 'function' after 'async'");
    }

    const isGenerator = this.match(TokenType.Star);

    const nameToken = this.expect(
      TokenType.Identifier,
      "Expected function name"
    );
    const name = nameToken.value;

    const typeParameters = this.parseTypeParameters();

    this.expect(TokenType.LeftParen, "Expected '(' after function name");
    const parameters = this.parseParameterList();
    this.expect(TokenType.RightParen, "Expected ')' after parameters");

    let returnType: TypeNode | undefined;
    if (this.check(TokenType.Colon)) {
      this.advance();
      returnType = this.parseType();
    }

    const body = this.parseBlockStatement();

    return {
      kind: "FunctionDeclaration",
      name,
      parameters,
      returnType,
      body,
      isAsync,
      isGenerator,
      typeParameters,
      line: startToken.line,
    };
  }

  private parseParameterList(): Parameter[] {
    const parameters: Parameter[] = [];

    if (this.check(TokenType.RightParen)) {
      return parameters;
    }

    do {
      const param = this.parseParameter();
      parameters.push(param);
    } while (this.match(TokenType.Comma) && !this.check(TokenType.RightParen));

    return parameters;
  }

  private parseParameter(): Parameter {
    const rest = this.match(TokenType.Spread);
    const name = this.expect(
      TokenType.Identifier,
      "Expected parameter name"
    ).value;
    const optional = this.match(TokenType.Question);

    let typeAnnotation: TypeNode | undefined;
    if (this.check(TokenType.Colon)) {
      this.advance();
      typeAnnotation = this.parseType();
    }

    let defaultValue: Expression | undefined;
    if (this.match(TokenType.Equals)) {
      defaultValue = this.parseAssignment();
    }

    return { name, typeAnnotation, optional, defaultValue, rest };
  }

  private parseInterfaceDeclaration(): InterfaceDeclaration {
    const startToken = this.advance(); // consume 'interface'

    const nameToken = this.expect(
      TokenType.Identifier,
      "Expected interface name"
    );
    const name = nameToken.value;

    const typeParameters = this.parseTypeParameters();

    let extendsClause: TypeNode[] | undefined;
    if (this.match(TokenType.Extends)) {
      extendsClause = [];
      do {
        extendsClause.push(this.parseType());
      } while (this.match(TokenType.Comma));
    }

    this.expect(TokenType.LeftBrace, "Expected '{' after interface name");

    const members: InterfaceMember[] = [];
    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      const readonly = this.match(TokenType.Readonly);
      const memberName = this.expect(
        TokenType.Identifier,
        "Expected member name"
      ).value;
      const optional = this.match(TokenType.Question);
      this.expect(TokenType.Colon, "Expected ':' after member name");
      const memberType = this.parseType();

      members.push({
        name: memberName,
        typeAnnotation: memberType,
        optional,
        readonly,
      });

      this.match(TokenType.Semicolon) || this.match(TokenType.Comma);
    }

    this.expect(TokenType.RightBrace, "Expected '}' after interface members");

    return {
      kind: "InterfaceDeclaration",
      name,
      members,
      extends: extendsClause,
      typeParameters,
      line: startToken.line,
    };
  }

  private parseTypeAliasDeclaration(): TypeAliasDeclaration {
    const startToken = this.advance(); // consume 'type'

    const name = this.expect(TokenType.Identifier, "Expected type name").value;
    const typeParameters = this.parseTypeParameters();

    this.expect(TokenType.Equals, "Expected '=' after type name");
    const type = this.parseType();
    this.expect(TokenType.Semicolon, "Expected ';' after type alias");

    return {
      kind: "TypeAliasDeclaration",
      name,
      typeParameters,
      type,
      line: startToken.line,
    };
  }

  private parseDecorators(): Decorator[] {
    const decorators: Decorator[] = [];

    while (this.check(TokenType.At)) {
      const startToken = this.advance(); // consume '@'
      const expression = this.parseLeftHandSide();
      decorators.push({
        kind: "Decorator",
        expression,
        line: startToken.line,
      });
    }

    return decorators;
  }

  private parseClassDeclaration(decorators?: Decorator[]): ClassDeclaration {
    const startToken = this.peek();
    const isAbstract = this.match(TokenType.Abstract);
    this.expect(TokenType.Class, "Expected 'class'");

    const name = this.expect(TokenType.Identifier, "Expected class name").value;
    const typeParameters = this.parseTypeParameters();

    let superClass: Expression | undefined;
    if (this.match(TokenType.Extends)) {
      superClass = this.parseLeftHandSide();
    }

    let implementsClause: TypeNode[] | undefined;
    if (this.match(TokenType.Implements)) {
      implementsClause = [];
      do {
        implementsClause.push(this.parseType());
      } while (this.match(TokenType.Comma));
    }

    this.expect(TokenType.LeftBrace, "Expected '{' after class declaration");

    const members: ClassMember[] = [];
    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      const member = this.parseClassMember();
      if (member) {
        members.push(member);
      }
    }

    this.expect(TokenType.RightBrace, "Expected '}' after class body");

    return {
      kind: "ClassDeclaration",
      name,
      decorators,
      superClass,
      implements: implementsClause,
      typeParameters,
      members,
      isAbstract,
      line: startToken.line,
    };
  }

  private parseClassMember(): ClassMember | null {
    // Check for decorators on class members
    let memberDecorators: Decorator[] | undefined;
    if (this.check(TokenType.At)) {
      memberDecorators = this.parseDecorators();
    }

    const startToken = this.peek();

    // Check for accessibility modifiers
    let accessibility: "public" | "private" | "protected" | undefined;
    if (this.check(TokenType.Public)) {
      accessibility = "public";
      this.advance();
    } else if (this.check(TokenType.Private)) {
      accessibility = "private";
      this.advance();
    } else if (this.check(TokenType.Protected)) {
      accessibility = "protected";
      this.advance();
    }

    const isStatic = this.match(TokenType.Static);
    const isReadonly = this.match(TokenType.Readonly);
    const isAbstract = this.match(TokenType.Abstract);

    // Constructor
    if (this.check(TokenType.Constructor)) {
      this.advance();
      this.expect(TokenType.LeftParen, "Expected '(' after 'constructor'");
      const parameters = this.parseParameterList();
      this.expect(TokenType.RightParen, "Expected ')' after parameters");
      const body = this.parseBlockStatement();

      return {
        kind: "ConstructorDeclaration",
        parameters,
        body,
        accessibility,
        line: startToken.line,
      };
    }

    // Getter
    if (this.check(TokenType.Get)) {
      this.advance();
      const name = this.expect(
        TokenType.Identifier,
        "Expected property name"
      ).value;
      this.expect(TokenType.LeftParen, "Expected '('");
      this.expect(TokenType.RightParen, "Expected ')'");

      let returnType: TypeNode | undefined;
      if (this.check(TokenType.Colon)) {
        this.advance();
        returnType = this.parseType();
      }

      const body = this.parseBlockStatement();

      return {
        kind: "GetterDeclaration",
        name,
        returnType,
        body,
        accessibility,
        isStatic,
        line: startToken.line,
      };
    }

    // Setter
    if (this.check(TokenType.Set)) {
      this.advance();
      const name = this.expect(
        TokenType.Identifier,
        "Expected property name"
      ).value;
      this.expect(TokenType.LeftParen, "Expected '('");
      const parameter = this.parseParameter();
      this.expect(TokenType.RightParen, "Expected ')'");
      const body = this.parseBlockStatement();

      return {
        kind: "SetterDeclaration",
        name,
        parameter,
        body,
        accessibility,
        isStatic,
        line: startToken.line,
      };
    }

    // Property or Method
    if (this.check(TokenType.Identifier)) {
      const name = this.advance().value;
      const optional = this.match(TokenType.Question);

      // Method
      if (this.check(TokenType.LeftParen) || this.check(TokenType.LessThan)) {
        const typeParameters = this.parseTypeParameters();
        this.expect(TokenType.LeftParen, "Expected '('");
        const parameters = this.parseParameterList();
        this.expect(TokenType.RightParen, "Expected ')'");

        let returnType: TypeNode | undefined;
        if (this.check(TokenType.Colon)) {
          this.advance();
          returnType = this.parseType();
        }

        let body: BlockStatement | undefined;
        if (this.check(TokenType.LeftBrace)) {
          body = this.parseBlockStatement();
        } else {
          this.expect(
            TokenType.Semicolon,
            "Expected ';' after abstract method"
          );
        }

        return {
          kind: "MethodDeclaration",
          name,
          parameters,
          returnType,
          body,
          accessibility,
          isStatic,
          isAbstract,
          typeParameters,
          decorators: memberDecorators,
          line: startToken.line,
        };
      }

      // Property
      let typeAnnotation: TypeNode | undefined;
      if (this.check(TokenType.Colon)) {
        this.advance();
        typeAnnotation = this.parseType();
      }

      let initializer: Expression | undefined;
      if (this.match(TokenType.Equals)) {
        initializer = this.parseExpression();
      }

      this.match(TokenType.Semicolon);

      return {
        kind: "PropertyDeclaration",
        name,
        typeAnnotation,
        initializer,
        accessibility,
        isStatic,
        isReadonly,
        isAbstract,
        decorators: memberDecorators,
        line: startToken.line,
      };
    }

    return null;
  }

  private parseEnumDeclaration(): EnumDeclaration {
    const startToken = this.peek();
    const isConst = this.match(TokenType.Const);
    this.expect(TokenType.Enum, "Expected 'enum'");

    const name = this.expect(TokenType.Identifier, "Expected enum name").value;
    this.expect(TokenType.LeftBrace, "Expected '{'");

    const members: EnumMember[] = [];
    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      const memberName = this.expect(
        TokenType.Identifier,
        "Expected enum member name"
      ).value;
      let initializer: Expression | undefined;

      if (this.match(TokenType.Equals)) {
        initializer = this.parseExpression();
      }

      members.push({ name: memberName, initializer });
      this.match(TokenType.Comma);
    }

    this.expect(TokenType.RightBrace, "Expected '}'");

    return {
      kind: "EnumDeclaration",
      name,
      members,
      isConst,
      line: startToken.line,
    };
  }

  private parseReturnStatement(): ReturnStatement {
    const startToken = this.advance();

    let argument: Expression | undefined;
    if (!this.check(TokenType.Semicolon) && !this.check(TokenType.RightBrace)) {
      argument = this.parseExpression();
    }

    this.expect(TokenType.Semicolon, "Expected ';' after return statement");

    return {
      kind: "ReturnStatement",
      argument,
      line: startToken.line,
    };
  }

  private parseIfStatement(): IfStatement {
    const startToken = this.advance();

    this.expect(TokenType.LeftParen, "Expected '(' after 'if'");
    const condition = this.parseExpression();
    this.expect(TokenType.RightParen, "Expected ')' after if condition");

    const consequent = this.parseStatement();
    if (!consequent) {
      throw new Error(
        `Expected statement after 'if' at line ${startToken.line}`
      );
    }

    let alternate: Statement | undefined;
    if (this.match(TokenType.Else)) {
      alternate = this.parseStatement() || undefined;
    }

    return {
      kind: "IfStatement",
      condition,
      consequent,
      alternate,
      line: startToken.line,
    };
  }

  private parseWhileStatement(): WhileStatement {
    const startToken = this.advance();

    this.expect(TokenType.LeftParen, "Expected '(' after 'while'");
    const condition = this.parseExpression();
    this.expect(TokenType.RightParen, "Expected ')' after while condition");

    const body = this.parseStatement();
    if (!body) {
      throw new Error(
        `Expected statement after 'while' at line ${startToken.line}`
      );
    }

    return {
      kind: "WhileStatement",
      condition,
      body,
      line: startToken.line,
    };
  }

  private parseForStatement(): ForStatement | ForOfStatement | ForInStatement {
    const startToken = this.advance();

    const isAwait = this.match(TokenType.Await);

    this.expect(TokenType.LeftParen, "Expected '(' after 'for'");

    // Check for for-of or for-in
    if (
      this.check(TokenType.Let) ||
      this.check(TokenType.Const) ||
      this.check(TokenType.Var)
    ) {
      const varKind = this.advance();
      const name = this.expect(
        TokenType.Identifier,
        "Expected variable name"
      ).value;

      if (this.match(TokenType.Of)) {
        const iterable = this.parseExpression();
        this.expect(TokenType.RightParen, "Expected ')'");
        const body = this.parseStatement()!;

        return {
          kind: "ForOfStatement",
          variable: {
            kind: "VariableDeclaration",
            name,
            varKind: varKind.value as "let" | "const" | "var",
            line: varKind.line,
          },
          iterable,
          body,
          isAwait,
          line: startToken.line,
        };
      }

      if (this.match(TokenType.In)) {
        const object = this.parseExpression();
        this.expect(TokenType.RightParen, "Expected ')'");
        const body = this.parseStatement()!;

        return {
          kind: "ForInStatement",
          variable: {
            kind: "VariableDeclaration",
            name,
            varKind: varKind.value as "let" | "const" | "var",
            line: varKind.line,
          },
          object,
          body,
          line: startToken.line,
        };
      }

      // Regular for loop with variable declaration
      let typeAnnotation: TypeNode | undefined;
      if (this.check(TokenType.Colon)) {
        this.advance();
        typeAnnotation = this.parseType();
      }

      let initializer: Expression | undefined;
      if (this.match(TokenType.Equals)) {
        initializer = this.parseExpression();
      }

      const init: VariableDeclaration = {
        kind: "VariableDeclaration",
        name,
        varKind: varKind.value as "let" | "const" | "var",
        typeAnnotation,
        initializer,
        line: varKind.line,
      };

      this.expect(TokenType.Semicolon, "Expected ';'");

      let condition: Expression | undefined;
      if (!this.check(TokenType.Semicolon)) {
        condition = this.parseExpression();
      }
      this.expect(TokenType.Semicolon, "Expected ';'");

      let update: Expression | undefined;
      if (!this.check(TokenType.RightParen)) {
        update = this.parseExpression();
      }
      this.expect(TokenType.RightParen, "Expected ')'");

      const body = this.parseStatement()!;

      return {
        kind: "ForStatement",
        init,
        condition,
        update,
        body,
        line: startToken.line,
      };
    }

    // For loop without init or with expression init
    let init: Expression | undefined;
    if (!this.check(TokenType.Semicolon)) {
      init = this.parseExpression();
    }
    this.expect(TokenType.Semicolon, "Expected ';'");

    let condition: Expression | undefined;
    if (!this.check(TokenType.Semicolon)) {
      condition = this.parseExpression();
    }
    this.expect(TokenType.Semicolon, "Expected ';'");

    let update: Expression | undefined;
    if (!this.check(TokenType.RightParen)) {
      update = this.parseExpression();
    }
    this.expect(TokenType.RightParen, "Expected ')'");

    const body = this.parseStatement()!;

    return {
      kind: "ForStatement",
      init,
      condition,
      update,
      body,
      line: startToken.line,
    };
  }

  private parseDoWhileStatement(): DoWhileStatement {
    const startToken = this.advance();

    const body = this.parseStatement()!;
    this.expect(TokenType.While, "Expected 'while' after do body");
    this.expect(TokenType.LeftParen, "Expected '('");
    const condition = this.parseExpression();
    this.expect(TokenType.RightParen, "Expected ')'");
    this.expect(TokenType.Semicolon, "Expected ';'");

    return {
      kind: "DoWhileStatement",
      body,
      condition,
      line: startToken.line,
    };
  }

  private parseSwitchStatement(): SwitchStatement {
    const startToken = this.advance();

    this.expect(TokenType.LeftParen, "Expected '('");
    const discriminant = this.parseExpression();
    this.expect(TokenType.RightParen, "Expected ')'");
    this.expect(TokenType.LeftBrace, "Expected '{'");

    const cases: SwitchCase[] = [];
    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      if (this.match(TokenType.Case)) {
        const test = this.parseExpression();
        this.expect(TokenType.Colon, "Expected ':'");
        const consequent: Statement[] = [];
        while (
          !this.check(TokenType.Case) &&
          !this.check(TokenType.Default) &&
          !this.check(TokenType.RightBrace)
        ) {
          const stmt = this.parseStatement();
          if (stmt) consequent.push(stmt);
        }
        cases.push({ test, consequent });
      } else if (this.match(TokenType.Default)) {
        this.expect(TokenType.Colon, "Expected ':'");
        const consequent: Statement[] = [];
        while (
          !this.check(TokenType.Case) &&
          !this.check(TokenType.Default) &&
          !this.check(TokenType.RightBrace)
        ) {
          const stmt = this.parseStatement();
          if (stmt) consequent.push(stmt);
        }
        cases.push({ consequent });
      }
    }

    this.expect(TokenType.RightBrace, "Expected '}'");

    return {
      kind: "SwitchStatement",
      discriminant,
      cases,
      line: startToken.line,
    };
  }

  private parseBreakStatement(): BreakStatement {
    const startToken = this.advance();
    let label: string | undefined;

    if (this.check(TokenType.Identifier)) {
      label = this.advance().value;
    }

    this.expect(TokenType.Semicolon, "Expected ';'");

    return { kind: "BreakStatement", label, line: startToken.line };
  }

  private parseContinueStatement(): ContinueStatement {
    const startToken = this.advance();
    let label: string | undefined;

    if (this.check(TokenType.Identifier)) {
      label = this.advance().value;
    }

    this.expect(TokenType.Semicolon, "Expected ';'");

    return { kind: "ContinueStatement", label, line: startToken.line };
  }

  private parseThrowStatement(): ThrowStatement {
    const startToken = this.advance();
    const argument = this.parseExpression();
    this.expect(TokenType.Semicolon, "Expected ';'");

    return { kind: "ThrowStatement", argument, line: startToken.line };
  }

  private parseTryStatement(): TryStatement {
    const startToken = this.advance();
    const block = this.parseBlockStatement();

    let handler: CatchClause | undefined;
    if (this.match(TokenType.Catch)) {
      let param: Parameter | undefined;
      if (this.match(TokenType.LeftParen)) {
        param = this.parseParameter();
        this.expect(TokenType.RightParen, "Expected ')'");
      }
      const body = this.parseBlockStatement();
      handler = { param, body };
    }

    let finalizer: BlockStatement | undefined;
    if (this.match(TokenType.Finally)) {
      finalizer = this.parseBlockStatement();
    }

    return {
      kind: "TryStatement",
      block,
      handler,
      finalizer,
      line: startToken.line,
    };
  }

  private parseBlockStatement(): BlockStatement {
    const startToken = this.expect(TokenType.LeftBrace, "Expected '{'");

    const statements: Statement[] = [];
    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }
    }

    this.expect(TokenType.RightBrace, "Expected '}'");

    return {
      kind: "BlockStatement",
      statements,
      line: startToken.line,
    };
  }

  private parseImportDeclaration(): ImportDeclaration {
    const startToken = this.advance();
    const isTypeOnly = this.match(TokenType.Type);

    const specifiers: ImportSpecifier[] = [];

    if (this.check(TokenType.StringLiteral)) {
      // import "module"
      const source = this.advance().value;
      this.expect(TokenType.Semicolon, "Expected ';'");
      return {
        kind: "ImportDeclaration",
        specifiers,
        source,
        isTypeOnly,
        line: startToken.line,
      };
    }

    // import default or namespace or named
    if (this.check(TokenType.Identifier)) {
      const local = this.advance().value;
      specifiers.push({ kind: "ImportDefaultSpecifier", local });

      if (this.match(TokenType.Comma)) {
        this.parseImportSpecifiers(specifiers);
      }
    } else if (this.check(TokenType.Star)) {
      this.advance();
      this.expect(TokenType.As, "Expected 'as'");
      const local = this.expect(
        TokenType.Identifier,
        "Expected identifier"
      ).value;
      specifiers.push({ kind: "ImportNamespaceSpecifier", local });
    } else if (this.check(TokenType.LeftBrace)) {
      this.parseImportSpecifiers(specifiers);
    }

    this.expect(TokenType.From, "Expected 'from'");
    const source = this.expect(
      TokenType.StringLiteral,
      "Expected module path"
    ).value;
    this.expect(TokenType.Semicolon, "Expected ';'");

    return {
      kind: "ImportDeclaration",
      specifiers,
      source,
      isTypeOnly,
      line: startToken.line,
    };
  }

  private parseImportSpecifiers(specifiers: ImportSpecifier[]): void {
    if (this.check(TokenType.Star)) {
      this.advance();
      this.expect(TokenType.As, "Expected 'as'");
      const local = this.expect(
        TokenType.Identifier,
        "Expected identifier"
      ).value;
      specifiers.push({ kind: "ImportNamespaceSpecifier", local });
      return;
    }

    this.expect(TokenType.LeftBrace, "Expected '{'");

    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      const isTypeOnly = this.match(TokenType.Type);
      const imported = this.expect(
        TokenType.Identifier,
        "Expected identifier"
      ).value;
      let local = imported;

      if (this.match(TokenType.As)) {
        local = this.expect(TokenType.Identifier, "Expected identifier").value;
      }

      specifiers.push({
        kind: "ImportNamedSpecifier",
        imported,
        local,
        isTypeOnly,
      });

      if (!this.check(TokenType.RightBrace)) {
        this.expect(TokenType.Comma, "Expected ','");
      }
    }

    this.expect(TokenType.RightBrace, "Expected '}'");
  }

  private parseExportDeclaration(decorators?: Decorator[]): ExportDeclaration {
    const startToken = this.advance();
    const isTypeOnly = this.match(TokenType.Type);

    // export default
    if (this.match(TokenType.Default)) {
      if (this.check(TokenType.Function)) {
        const declaration = this.parseFunctionDeclaration();
        return {
          kind: "ExportDeclaration",
          declaration,
          isDefault: true,
          line: startToken.line,
        };
      }
      if (this.check(TokenType.Class)) {
        const declaration = this.parseClassDeclaration(decorators);
        return {
          kind: "ExportDeclaration",
          declaration,
          isDefault: true,
          line: startToken.line,
        };
      }
      // export default expression
      const expr = this.parseExpression();
      this.expect(TokenType.Semicolon, "Expected ';'");
      return {
        kind: "ExportDeclaration",
        declaration: {
          kind: "ExpressionStatement",
          expression: expr,
          line: startToken.line,
        },
        isDefault: true,
        line: startToken.line,
      };
    }

    // export * from "module"
    if (this.match(TokenType.Star)) {
      if (this.match(TokenType.As)) {
        const exported = this.expect(
          TokenType.Identifier,
          "Expected identifier"
        ).value;
        this.expect(TokenType.From, "Expected 'from'");
        const source = this.expect(
          TokenType.StringLiteral,
          "Expected module path"
        ).value;
        this.expect(TokenType.Semicolon, "Expected ';'");
        return {
          kind: "ExportDeclaration",
          specifiers: [{ local: "*", exported }],
          source,
          line: startToken.line,
        };
      }
      this.expect(TokenType.From, "Expected 'from'");
      const source = this.expect(
        TokenType.StringLiteral,
        "Expected module path"
      ).value;
      this.expect(TokenType.Semicolon, "Expected ';'");
      return { kind: "ExportDeclaration", source, line: startToken.line };
    }

    // export { ... }
    if (this.check(TokenType.LeftBrace)) {
      this.advance();
      const specifiers: ExportSpecifier[] = [];

      while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
        const isTypeOnly = this.match(TokenType.Type);
        const local = this.expect(
          TokenType.Identifier,
          "Expected identifier"
        ).value;
        let exported = local;

        if (this.match(TokenType.As)) {
          exported = this.expect(
            TokenType.Identifier,
            "Expected identifier"
          ).value;
        }

        specifiers.push({ local, exported, isTypeOnly });

        if (!this.check(TokenType.RightBrace)) {
          this.expect(TokenType.Comma, "Expected ','");
        }
      }

      this.expect(TokenType.RightBrace, "Expected '}'");

      let source: string | undefined;
      if (this.match(TokenType.From)) {
        source = this.expect(
          TokenType.StringLiteral,
          "Expected module path"
        ).value;
      }

      this.expect(TokenType.Semicolon, "Expected ';'");

      return {
        kind: "ExportDeclaration",
        specifiers,
        source,
        isTypeOnly,
        line: startToken.line,
      };
    }

    // export declaration
    let declaration: Statement | undefined;
    if (this.check(TokenType.Function)) {
      declaration = this.parseFunctionDeclaration();
    } else if (this.check(TokenType.Class)) {
      declaration = this.parseClassDeclaration();
    } else if (this.check(TokenType.Interface)) {
      declaration = this.parseInterfaceDeclaration();
    } else if (this.check(TokenType.Type)) {
      declaration = this.parseTypeAliasDeclaration();
    } else if (this.check(TokenType.Enum)) {
      declaration = this.parseEnumDeclaration();
    } else if (
      this.check(TokenType.Let) ||
      this.check(TokenType.Const) ||
      this.check(TokenType.Var)
    ) {
      declaration = this.parseVariableDeclaration();
    }

    return {
      kind: "ExportDeclaration",
      declaration,
      isTypeOnly,
      line: startToken.line,
    };
  }

  private parseExpressionStatement(): ExpressionStatement {
    const expr = this.parseExpression();
    this.expect(TokenType.Semicolon, "Expected ';' after expression");

    return {
      kind: "ExpressionStatement",
      expression: expr,
      line: expr.line,
    };
  }

  // ============================================
  // Type Parsing
  // ============================================

  private parseType(): TypeNode {
    return this.parseUnionType();
  }

  private parseUnionType(): TypeNode {
    this.match(TokenType.Pipe); // Allow leading |
    let left = this.parseIntersectionType();

    while (this.match(TokenType.Pipe)) {
      const right = this.parseIntersectionType();
      left = {
        kind: "UnionType",
        types:
          left.kind === "UnionType" ? [...left.types, right] : [left, right],
        line: left.line,
      };
    }

    return left;
  }

  private parseIntersectionType(): TypeNode {
    this.match(TokenType.Ampersand); // Allow leading &
    let left = this.parseArrayType();

    while (this.match(TokenType.Ampersand)) {
      const right = this.parseArrayType();
      left = {
        kind: "IntersectionType",
        types:
          left.kind === "IntersectionType"
            ? [...left.types, right]
            : [left, right],
        line: left.line,
      };
    }

    return left;
  }

  private parseArrayType(): TypeNode {
    let type = this.parsePrimaryType();

    while (this.check(TokenType.LeftBracket)) {
      this.advance();
      if (this.check(TokenType.RightBracket)) {
        this.advance();
        type = { kind: "ArrayType", elementType: type, line: type.line };
      } else {
        // Indexed access type
        const indexType = this.parseType();
        this.expect(TokenType.RightBracket, "Expected ']'");
        type = {
          kind: "IndexedAccessType",
          objectType: type,
          indexType,
          line: type.line,
        };
      }
    }

    return type;
  }

  private parsePrimaryType(): TypeNode {
    const token = this.peek();

    // Parenthesized type or function type
    if (this.check(TokenType.LeftParen)) {
      return this.parseFunctionOrParenthesizedType();
    }

    // Tuple type
    if (this.check(TokenType.LeftBracket)) {
      return this.parseTupleType();
    }

    // Object type
    if (this.check(TokenType.LeftBrace)) {
      return this.parseObjectType();
    }

    // Literal types
    if (this.check(TokenType.StringLiteral)) {
      this.advance();
      return { kind: "LiteralType", value: token.value, line: token.line };
    }
    if (this.check(TokenType.NumberLiteral)) {
      this.advance();
      return {
        kind: "LiteralType",
        value: parseFloat(token.value),
        line: token.line,
      };
    }
    if (this.check(TokenType.True)) {
      this.advance();
      return { kind: "LiteralType", value: true, line: token.line };
    }
    if (this.check(TokenType.False)) {
      this.advance();
      return { kind: "LiteralType", value: false, line: token.line };
    }
    if (this.check(TokenType.Null)) {
      this.advance();
      return { kind: "LiteralType", value: null, line: token.line };
    }

    // typeof type
    if (this.check(TokenType.Typeof)) {
      this.advance();
      const name = this.expect(
        TokenType.Identifier,
        "Expected identifier"
      ).value;
      return { kind: "TypeQuery", exprName: name, line: token.line };
    }

    // keyof type
    if (this.check(TokenType.Keyof)) {
      this.advance();
      const type = this.parsePrimaryType();
      return {
        kind: "TypeReference",
        typeName: "keyof",
        typeArguments: [type],
        line: token.line,
      };
    }

    // infer type
    if (this.check(TokenType.Infer)) {
      this.advance();
      const name = this.expect(
        TokenType.Identifier,
        "Expected identifier"
      ).value;
      return { kind: "InferType", typeParameter: { name }, line: token.line };
    }

    // Primitive types and type references
    if (
      this.check(TokenType.NumberType) ||
      this.check(TokenType.StringType) ||
      this.check(TokenType.BooleanType) ||
      this.check(TokenType.Void) ||
      this.check(TokenType.Undefined) ||
      this.check(TokenType.Any) ||
      this.check(TokenType.Unknown) ||
      this.check(TokenType.Never) ||
      this.check(TokenType.Object) ||
      this.check(TokenType.Symbol) ||
      this.check(TokenType.Bigint) ||
      this.check(TokenType.Identifier)
    ) {
      const typeName = this.advance().value;
      let typeArguments: TypeNode[] | undefined;

      if (this.check(TokenType.LessThan)) {
        typeArguments = this.parseTypeArguments();
      }

      const typeRef: TypeReference = {
        kind: "TypeReference",
        typeName,
        typeArguments,
        line: token.line,
      };

      // Check for conditional type
      if (this.match(TokenType.Extends)) {
        const extendsType = this.parseType();
        this.expect(TokenType.Question, "Expected '?' in conditional type");
        const trueType = this.parseType();
        this.expect(TokenType.Colon, "Expected ':' in conditional type");
        const falseType = this.parseType();

        return {
          kind: "ConditionalType",
          checkType: typeRef,
          extendsType,
          trueType,
          falseType,
          line: token.line,
        };
      }

      return typeRef;
    }

    throw new Error(
      `Expected type at line ${token.line}, got '${token.value}'`
    );
  }

  private parseFunctionOrParenthesizedType(): TypeNode {
    const startToken = this.peek();
    this.advance(); // consume '('

    // Check if it's empty params function type
    if (this.check(TokenType.RightParen)) {
      this.advance();
      if (this.match(TokenType.Arrow)) {
        const returnType = this.parseType();
        return {
          kind: "FunctionTypeNode",
          parameters: [],
          returnType,
          line: startToken.line,
        };
      }
      // Empty parentheses not followed by arrow - error
      throw new Error(`Unexpected ')' at line ${startToken.line}`);
    }

    // Try to parse as function type parameters
    const parameters: Parameter[] = [];
    let isFunction = false;

    const firstToken = this.peek();
    if (this.check(TokenType.Identifier)) {
      const name = this.advance().value;
      if (
        this.check(TokenType.Colon) ||
        this.check(TokenType.Question) ||
        this.check(TokenType.Comma) ||
        this.check(TokenType.RightParen)
      ) {
        // It's a function type
        isFunction = true;
        const optional = this.match(TokenType.Question);
        let typeAnnotation: TypeNode | undefined;
        if (this.match(TokenType.Colon)) {
          typeAnnotation = this.parseType();
        }
        parameters.push({ name, typeAnnotation, optional });

        while (this.match(TokenType.Comma)) {
          const param = this.parseParameter();
          parameters.push(param);
        }
      } else {
        // It's a parenthesized type, put the identifier back conceptually
        // Actually, we need to reparse as a type
        // This is tricky - for simplicity, assume it's a type reference
        this.pos--; // Go back
        const innerType = this.parseType();
        this.expect(TokenType.RightParen, "Expected ')'");
        return {
          kind: "ParenthesizedType",
          type: innerType,
          line: startToken.line,
        };
      }
    } else {
      // Parse as parenthesized type
      const innerType = this.parseType();
      this.expect(TokenType.RightParen, "Expected ')'");

      if (this.match(TokenType.Arrow)) {
        // It was actually a single-param function type without name
        // This is a simplification - real TS allows this
        const returnType = this.parseType();
        return {
          kind: "FunctionTypeNode",
          parameters: [{ name: "_", typeAnnotation: innerType }],
          returnType,
          line: startToken.line,
        };
      }

      return {
        kind: "ParenthesizedType",
        type: innerType,
        line: startToken.line,
      };
    }

    this.expect(TokenType.RightParen, "Expected ')'");

    if (this.match(TokenType.Arrow)) {
      const returnType = this.parseType();
      return {
        kind: "FunctionTypeNode",
        parameters,
        returnType,
        line: startToken.line,
      };
    }

    // If no arrow, it's a parenthesized type (but we already parsed params...)
    // This is an edge case - for simplicity, treat as function returning void
    return {
      kind: "FunctionTypeNode",
      parameters,
      returnType: {
        kind: "TypeReference",
        typeName: "void",
        line: startToken.line,
      },
      line: startToken.line,
    };
  }

  private parseTupleType(): TupleType {
    const startToken = this.advance(); // consume '['
    const elementTypes: TypeNode[] = [];

    if (!this.check(TokenType.RightBracket)) {
      do {
        elementTypes.push(this.parseType());
      } while (this.match(TokenType.Comma));
    }

    this.expect(TokenType.RightBracket, "Expected ']'");

    return { kind: "TupleType", elementTypes, line: startToken.line };
  }

  private parseObjectType(): ObjectTypeNode {
    const startToken = this.advance(); // consume '{'
    const members: TypeMember[] = [];

    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      const readonly = this.match(TokenType.Readonly);

      // Index signature
      if (this.check(TokenType.LeftBracket)) {
        this.advance();
        const indexName = this.expect(
          TokenType.Identifier,
          "Expected index name"
        ).value;
        this.expect(TokenType.Colon, "Expected ':'");
        const indexType = this.parseType();
        this.expect(TokenType.RightBracket, "Expected ']'");
        this.expect(TokenType.Colon, "Expected ':'");
        const valueType = this.parseType();

        members.push({
          name: indexName,
          typeAnnotation: valueType,
          isIndex: true,
          indexType,
          readonly,
        });
      } else {
        const name = this.expect(
          TokenType.Identifier,
          "Expected property name"
        ).value;
        const optional = this.match(TokenType.Question);
        this.expect(TokenType.Colon, "Expected ':'");
        const type = this.parseType();

        members.push({ name, typeAnnotation: type, optional, readonly });
      }

      this.match(TokenType.Semicolon) || this.match(TokenType.Comma);
    }

    this.expect(TokenType.RightBrace, "Expected '}'");

    return { kind: "ObjectTypeNode", members, line: startToken.line };
  }

  private parseTypeParameters(): TypeParameterDeclaration[] | undefined {
    if (!this.check(TokenType.LessThan)) {
      return undefined;
    }

    this.advance(); // consume '<'
    const params: TypeParameterDeclaration[] = [];

    do {
      const name = this.expect(
        TokenType.Identifier,
        "Expected type parameter name"
      ).value;
      let constraint: TypeNode | undefined;
      let defaultType: TypeNode | undefined;

      if (this.match(TokenType.Extends)) {
        constraint = this.parseType();
      }

      if (this.match(TokenType.Equals)) {
        defaultType = this.parseType();
      }

      params.push({ name, constraint, default: defaultType });
    } while (this.match(TokenType.Comma));

    this.expect(TokenType.GreaterThan, "Expected '>'");

    return params;
  }

  private parseTypeArguments(): TypeNode[] {
    this.advance(); // consume '<'
    const args: TypeNode[] = [];

    do {
      args.push(this.parseType());
    } while (this.match(TokenType.Comma));

    this.expect(TokenType.GreaterThan, "Expected '>'");

    return args;
  }

  // ============================================
  // Expression Parsing
  // ============================================

  private parseExpression(): Expression {
    return this.parseAssignment();
  }

  private parseAssignment(): Expression {
    const left = this.parseConditional();

    if (
      this.check(TokenType.Equals) ||
      this.check(TokenType.PlusEquals) ||
      this.check(TokenType.MinusEquals) ||
      this.check(TokenType.StarEquals) ||
      this.check(TokenType.SlashEquals) ||
      this.check(TokenType.PercentEquals)
    ) {
      const operator = this.advance().value;
      const right = this.parseAssignment();
      return {
        kind: "AssignmentExpression",
        operator,
        left,
        right,
        line: left.line,
      };
    }

    return left;
  }

  private parseConditional(): Expression {
    let condition = this.parseLogicalOr();

    if (this.match(TokenType.Question)) {
      const consequent = this.parseAssignment();
      this.expect(TokenType.Colon, "Expected ':'");
      const alternate = this.parseAssignment();

      return {
        kind: "ConditionalExpression",
        condition,
        consequent,
        alternate,
        line: condition.line,
      };
    }

    return condition;
  }

  private parseLogicalOr(): Expression {
    let left = this.parseLogicalAnd();

    while (
      this.check(TokenType.PipePipe) ||
      this.check(TokenType.QuestionQuestion)
    ) {
      const operator = this.advance().value as "||" | "??";
      const right = this.parseLogicalAnd();
      left = {
        kind: "LogicalExpression",
        operator,
        left,
        right,
        line: left.line,
      };
    }

    return left;
  }

  private parseLogicalAnd(): Expression {
    let left = this.parseBitwiseOr();

    while (this.match(TokenType.AmpersandAmpersand)) {
      const right = this.parseBitwiseOr();
      left = {
        kind: "LogicalExpression",
        operator: "&&",
        left,
        right,
        line: left.line,
      };
    }

    return left;
  }

  private parseBitwiseOr(): Expression {
    let left = this.parseBitwiseXor();

    while (this.match(TokenType.Pipe)) {
      const right = this.parseBitwiseXor();
      left = {
        kind: "BinaryExpression",
        operator: "|",
        left,
        right,
        line: left.line,
      };
    }

    return left;
  }

  private parseBitwiseXor(): Expression {
    let left = this.parseBitwiseAnd();

    while (this.match(TokenType.Caret)) {
      const right = this.parseBitwiseAnd();
      left = {
        kind: "BinaryExpression",
        operator: "^",
        left,
        right,
        line: left.line,
      };
    }

    return left;
  }

  private parseBitwiseAnd(): Expression {
    let left = this.parseEquality();

    while (this.match(TokenType.Ampersand)) {
      const right = this.parseEquality();
      left = {
        kind: "BinaryExpression",
        operator: "&",
        left,
        right,
        line: left.line,
      };
    }

    return left;
  }

  private parseEquality(): Expression {
    let left = this.parseRelational();

    while (
      this.check(TokenType.EqualsEquals) ||
      this.check(TokenType.EqualsEqualsEquals) ||
      this.check(TokenType.BangEquals) ||
      this.check(TokenType.BangEqualsEquals)
    ) {
      const operator = this.advance().value;
      const right = this.parseRelational();
      left = {
        kind: "BinaryExpression",
        operator,
        left,
        right,
        line: left.line,
      };
    }

    return left;
  }

  private parseRelational(): Expression {
    let left = this.parseShift();

    while (
      this.check(TokenType.LessThan) ||
      this.check(TokenType.GreaterThan) ||
      this.check(TokenType.LessThanEquals) ||
      this.check(TokenType.GreaterThanEquals) ||
      this.check(TokenType.Instanceof) ||
      this.check(TokenType.In)
    ) {
      const operator = this.advance().value;
      const right = this.parseShift();
      left = {
        kind: "BinaryExpression",
        operator,
        left,
        right,
        line: left.line,
      };
    }

    return left;
  }

  private parseShift(): Expression {
    let left = this.parseAdditive();

    while (
      this.check(TokenType.LessThanLessThan) ||
      this.check(TokenType.GreaterThanGreaterThan) ||
      this.check(TokenType.GreaterThanGreaterThanGreaterThan)
    ) {
      const operator = this.advance().value;
      const right = this.parseAdditive();
      left = {
        kind: "BinaryExpression",
        operator,
        left,
        right,
        line: left.line,
      };
    }

    return left;
  }

  private parseAdditive(): Expression {
    let left = this.parseMultiplicative();

    while (this.check(TokenType.Plus) || this.check(TokenType.Minus)) {
      const operator = this.advance().value;
      const right = this.parseMultiplicative();
      left = {
        kind: "BinaryExpression",
        operator,
        left,
        right,
        line: left.line,
      };
    }

    return left;
  }

  private parseMultiplicative(): Expression {
    let left = this.parseExponentiation();

    while (
      this.check(TokenType.Star) ||
      this.check(TokenType.Slash) ||
      this.check(TokenType.Percent)
    ) {
      const operator = this.advance().value;
      const right = this.parseExponentiation();
      left = {
        kind: "BinaryExpression",
        operator,
        left,
        right,
        line: left.line,
      };
    }

    return left;
  }

  private parseExponentiation(): Expression {
    const left = this.parseUnary();

    if (this.match(TokenType.StarStar)) {
      const right = this.parseExponentiation(); // Right associative
      return {
        kind: "BinaryExpression",
        operator: "**",
        left,
        right,
        line: left.line,
      };
    }

    return left;
  }

  private parseUnary(): Expression {
    if (
      this.check(TokenType.Bang) ||
      this.check(TokenType.Minus) ||
      this.check(TokenType.Plus) ||
      this.check(TokenType.Tilde) ||
      this.check(TokenType.Typeof) ||
      this.check(TokenType.Delete)
    ) {
      const operator = this.advance().value;
      const operand = this.parseUnary();
      return {
        kind: "UnaryExpression",
        operator,
        operand,
        prefix: true,
        line: operand.line,
      };
    }

    if (this.check(TokenType.PlusPlus) || this.check(TokenType.MinusMinus)) {
      const operator = this.advance().value as "++" | "--";
      const argument = this.parseUnary();
      return {
        kind: "UpdateExpression",
        operator,
        argument,
        prefix: true,
        line: argument.line,
      };
    }

    if (this.check(TokenType.Await)) {
      this.advance();
      const argument = this.parseUnary();
      return {
        kind: "AwaitExpression",
        argument,
        line: argument.line,
      };
    }

    return this.parsePostfix();
  }

  private parsePostfix(): Expression {
    let expr = this.parseLeftHandSide();

    if (this.check(TokenType.PlusPlus) || this.check(TokenType.MinusMinus)) {
      const operator = this.advance().value as "++" | "--";
      return {
        kind: "UpdateExpression",
        operator,
        argument: expr,
        prefix: false,
        line: expr.line,
      };
    }

    // Non-null assertion
    if (this.match(TokenType.Bang)) {
      return {
        kind: "NonNullExpression",
        expression: expr,
        line: expr.line,
      };
    }

    // Type assertion with 'as'
    if (this.match(TokenType.As)) {
      const typeAnnotation = this.parseType();
      return {
        kind: "AsExpression",
        expression: expr,
        typeAnnotation,
        line: expr.line,
      };
    }

    return expr;
  }

  private parseLeftHandSide(): Expression {
    let expr: Expression;

    if (this.check(TokenType.New)) {
      expr = this.parseNewExpression();
    } else {
      expr = this.parsePrimary();
    }

    return this.parseCallMemberExpression(expr);
  }

  private parseNewExpression(): NewExpression {
    const startToken = this.advance(); // consume 'new'
    const callee = this.parsePrimary();

    let typeArguments: TypeNode[] | undefined;
    if (this.check(TokenType.LessThan)) {
      typeArguments = this.parseTypeArguments();
    }

    const args: Expression[] = [];
    if (this.match(TokenType.LeftParen)) {
      if (!this.check(TokenType.RightParen)) {
        do {
          args.push(this.parseAssignment());
        } while (this.match(TokenType.Comma));
      }
      this.expect(TokenType.RightParen, "Expected ')'");
    }

    return {
      kind: "NewExpression",
      callee,
      arguments: args,
      typeArguments,
      line: startToken.line,
    };
  }

  private parseCallMemberExpression(expr: Expression): Expression {
    while (true) {
      if (this.check(TokenType.LeftParen)) {
        this.advance();
        const args: Expression[] = [];

        if (!this.check(TokenType.RightParen)) {
          do {
            if (this.check(TokenType.Spread)) {
              this.advance();
              args.push({
                kind: "SpreadElement",
                argument: this.parseAssignment(),
                line: this.peek().line,
              });
            } else {
              args.push(this.parseAssignment());
            }
          } while (this.match(TokenType.Comma));
        }

        this.expect(TokenType.RightParen, "Expected ')'");

        expr = {
          kind: "CallExpression",
          callee: expr,
          arguments: args,
          line: expr.line,
        };
      } else if (this.check(TokenType.Dot)) {
        this.advance();
        const property = this.expect(
          TokenType.Identifier,
          "Expected property name"
        ).value;
        expr = {
          kind: "MemberExpression",
          object: expr,
          property,
          line: expr.line,
        };
      } else if (this.check(TokenType.QuestionDot)) {
        this.advance();
        if (this.check(TokenType.LeftParen)) {
          // Optional call
          this.advance();
          const args: Expression[] = [];
          if (!this.check(TokenType.RightParen)) {
            do {
              args.push(this.parseAssignment());
            } while (this.match(TokenType.Comma));
          }
          this.expect(TokenType.RightParen, "Expected ')'");
          expr = {
            kind: "CallExpression",
            callee: expr,
            arguments: args,
            optional: true,
            line: expr.line,
          };
        } else if (this.check(TokenType.LeftBracket)) {
          // Optional computed member
          this.advance();
          const property = this.parseExpression();
          this.expect(TokenType.RightBracket, "Expected ']'");
          expr = {
            kind: "ComputedMemberExpression",
            object: expr,
            property,
            optional: true,
            line: expr.line,
          };
        } else {
          // Optional member access
          const property = this.expect(
            TokenType.Identifier,
            "Expected property name"
          ).value;
          expr = {
            kind: "MemberExpression",
            object: expr,
            property,
            optional: true,
            line: expr.line,
          };
        }
      } else if (this.check(TokenType.LeftBracket)) {
        this.advance();
        const property = this.parseExpression();
        this.expect(TokenType.RightBracket, "Expected ']'");
        expr = {
          kind: "ComputedMemberExpression",
          object: expr,
          property,
          line: expr.line,
        };
      } else if (this.check(TokenType.LessThan)) {
        // Could be type arguments for function call
        const savedPos = this.pos;
        try {
          const typeArguments = this.parseTypeArguments();
          if (this.check(TokenType.LeftParen)) {
            this.advance();
            const args: Expression[] = [];
            if (!this.check(TokenType.RightParen)) {
              do {
                args.push(this.parseAssignment());
              } while (this.match(TokenType.Comma));
            }
            this.expect(TokenType.RightParen, "Expected ')'");
            expr = {
              kind: "CallExpression",
              callee: expr,
              arguments: args,
              typeArguments,
              line: expr.line,
            };
          } else {
            // Not a function call, restore position
            this.pos = savedPos;
            break;
          }
        } catch {
          this.pos = savedPos;
          break;
        }
      } else {
        break;
      }
    }

    return expr;
  }

  private parsePrimary(): Expression {
    const token = this.peek();

    switch (token.type) {
      case TokenType.NumberLiteral:
        this.advance();
        return {
          kind: "NumericLiteral",
          value: parseFloat(token.value),
          line: token.line,
        };

      case TokenType.StringLiteral:
        this.advance();
        return {
          kind: "StringLiteral",
          value: token.value,
          line: token.line,
        };

      case TokenType.True:
        this.advance();
        return { kind: "BooleanLiteral", value: true, line: token.line };

      case TokenType.False:
        this.advance();
        return { kind: "BooleanLiteral", value: false, line: token.line };

      case TokenType.Null:
        this.advance();
        return { kind: "NullLiteral", line: token.line };

      case TokenType.Undefined:
        this.advance();
        return { kind: "UndefinedLiteral", line: token.line };

      case TokenType.This:
        this.advance();
        return { kind: "ThisExpression", line: token.line };

      case TokenType.Super:
        this.advance();
        return { kind: "SuperExpression", line: token.line };

      case TokenType.Identifier:
        this.advance();
        return { kind: "Identifier", name: token.value, line: token.line };

      case TokenType.LeftParen:
        return this.parseParenthesizedOrArrowFunction();

      case TokenType.LeftBrace:
        return this.parseObjectLiteral();

      case TokenType.LeftBracket:
        return this.parseArrayLiteral();

      case TokenType.Function:
        return this.parseFunctionExpression();

      case TokenType.Async:
        if (this.peekNext()?.type === TokenType.Function) {
          return this.parseFunctionExpression();
        }
        if (this.peekNext()?.type === TokenType.LeftParen) {
          return this.parseAsyncArrowFunction();
        }
        this.advance();
        return { kind: "Identifier", name: "async", line: token.line };

      case TokenType.Class:
        return this.parseClassExpression();

      case TokenType.TemplateLiteral:
        return this.parseTemplateLiteral();

      case TokenType.TemplateHead:
        return this.parseTemplateLiteral();

      default:
        throw new Error(
          `Unexpected token '${token.value}' at line ${token.line}`
        );
    }
  }

  private parseParenthesizedOrArrowFunction(): Expression {
    const startToken = this.peek();
    const savedPos = this.pos;

    // Try to parse as arrow function
    try {
      this.advance(); // consume '('
      const parameters: Parameter[] = [];

      if (!this.check(TokenType.RightParen)) {
        do {
          const param = this.parseParameter();
          parameters.push(param);
        } while (this.match(TokenType.Comma));
      }

      this.expect(TokenType.RightParen, "Expected ')'");

      let returnType: TypeNode | undefined;
      if (this.check(TokenType.Colon)) {
        this.advance();
        returnType = this.parseType();
      }

      if (this.match(TokenType.Arrow)) {
        let body: Expression | BlockStatement;
        if (this.check(TokenType.LeftBrace)) {
          body = this.parseBlockStatement();
        } else {
          body = this.parseAssignment();
        }

        return {
          kind: "ArrowFunction",
          parameters,
          returnType,
          body,
          line: startToken.line,
        };
      }

      // Not an arrow function, restore and parse as parenthesized expression
      this.pos = savedPos;
    } catch {
      this.pos = savedPos;
    }

    // Parse as parenthesized expression
    this.advance(); // consume '('
    const expr = this.parseExpression();
    this.expect(TokenType.RightParen, "Expected ')'");

    return {
      kind: "ParenthesizedExpression",
      expression: expr,
      line: startToken.line,
    };
  }

  private parseAsyncArrowFunction(): ArrowFunction {
    const startToken = this.advance(); // consume 'async'
    this.advance(); // consume '('

    const parameters: Parameter[] = [];
    if (!this.check(TokenType.RightParen)) {
      do {
        parameters.push(this.parseParameter());
      } while (this.match(TokenType.Comma));
    }

    this.expect(TokenType.RightParen, "Expected ')'");

    let returnType: TypeNode | undefined;
    if (this.check(TokenType.Colon)) {
      this.advance();
      returnType = this.parseType();
    }

    this.expect(TokenType.Arrow, "Expected '=>'");

    let body: Expression | BlockStatement;
    if (this.check(TokenType.LeftBrace)) {
      body = this.parseBlockStatement();
    } else {
      body = this.parseAssignment();
    }

    return {
      kind: "ArrowFunction",
      parameters,
      returnType,
      body,
      isAsync: true,
      line: startToken.line,
    };
  }

  private parseObjectLiteral(): ObjectLiteral {
    const startToken = this.advance(); // consume '{'
    const properties: ObjectProperty[] = [];

    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      if (this.check(TokenType.Spread)) {
        this.advance();
        const argument = this.parseAssignment();
        properties.push({
          key: "",
          value: { kind: "SpreadElement", argument, line: startToken.line },
          shorthand: false,
        });
      } else if (this.check(TokenType.LeftBracket)) {
        // Computed property
        this.advance();
        const key = this.parseExpression();
        this.expect(TokenType.RightBracket, "Expected ']'");
        this.expect(TokenType.Colon, "Expected ':'");
        const value = this.parseAssignment();
        properties.push({ key, value, computed: true });
      } else {
        const key = this.expect(
          TokenType.Identifier,
          "Expected property name"
        ).value;

        if (this.check(TokenType.Colon)) {
          this.advance();
          const value = this.parseAssignment();
          properties.push({ key, value });
        } else if (this.check(TokenType.LeftParen)) {
          // Method shorthand
          this.advance();
          const params: Parameter[] = [];
          if (!this.check(TokenType.RightParen)) {
            do {
              params.push(this.parseParameter());
            } while (this.match(TokenType.Comma));
          }
          this.expect(TokenType.RightParen, "Expected ')'");
          const body = this.parseBlockStatement();

          properties.push({
            key,
            value: {
              kind: "FunctionExpression",
              parameters: params,
              body,
              line: startToken.line,
            },
            method: true,
          });
        } else {
          // Shorthand property
          properties.push({
            key,
            value: { kind: "Identifier", name: key, line: startToken.line },
            shorthand: true,
          });
        }
      }

      if (!this.check(TokenType.RightBrace)) {
        this.expect(TokenType.Comma, "Expected ','");
      }
    }

    this.expect(TokenType.RightBrace, "Expected '}'");

    return { kind: "ObjectLiteral", properties, line: startToken.line };
  }

  private parseArrayLiteral(): ArrayLiteral {
    const startToken = this.advance(); // consume '['
    const elements: (Expression | SpreadElement | null)[] = [];

    while (!this.check(TokenType.RightBracket) && !this.isAtEnd()) {
      if (this.check(TokenType.Comma)) {
        elements.push(null); // Elision
      } else if (this.check(TokenType.Spread)) {
        this.advance();
        elements.push({
          kind: "SpreadElement",
          argument: this.parseAssignment(),
          line: startToken.line,
        });
      } else {
        elements.push(this.parseAssignment());
      }

      if (!this.check(TokenType.RightBracket)) {
        this.expect(TokenType.Comma, "Expected ','");
      }
    }

    this.expect(TokenType.RightBracket, "Expected ']'");

    return { kind: "ArrayLiteral", elements, line: startToken.line };
  }

  private parseFunctionExpression(): FunctionExpression {
    const startToken = this.peek();
    const isAsync = this.match(TokenType.Async);
    this.expect(TokenType.Function, "Expected 'function'");
    const isGenerator = this.match(TokenType.Star);

    let name: string | undefined;
    if (this.check(TokenType.Identifier)) {
      name = this.advance().value;
    }

    const typeParameters = this.parseTypeParameters();

    this.expect(TokenType.LeftParen, "Expected '('");
    const parameters = this.parseParameterList();
    this.expect(TokenType.RightParen, "Expected ')'");

    let returnType: TypeNode | undefined;
    if (this.check(TokenType.Colon)) {
      this.advance();
      returnType = this.parseType();
    }

    const body = this.parseBlockStatement();

    return {
      kind: "FunctionExpression",
      name,
      parameters,
      returnType,
      body,
      isAsync,
      isGenerator,
      typeParameters,
      line: startToken.line,
    };
  }

  private parseClassExpression(): Expression {
    const startToken = this.advance(); // consume 'class'

    let name: string | undefined;
    if (this.check(TokenType.Identifier)) {
      name = this.advance().value;
    }

    let superClass: Expression | undefined;
    if (this.match(TokenType.Extends)) {
      superClass = this.parseLeftHandSide();
    }

    let implementsClause: TypeNode[] | undefined;
    if (this.match(TokenType.Implements)) {
      implementsClause = [];
      do {
        implementsClause.push(this.parseType());
      } while (this.match(TokenType.Comma));
    }

    this.expect(TokenType.LeftBrace, "Expected '{'");

    const members: ClassMember[] = [];
    while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
      const member = this.parseClassMember();
      if (member) members.push(member);
    }

    this.expect(TokenType.RightBrace, "Expected '}'");

    return {
      kind: "ClassExpression",
      name,
      superClass,
      implements: implementsClause,
      members,
      line: startToken.line,
    };
  }

  private parseTemplateLiteral(): TemplateLiteralExpr {
    const startToken = this.peek();
    const quasis: string[] = [];
    const expressions: Expression[] = [];

    if (this.check(TokenType.TemplateLiteral)) {
      quasis.push(this.advance().value);
    } else if (this.check(TokenType.TemplateHead)) {
      quasis.push(this.advance().value);

      while (!this.isAtEnd()) {
        expressions.push(this.parseExpression());

        if (this.check(TokenType.TemplateTail)) {
          quasis.push(this.advance().value);
          break;
        } else if (this.check(TokenType.TemplateMiddle)) {
          quasis.push(this.advance().value);
        } else {
          throw new Error(
            `Expected template continuation at line ${this.peek().line}`
          );
        }
      }
    }

    return {
      kind: "TemplateLiteralExpr",
      quasis,
      expressions,
      line: startToken.line,
    };
  }

  // ============================================
  // Helper Methods
  // ============================================

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private peekNext(): Token | undefined {
    return this.tokens[this.pos + 1];
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.pos++;
    }
    return this.tokens[this.pos - 1];
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private match(type: TokenType): boolean {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  private expect(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }
    const token = this.peek();
    throw new Error(`${message} at line ${token.line}, got '${token.value}'`);
  }
}

export function parse(tokens: Token[]): Program {
  const parser = new Parser(tokens);
  return parser.parse();
}
