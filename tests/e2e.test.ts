import { test, expect, describe } from "bun:test";
import { compile } from "../src/compiler";

describe("End-to-End Compilation", () => {
  test("compiles simple variable declaration", () => {
    const result = compile("let x: number = 42;");

    expect(result.success).toBe(true);
    expect(result.output?.trim()).toBe("let x = 42;");
    expect(result.errors.length).toBe(0);
  });

  test("compiles function with type erasure", () => {
    const source = `
function greet(name: string): string {
  return "Hello, " + name;
}
`;

    const result = compile(source);

    expect(result.success).toBe(true);
    expect(result.output).toContain("function greet(name)");
    expect(result.output).not.toContain(": string");
  });

  test("fails compilation on type error", () => {
    const result = compile('let x: number = "hello";');

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test("compiles with skipTypeCheck option", () => {
    const result = compile('let x: number = "hello";', { skipTypeCheck: true });

    // Should succeed even with type error when type checking is skipped
    expect(result.success).toBe(true);
    expect(result.output?.trim()).toBe('let x = "hello";');
  });

  test("includes AST when option is set", () => {
    const result = compile("let x = 1;", { includeAST: true });

    expect(result.success).toBe(true);
    expect(result.ast).toBeDefined();
    expect(result.ast?.kind).toBe("Program");
  });

  test("includes tokens when option is set", () => {
    const result = compile("let x = 1;", { includeTokens: true });

    expect(result.success).toBe(true);
    expect(result.tokens).toBeDefined();
    expect(result.tokens!.length).toBeGreaterThan(0);
  });

  test("compiles complete program with interface", () => {
    const source = `
interface Person {
  name: string;
  age: number;
}

function createPerson(name: string, age: number): Person {
  return { name: name, age: age };
}

let alice: Person = createPerson("Alice", 30);
`;

    const result = compile(source);

    expect(result.success).toBe(true);
    expect(result.output).toContain("// interface Person removed");
    expect(result.output).toContain("function createPerson(name, age)");
    expect(result.output).toContain('let alice = createPerson("Alice", 30);');
  });

  test("compiles program with if-else", () => {
    const source = `
function abs(x: number): number {
  if (x >= 0) {
    return x;
  } else {
    return -x;
  }
}
`;

    const result = compile(source);

    expect(result.success).toBe(true);
    expect(result.output).toContain("if (x >= 0)");
    expect(result.output).toContain("return -x;");
  });

  test("handles syntax error gracefully", () => {
    const result = compile("let x =");

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test("compiles arithmetic expressions", () => {
    const source = `
let a: number = 10;
let b: number = 5;
let sum: number = a + b;
let diff: number = a - b;
let prod: number = a * b;
let quot: number = a / b;
`;

    const result = compile(source);

    expect(result.success).toBe(true);
    expect(result.output).toContain("let sum = a + b;");
    expect(result.output).toContain("let diff = a - b;");
    expect(result.output).toContain("let prod = a * b;");
    expect(result.output).toContain("let quot = a / b;");
  });

  test("compiles string concatenation", () => {
    const source = `
let greeting: string = "Hello, " + "World!";
`;

    const result = compile(source);

    expect(result.success).toBe(true);
    expect(result.output).toContain('"Hello, " + "World!"');
  });
});
