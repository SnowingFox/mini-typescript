import { Token, TokenType } from "./types";

const KEYWORDS: Record<string, TokenType> = {
  // Variable declarations
  let: TokenType.Let,
  const: TokenType.Const,
  var: TokenType.Var,

  // Functions
  function: TokenType.Function,
  return: TokenType.Return,
  async: TokenType.Async,
  await: TokenType.Await,
  yield: TokenType.Yield,

  // Control flow
  if: TokenType.If,
  else: TokenType.Else,
  while: TokenType.While,
  for: TokenType.For,
  do: TokenType.Do,
  break: TokenType.Break,
  continue: TokenType.Continue,
  switch: TokenType.Switch,
  case: TokenType.Case,
  default: TokenType.Default,

  // Error handling
  throw: TokenType.Throw,
  try: TokenType.Try,
  catch: TokenType.Catch,
  finally: TokenType.Finally,

  // Classes
  class: TokenType.Class,
  extends: TokenType.Extends,
  implements: TokenType.Implements,
  new: TokenType.New,
  this: TokenType.This,
  super: TokenType.Super,
  constructor: TokenType.Constructor,
  public: TokenType.Public,
  private: TokenType.Private,
  protected: TokenType.Protected,
  static: TokenType.Static,
  readonly: TokenType.Readonly,
  abstract: TokenType.Abstract,
  get: TokenType.Get,
  set: TokenType.Set,

  // Types
  interface: TokenType.Interface,
  type: TokenType.Type,
  enum: TokenType.Enum,
  namespace: TokenType.Namespace,
  module: TokenType.Module,
  declare: TokenType.Declare,

  // Type keywords
  number: TokenType.NumberType,
  string: TokenType.StringType,
  boolean: TokenType.BooleanType,
  void: TokenType.Void,
  null: TokenType.Null,
  undefined: TokenType.Undefined,
  any: TokenType.Any,
  unknown: TokenType.Unknown,
  never: TokenType.Never,
  object: TokenType.Object,
  symbol: TokenType.Symbol,
  bigint: TokenType.Bigint,

  // Boolean literals
  true: TokenType.True,
  false: TokenType.False,

  // Operators
  typeof: TokenType.Typeof,
  keyof: TokenType.Keyof,
  infer: TokenType.Infer,
  in: TokenType.In,
  of: TokenType.Of,
  instanceof: TokenType.Instanceof,
  delete: TokenType.Delete,
  as: TokenType.As,

  // Modules
  import: TokenType.Import,
  export: TokenType.Export,
  from: TokenType.From,
};

export class Lexer {
  private source: string;
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    while (!this.isAtEnd()) {
      this.scanToken();
    }

    this.tokens.push({
      type: TokenType.EOF,
      value: "",
      line: this.line,
      column: this.column,
    });

