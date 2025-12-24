import { test, expect, describe } from "bun:test";
import { tokenize } from "../src/lexer";
import { TokenType } from "../src/types";

describe("Lexer", () => {
  test("tokenizes variable declaration with type annotation", () => {
    const tokens = tokenize("let x: number = 42;");

    expect(tokens[0].type).toBe(TokenType.Let);
    expect(tokens[1].type).toBe(TokenType.Identifier);
    expect(tokens[1].value).toBe("x");
    expect(tokens[2].type).toBe(TokenType.Colon);
    expect(tokens[3].type).toBe(TokenType.NumberType);
    expect(tokens[4].type).toBe(TokenType.Equals);
    expect(tokens[5].type).toBe(TokenType.NumberLiteral);
    expect(tokens[5].value).toBe("42");
    expect(tokens[6].type).toBe(TokenType.Semicolon);
    expect(tokens[7].type).toBe(TokenType.EOF);
  });

  test("tokenizes string literal", () => {
    const tokens = tokenize('const name: string = "hello";');

    expect(tokens[0].type).toBe(TokenType.Const);
    expect(tokens[1].type).toBe(TokenType.Identifier);
    expect(tokens[2].type).toBe(TokenType.Colon);
    expect(tokens[3].type).toBe(TokenType.StringType);
    expect(tokens[4].type).toBe(TokenType.Equals);
    expect(tokens[5].type).toBe(TokenType.StringLiteral);
    expect(tokens[5].value).toBe("hello");
  });

  test("tokenizes function declaration", () => {
    const tokens = tokenize(
      "function add(a: number, b: number): number { return a + b; }"
    );

    expect(tokens[0].type).toBe(TokenType.Function);
    expect(tokens[1].type).toBe(TokenType.Identifier);
    expect(tokens[1].value).toBe("add");
    expect(tokens[2].type).toBe(TokenType.LeftParen);
  });

  test("tokenizes interface", () => {
    const tokens = tokenize("interface Person { name: string; }");

    expect(tokens[0].type).toBe(TokenType.Interface);
    expect(tokens[1].type).toBe(TokenType.Identifier);
    expect(tokens[1].value).toBe("Person");
    expect(tokens[2].type).toBe(TokenType.LeftBrace);
  });

  test("tokenizes comparison operators", () => {
    const tokens = tokenize("a === b !== c < d >= e");

    expect(tokens[1].type).toBe(TokenType.EqualsEqualsEquals);
    expect(tokens[3].type).toBe(TokenType.BangEqualsEquals);
    expect(tokens[5].type).toBe(TokenType.LessThan);
    expect(tokens[7].type).toBe(TokenType.GreaterThanEquals);
  });

  test("handles single-line comments", () => {
    const tokens = tokenize("let x = 1; // this is a comment\nlet y = 2;");

    // Should have tokens for both statements, comment should be skipped
    const identifiers = tokens.filter((t) => t.type === TokenType.Identifier);
    expect(identifiers.length).toBe(2);
    expect(identifiers[0].value).toBe("x");
    expect(identifiers[1].value).toBe("y");
  });

  test("handles multi-line comments", () => {
    const tokens = tokenize(
      "let x = 1; /* this is\na multi-line\ncomment */ let y = 2;"
    );

    const identifiers = tokens.filter((t) => t.type === TokenType.Identifier);
    expect(identifiers.length).toBe(2);
  });

  test("tokenizes decimal numbers", () => {
    const tokens = tokenize("let pi: number = 3.14159;");

    const numberToken = tokens.find((t) => t.type === TokenType.NumberLiteral);
    expect(numberToken?.value).toBe("3.14159");
  });

  test("tokenizes escaped strings", () => {
    const tokens = tokenize('let s = "hello\\nworld";');

    const stringToken = tokens.find((t) => t.type === TokenType.StringLiteral);
    expect(stringToken?.value).toBe("hello\nworld");
  });

  test("tokenizes arithmetic operators", () => {
    const tokens = tokenize("1 + 2 - 3 * 4 / 5");

    expect(tokens[1].type).toBe(TokenType.Plus);
    expect(tokens[3].type).toBe(TokenType.Minus);
    expect(tokens[5].type).toBe(TokenType.Star);
    expect(tokens[7].type).toBe(TokenType.Slash);
  });
});
