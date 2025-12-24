import { test, expect, describe } from "bun:test";
import { tokenize } from "../src/lexer";
import { parse } from "../src/parser";
import { emit } from "../src/emitter";

describe("Emitter", () => {
  function transpile(source: string): string {
    const tokens = tokenize(source);
    const ast = parse(tokens);
    return emit(ast);
  }

  test("emits variable declaration without type annotation", () => {
    const output = transpile("let x: number = 42;");
    expect(output.trim()).toBe("let x = 42;");
  });

  test("emits const declaration without type annotation", () => {
    const output = transpile('const s: string = "hello";');
    expect(output.trim()).toBe('const s = "hello";');
  });

  test("emits function without type annotations", () => {
    const output = transpile(
      "function add(a: number, b: number): number { return a + b; }"
    );

    expect(output).toContain("function add(a, b)");
    expect(output).toContain("return a + b;");
    expect(output).not.toContain(": number");
    expect(output).not.toContain("number");
  });

  test("erases interface declarations", () => {
    const output = transpile("interface Person { name: string; age: number; }");

    expect(output).toContain("// interface Person removed");
    expect(output).not.toContain("name: string");
  });

  test("emits if statement correctly", () => {
    const output = transpile("if (x > 0) { return 1; }");

    expect(output).toContain("if (x > 0)");
    expect(output).toContain("return 1;");
  });

  test("emits if-else statement correctly", () => {
    const output = transpile("if (x > 0) { return 1; } else { return 0; }");

    expect(output).toContain("if (x > 0)");
    expect(output).toContain("} else {");
    expect(output).toContain("return 0;");
  });

  test("emits function call correctly", () => {
    const output = transpile("add(1, 2);");
    expect(output.trim()).toBe("add(1, 2);");
  });

  test("emits binary expression with correct precedence", () => {
    const output = transpile("let result = 1 + 2 * 3;");
    expect(output).toContain("1 + 2 * 3");
  });

  test("emits object literal correctly", () => {
    const output = transpile('let obj = { name: "Alice", age: 30 };');

    expect(output).toContain('name: "Alice"');
    expect(output).toContain("age: 30");
  });

  test("emits string literals with proper escaping", () => {
    const output = transpile('let s = "hello\\nworld";');
    expect(output).toContain('"hello\\nworld"');
  });

  test("emits unary expressions", () => {
    const output = transpile("let neg = -x;");
    expect(output).toContain("-x");
  });

  test("emits comparison operators", () => {
    const output = transpile("let result = a === b;");
    expect(output).toContain("a === b");
  });

  test("preserves code structure with multiple statements", () => {
    const source = `
let x: number = 10;
let y: number = 20;
function add(a: number, b: number): number {
  return a + b;
}
let result: number = add(x, y);
`;

    const output = transpile(source);

    expect(output).toContain("let x = 10;");
    expect(output).toContain("let y = 20;");
    expect(output).toContain("function add(a, b)");
    expect(output).toContain("let result = add(x, y);");
  });
});