    return this.tokens;
  }

  private scanToken(): void {
    this.skipWhitespaceAndComments();

    if (this.isAtEnd()) return;

    const char = this.peek();

    // Identifiers and keywords
    if (this.isAlpha(char)) {
      this.scanIdentifier();
      return;
    }

    // Numbers
    if (this.isDigit(char)) {
      this.scanNumber();
      return;
    }

    // Strings
    if (char === '"' || char === "'") {
      this.scanString(char);
      return;
    }

    // Template literals
    if (char === "`") {
      this.scanTemplateLiteral();
      return;
    }

    // Operators and punctuation
    this.scanOperatorOrPunctuation();
  }

  private scanIdentifier(): void {
    const startColumn = this.column;
    let value = "";

    while (!this.isAtEnd() && this.isAlphaNumeric(this.peek())) {
      value += this.advance();
    }

    const type = KEYWORDS[value] ?? TokenType.Identifier;
    this.tokens.push({
      type,
      value,
      line: this.line,
      column: startColumn,
    });
  }

  private scanNumber(): void {
    const startColumn = this.column;
    let value = "";

    // Handle hex, octal, binary
    if (this.peek() === "0" && !this.isAtEnd()) {
      const next = this.peekNext().toLowerCase();
      if (next === "x") {
        // Hexadecimal
        value += this.advance(); // 0
        value += this.advance(); // x
        while (!this.isAtEnd() && this.isHexDigit(this.peek())) {
          value += this.advance();
        }
        this.addNumberToken(value, startColumn);
        return;
      } else if (next === "b") {
        // Binary
        value += this.advance(); // 0
        value += this.advance(); // b
        while (
          !this.isAtEnd() &&
          (this.peek() === "0" || this.peek() === "1")
        ) {
          value += this.advance();
        }
        this.addNumberToken(value, startColumn);
        return;
      } else if (next === "o") {
        // Octal
        value += this.advance(); // 0
        value += this.advance(); // o
        while (!this.isAtEnd() && this.isOctalDigit(this.peek())) {
          value += this.advance();
        }
        this.addNumberToken(value, startColumn);
        return;
      }
    }

    while (!this.isAtEnd() && this.isDigit(this.peek())) {
      value += this.advance();
    }

    // Handle decimal numbers
    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      value += this.advance(); // consume '.'
      while (!this.isAtEnd() && this.isDigit(this.peek())) {
        value += this.advance();
      }
    }

    // Handle scientific notation
    if (this.peek().toLowerCase() === "e") {
      value += this.advance(); // consume 'e'
      if (this.peek() === "+" || this.peek() === "-") {
        value += this.advance();
      }
      while (!this.isAtEnd() && this.isDigit(this.peek())) {
        value += this.advance();
      }
    }

    // Handle bigint
    if (this.peek() === "n") {
      value += this.advance();
    }

    this.addNumberToken(value, startColumn);
  }

  private addNumberToken(value: string, startColumn: number): void {
    this.tokens.push({
      type: TokenType.NumberLiteral,
      value,
      line: this.line,
      column: startColumn,
    });
  }

  private scanString(quote: string): void {
    const startColumn = this.column;
    this.advance(); // consume opening quote
    let value = "";

    while (!this.isAtEnd() && this.peek() !== quote) {
      if (this.peek() === "\\") {
        this.advance(); // consume backslash
        const escaped = this.advance();
        switch (escaped) {
          case "n":
            value += "\n";
            break;
          case "t":
            value += "\t";
            break;
          case "r":
            value += "\r";
            break;
          case "\\":
            value += "\\";
            break;
          case '"':
            value += '"';
            break;
          case "'":
            value += "'";
            break;
          case "0":
            value += "\0";
            break;
          case "u":
            // Unicode escape
            let unicode = "";
            if (this.peek() === "{") {
              this.advance(); // consume {
              while (!this.isAtEnd() && this.peek() !== "}") {
                unicode += this.advance();
              }
              this.advance(); // consume }
            } else {
              for (let i = 0; i < 4; i++) {
                unicode += this.advance();
              }
            }
            value += String.fromCodePoint(parseInt(unicode, 16));
            break;
          default:
            value += escaped;
        }
      } else if (this.peek() === "\n") {
        throw new Error(`Unterminated string at line ${this.line}`);
      } else {
        value += this.advance();
      }
    }

    if (this.isAtEnd()) {
      throw new Error(`Unterminated string at line ${this.line}`);
    }

    this.advance(); // consume closing quote

    this.tokens.push({
      type: TokenType.StringLiteral,
      value,
      line: this.line,
      column: startColumn,
    });
  }

  private scanTemplateLiteral(): void {
    const startColumn = this.column;
    this.advance(); // consume opening backtick
    let value = "";

    while (!this.isAtEnd()) {
      if (this.peek() === "`") {
        this.advance(); // consume closing backtick
        this.tokens.push({
          type: TokenType.TemplateLiteral,
          value,
          line: this.line,
          column: startColumn,
        });
        return;
      } else if (this.peek() === "$" && this.peekNext() === "{") {
        // Template expression start
        this.tokens.push({
          type: TokenType.TemplateHead,
          value,
          line: this.line,
          column: startColumn,
        });
        this.advance(); // consume $
        this.advance(); // consume {
        this.scanTemplateExpression();
        return;
      } else if (this.peek() === "\\") {
        this.advance(); // consume backslash
        const escaped = this.advance();
        switch (escaped) {
          case "n":
            value += "\n";
            break;
          case "t":
            value += "\t";
            break;
          case "`":
            value += "`";
            break;
          case "$":
            value += "$";
            break;
          case "\\":
            value += "\\";
            break;
          default:
            value += escaped;
        }
      } else if (this.peek() === "\n") {
        value += this.advance();
        this.line++;
        this.column = 1;
      } else {
        value += this.advance();
      }
    }

    throw new Error(`Unterminated template literal at line ${this.line}`);
  }

  private scanTemplateExpression(): void {
    let braceCount = 1;

    // Scan until we find the matching closing brace
    while (!this.isAtEnd() && braceCount > 0) {
      this.scanToken();
      const lastToken = this.tokens[this.tokens.length - 1];
      if (lastToken.type === TokenType.LeftBrace) {
        braceCount++;
      } else if (lastToken.type === TokenType.RightBrace) {
        braceCount--;
        if (braceCount === 0) {
          // Remove the RightBrace token we just added
          this.tokens.pop();
          // Continue scanning template
          this.scanTemplateMiddleOrTail();
          return;
        }
      }
    }
  }

  private scanTemplateMiddleOrTail(): void {
    const startColumn = this.column;
    let value = "";

    while (!this.isAtEnd()) {
      if (this.peek() === "`") {
        this.advance();
        this.tokens.push({
          type: TokenType.TemplateTail,
          value,
          line: this.line,
          column: startColumn,
        });
        return;
      } else if (this.peek() === "$" && this.peekNext() === "{") {
        this.tokens.push({
          type: TokenType.TemplateMiddle,
          value,
          line: this.line,
          column: startColumn,
        });
        this.advance(); // consume $
        this.advance(); // consume {
        this.scanTemplateExpression();
        return;
      } else if (this.peek() === "\\") {
        this.advance();
        value += this.advance();
      } else if (this.peek() === "\n") {
        value += this.advance();
        this.line++;
        this.column = 1;
      } else {
        value += this.advance();
      }
    }

    throw new Error(`Unterminated template literal at line ${this.line}`);
  }

  private scanOperatorOrPunctuation(): void {
    const startColumn = this.column;
    const char = this.advance();

    let type: TokenType;
    let value = char;

    switch (char) {
      case "+":
        if (this.match("+")) {
          type = TokenType.PlusPlus;
          value = "++";
        } else if (this.match("=")) {
          type = TokenType.PlusEquals;
          value = "+=";
        } else {
          type = TokenType.Plus;
        }
        break;
      case "-":
        if (this.match("-")) {
          type = TokenType.MinusMinus;
          value = "--";
        } else if (this.match("=")) {
          type = TokenType.MinusEquals;
          value = "-=";
        } else {
          type = TokenType.Minus;
        }
        break;
      case "*":
        if (this.match("*")) {
          type = TokenType.StarStar;
          value = "**";
        } else if (this.match("=")) {
          type = TokenType.StarEquals;
          value = "*=";
        } else {
          type = TokenType.Star;
        }
        break;
      case "/":
        if (this.match("=")) {
          type = TokenType.SlashEquals;
          value = "/=";
        } else {
          type = TokenType.Slash;
        }
        break;
      case "%":
        if (this.match("=")) {
          type = TokenType.PercentEquals;
          value = "%=";
        } else {
          type = TokenType.Percent;
        }
        break;
      case "(":
        type = TokenType.LeftParen;
        break;
      case ")":
        type = TokenType.RightParen;
        break;
      case "{":
        type = TokenType.LeftBrace;
        break;
      case "}":
        type = TokenType.RightBrace;
        break;
      case "[":
        type = TokenType.LeftBracket;
        break;
      case "]":
        type = TokenType.RightBracket;
        break;
      case ":":
        type = TokenType.Colon;
        break;
      case ";":
        type = TokenType.Semicolon;
        break;
      case ",":
        type = TokenType.Comma;
        break;
      case "@":
        type = TokenType.At;
        break;
      case ".":
        if (this.match(".")) {
          if (this.match(".")) {
            type = TokenType.Spread;
            value = "...";
          } else {
            throw new Error(
              `Unexpected token '..' at line ${this.line}, column ${startColumn}`
            );
          }
        } else {
          type = TokenType.Dot;
        }
        break;
      case "=":
        if (this.match("=")) {
          if (this.match("=")) {
            type = TokenType.EqualsEqualsEquals;
            value = "===";
          } else {
            type = TokenType.EqualsEquals;
            value = "==";
          }
        } else if (this.match(">")) {
          type = TokenType.Arrow;
          value = "=>";
        } else {
          type = TokenType.Equals;
        }
        break;
      case "!":
        if (this.match("=")) {
          if (this.match("=")) {
            type = TokenType.BangEqualsEquals;
            value = "!==";
          } else {
            type = TokenType.BangEquals;
            value = "!=";
          }
        } else {
          type = TokenType.Bang;
        }
        break;
      case "<":
        if (this.match("=")) {
          type = TokenType.LessThanEquals;
          value = "<=";
        } else if (this.match("<")) {
          type = TokenType.LessThanLessThan;
          value = "<<";
        } else {
          type = TokenType.LessThan;
        }
        break;
      case ">":
        if (this.match("=")) {
          type = TokenType.GreaterThanEquals;
          value = ">=";
        } else if (this.match(">")) {
          if (this.match(">")) {
            type = TokenType.GreaterThanGreaterThanGreaterThan;
            value = ">>>";
          } else {
            type = TokenType.GreaterThanGreaterThan;
            value = ">>";
          }
        } else {
          type = TokenType.GreaterThan;
        }
        break;
      case "&":
        if (this.match("&")) {
          type = TokenType.AmpersandAmpersand;
          value = "&&";
        } else {
          type = TokenType.Ampersand;
        }
        break;
      case "|":
        if (this.match("|")) {
          type = TokenType.PipePipe;
          value = "||";
        } else {
          type = TokenType.Pipe;
        }
        break;
      case "^":
        type = TokenType.Caret;
        break;
      case "~":
        type = TokenType.Tilde;
        break;
      case "?":
        if (this.match(".")) {
          type = TokenType.QuestionDot;
          value = "?.";
        } else if (this.match("?")) {
          type = TokenType.QuestionQuestion;
          value = "??";
        } else {
          type = TokenType.Question;
        }
        break;
      default:
        throw new Error(
          `Unexpected character '${char}' at line ${this.line}, column ${startColumn}`
        );
    }

    this.tokens.push({
      type,
      value,
      line: this.line,
      column: startColumn,
    });
  }

  private skipWhitespaceAndComments(): void {
    while (!this.isAtEnd()) {
      const char = this.peek();

      if (char === " " || char === "\t" || char === "\r") {
        this.advance();
      } else if (char === "\n") {
        this.advance();
        this.line++;
        this.column = 1;
      } else if (char === "/" && this.peekNext() === "/") {
        // Single-line comment
        while (!this.isAtEnd() && this.peek() !== "\n") {
          this.advance();
        }
      } else if (char === "/" && this.peekNext() === "*") {
        // Multi-line comment
        this.advance(); // consume /
        this.advance(); // consume *
        while (
          !this.isAtEnd() &&
          !(this.peek() === "*" && this.peekNext() === "/")
        ) {
          if (this.peek() === "\n") {
            this.line++;
            this.column = 0;
          }
          this.advance();
        }
        if (!this.isAtEnd()) {
          this.advance(); // consume *
          this.advance(); // consume /
        }
      } else {
        break;
      }
    }
  }

  private isAtEnd(): boolean {
    return this.pos >= this.source.length;
  }

  private peek(): string {
    return this.source[this.pos] || "\0";
  }

  private peekNext(): string {
    return this.source[this.pos + 1] || "\0";
  }

  private advance(): string {
    const char = this.source[this.pos++];
    this.column++;
    return char;
  }

  private match(expected: string): boolean {
    if (this.isAtEnd() || this.peek() !== expected) {
      return false;
    }
    this.advance();
    return true;
  }

  private isAlpha(char: string): boolean {
    return /[a-zA-Z_$]/.test(char);
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private isHexDigit(char: string): boolean {
    return /[0-9a-fA-F]/.test(char);
  }

  private isOctalDigit(char: string): boolean {
    return /[0-7]/.test(char);
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
}

export function tokenize(source: string): Token[] {
  const lexer = new Lexer(source);
  return lexer.tokenize();
}
