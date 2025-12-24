import { test, expect, describe } from "bun:test";
import { tokenize } from "../src/lexer";
import { parse } from "../src/parser";
import { typeCheck } from "../src/checker";

describe("Type Checker", () => {
  function check(source: string) {
    const tokens = tokenize(source);
    const ast = parse(tokens);
    return typeCheck(ast);
  }

  test("accepts valid number assignment", () => {
    const errors = check("let x: number = 42;");
    expect(errors.length).toBe(0);
  });

  test("accepts valid string assignment", () => {
    const errors = check('const s: string = "hello";');
    expect(errors.length).toBe(0);
  });

  test("reports type mismatch: string to number", () => {
    const errors = check('let x: number = "hello";');
    expect(errors.length).toBe(1);
    expect(errors[0].message).toContain("not assignable");
  });

  test("reports type mismatch: number to string", () => {
    const errors = check("let s: string = 42;");
    expect(errors.length).toBe(1);
    expect(errors[0].message).toContain("not assignable");
  });

  test("reports undefined variable", () => {
    const errors = check("let x = y;");
    expect(errors.length).toBe(1);
    expect(errors[0].message).toContain("Cannot find name 'y'");
  });

  test("accepts valid function declaration and call", () => {
    const errors = check(`
      function add(a: number, b: number): number {
        return a + b;
      }
      let result: number = add(1, 2);
    `);
    expect(errors.length).toBe(0);
  });

  test("reports function argument type mismatch", () => {
    const errors = check(`
      function greet(name: string): string {
        return "Hello, " + name;
      }
      greet(42);
    `);
    expect(errors.length).toBe(1);
    expect(errors[0].message).toContain("not assignable to parameter");
  });

  test("reports wrong number of arguments", () => {
    const errors = check(`
      function add(a: number, b: number): number {
        return a + b;
      }
      add(1);
    `);
    expect(errors.length).toBe(1);
    expect(errors[0].message).toContain("arguments, but got 1");
  });

  test("reports return type mismatch", () => {
    const errors = check(`
      function getValue(): number {
        return "hello";
      }
    `);
    expect(errors.length).toBe(1);
    expect(errors[0].message).toContain("not assignable to return type");
  });

  test("accepts interface and object literal", () => {
    const errors = check(`
      interface Person {
        name: string;
        age: number;
      }
      let person: Person = { name: "Alice", age: 30 };
    `);
    expect(errors.length).toBe(0);
  });

  test("reports missing interface member", () => {
    const errors = check(`
      interface Person {
        name: string;
        age: number;
      }
      let person: Person = { name: "Alice" };
    `);
    expect(errors.length).toBe(1);
    expect(errors[0].message).toContain("not assignable");
  });

  test("allows string concatenation with +", () => {
    const errors = check(`
      let greeting: string = "Hello, " + "World";
    `);
    expect(errors.length).toBe(0);
  });

  test("allows number and string concatenation with +", () => {
    const errors = check(`
      let msg: string = "Value: " + 42;
    `);
    expect(errors.length).toBe(0);
  });

  test("reports variable redeclaration in same scope", () => {
    const errors = check(`
      let x: number = 1;
      let x: number = 2;
    `);
    expect(errors.length).toBe(1);
    expect(errors[0].message).toContain("already declared");
  });

  test("accepts arithmetic operations on numbers", () => {
    const errors = check(`
      let a: number = 10;
      let b: number = 5;
      let sum: number = a + b;
      let diff: number = a - b;
      let prod: number = a * b;
      let quot: number = a / b;
    `);
    expect(errors.length).toBe(0);
  });

  test("reports arithmetic operation on string", () => {
    const errors = check(`
      let a: string = "hello";
      let b: number = a - 1;
    `);
    expect(errors.length).toBe(1);
    expect(errors[0].message).toContain("arithmetic");
  });
});
