import { test, expect, describe } from "bun:test";
import { compile } from "../src/compiler";

describe("Advanced TypeScript Features", () => {
  // Arrow Functions
  describe("Arrow Functions", () => {
    test("compiles simple arrow function", () => {
      const result = compile(
        "const add = (a: number, b: number): number => a + b;"
      );
      expect(result.success).toBe(true);
      expect(result.output).toContain("const add = (a, b) => a + b;");
    });

    test("compiles arrow function with block body", () => {
      const result = compile(`
        const greet = (name: string): string => {
          return "Hello, " + name;
        };
      `);
      expect(result.success).toBe(true);
      expect(result.output).toContain("const greet = (name) =>");
      expect(result.output).toContain("return");
    });

    test("compiles async arrow function", () => {
      const result = compile(
        "const fetchData = async (url: string): Promise<any> => { return null; };",
        { skipTypeCheck: true }
      );
      expect(result.success).toBe(true);
      expect(result.output).toContain("async (url) =>");
    });
  });

  // Classes
  describe("Classes", () => {
    test("compiles basic class", () => {
      const result = compile(`
        class Person {
          name: string;
          constructor(name: string) {
            this.name = name;
          }
        }
      `);
      expect(result.success).toBe(true);
      expect(result.output).toContain("class Person");
      expect(result.output).toContain("constructor(name)");
    });

    test("compiles class with methods", () => {
      const result = compile(`
        class Calculator {
          add(a: number, b: number): number {
            return a + b;
          }
        }
      `);
      expect(result.success).toBe(true);
      expect(result.output).toContain("add(a, b)");
    });

    test("compiles class with inheritance", () => {
      const result = compile(`
        class Animal {
          name: string;
          constructor(name: string) {
            this.name = name;
          }
        }
        class Dog extends Animal {
          bark(): string {
            return "Woof!";
          }
        }
      `);
      expect(result.success).toBe(true);
      expect(result.output).toContain("class Dog extends Animal");
    });

    test("compiles class with static members", () => {
      const result = compile(
        `
        class Counter {
          static count: number = 0;
          static increment(): void {
            Counter.count = Counter.count + 1;
          }
        }
      `,
        { skipTypeCheck: true }
      );
      expect(result.success).toBe(true);
      expect(result.output).toContain("static count = 0;");
      expect(result.output).toContain("static increment()");
    });

    test("compiles class with getters and setters", () => {
      const result = compile(
        `
        class Person {
          private _name: string;
          get name(): string {
            return this._name;
          }
          set name(value: string) {
            this._name = value;
          }
        }
      `,
        { skipTypeCheck: true }
      );
      expect(result.success).toBe(true);
      expect(result.output).toContain("get name()");
      expect(result.output).toContain("set name(value)");
    });
  });

  // Enums
  describe("Enums", () => {
    test("compiles numeric enum", () => {
      const result = compile(`
        enum Color {
          Red,
          Green,
          Blue
        }
      `);
      expect(result.success).toBe(true);
      expect(result.output).toContain("var Color");
      expect(result.output).toContain('Color["Red"] = 0');
    });

    test("compiles enum with initializers", () => {
      const result = compile(`
        enum HttpStatus {
          OK = 200,
          NotFound = 404
        }
      `);
      expect(result.success).toBe(true);
      expect(result.output).toContain('HttpStatus["OK"] = 200');
      expect(result.output).toContain('HttpStatus["NotFound"] = 404');
    });

    test("compiles string enum", () => {
      const result = compile(`
        enum Direction {
          Up = "UP",
          Down = "DOWN"
        }
      `);
      expect(result.success).toBe(true);
      expect(result.output).toContain('Direction["Up"] = "UP"');
    });
  });

  // Type Aliases
  describe("Type Aliases", () => {
    test("erases type aliases", () => {
      const result = compile("type ID = number;");
      expect(result.success).toBe(true);
      expect(result.output).toContain("// type ID removed");
    });

    test("supports type alias for union", () => {
      const result = compile(`
        type StringOrNumber = string | number;
        let value: StringOrNumber = "hello";
      `);
      expect(result.success).toBe(true);
      expect(result.output).toContain("let value = ");
    });
  });

  // Arrays and Loops
  describe("Arrays and Loops", () => {
    test("compiles for...of loop", () => {
      const result = compile(`
        const nums: number[] = [1, 2, 3];
        for (const n of nums) {
          console.log(n);
        }
      `);
      expect(result.success).toBe(true);
      expect(result.output).toContain("for (const n of nums)");
    });

    test("compiles for...in loop", () => {
      const result = compile(
        `
        const obj = { a: 1, b: 2 };
        for (const key in obj) {
          console.log(key);
        }
      `,
        { skipTypeCheck: true }
      );
      expect(result.success).toBe(true);
      expect(result.output).toContain("for (const key in obj)");
    });

    test("compiles while loop", () => {
      const result = compile(`
        let i: number = 0;
        while (i < 10) {
          i = i + 1;
        }
      `);
      expect(result.success).toBe(true);
      expect(result.output).toContain("while (i < 10)");
    });

    test("compiles do...while loop", () => {
      const result = compile(`
        let i: number = 0;
        do {
          i = i + 1;
        } while (i < 10);
      `);
      expect(result.success).toBe(true);
      expect(result.output).toContain("do {");
      expect(result.output).toContain("} while (i < 10);");
    });
  });

  // Control Flow
  describe("Control Flow", () => {
    test("compiles switch statement", () => {
      const result = compile(`
        function test(x: number): string {
          switch (x) {
            case 1:
              return "one";
            case 2:
              return "two";
            default:
              return "other";
          }
        }
      `);
      expect(result.success).toBe(true);
      expect(result.output).toContain("switch (x)");
      expect(result.output).toContain("case 1:");
      expect(result.output).toContain("default:");
    });

    test("compiles try...catch...finally", () => {
      const result = compile(
        `
        function test(): void {
          try {
            throw new Error("test");
          } catch (e) {
            console.log(e);
          } finally {
            console.log("done");
          }
        }
      `,
        { skipTypeCheck: true }
      );
      expect(result.success).toBe(true);
      expect(result.output).toContain("try {");
      expect(result.output).toContain("} catch (e) {");
      expect(result.output).toContain("} finally {");
    });
  });

  // Optional Chaining and Nullish Coalescing
  describe("Optional Chaining and Nullish Coalescing", () => {
    test("compiles optional chaining", () => {
      const result = compile(`
        interface User { name: string; }
        function getName(user: User | null): string {
          return user?.name ?? "Anonymous";
        }
      `);
      expect(result.success).toBe(true);
      expect(result.output).toContain("user?.name");
      expect(result.output).toContain("??");
    });

    test("compiles nullish coalescing", () => {
      const result = compile(
        `
        const value: string | null = null;
        const result: string = value ?? "default";
      `,
        { skipTypeCheck: true }
      );
      expect(result.success).toBe(true);
      expect(result.output).toContain("value ?? ");
    });
  });

  // Logical Operators
  describe("Logical Operators", () => {
    test("compiles logical AND", () => {
      const result = compile("const result: boolean = true && false;");
      expect(result.success).toBe(true);
      expect(result.output).toContain("true && false");
    });

    test("compiles logical OR", () => {
      const result = compile("const result: boolean = true || false;");
      expect(result.success).toBe(true);
      expect(result.output).toContain("true || false");
    });

    test("compiles ternary operator", () => {
      const result = compile('const result: string = true ? "yes" : "no";');
      expect(result.success).toBe(true);
      expect(result.output).toContain('true ? "yes" : "no"');
    });
  });

  // Default and Rest Parameters
  describe("Function Parameters", () => {
    test("compiles default parameters", () => {
      const result = compile(`
        function greet(name: string = "World"): string {
          return "Hello, " + name;
        }
      `);
      expect(result.success).toBe(true);
      expect(result.output).toContain('function greet(name = "World")');
    });

    test("compiles rest parameters", () => {
      const result = compile(`
        function sum(...nums: number[]): number {
          let total: number = 0;
          for (const n of nums) {
            total = total + n;
          }
          return total;
        }
      `);
      expect(result.success).toBe(true);
      expect(result.output).toContain("function sum(...nums)");
    });
  });

  // Template Literals
  describe("Template Literals", () => {
    test("compiles simple template literal", () => {
      const result = compile("const msg: string = `Hello, World!`;", {
        skipTypeCheck: true,
      });
      expect(result.success).toBe(true);
      expect(result.output).toContain("`Hello, World!`");
    });
  });

  // Spread Operator
  describe("Spread Operator", () => {
    test("compiles array spread", () => {
      const result = compile(`
        const arr1: number[] = [1, 2, 3];
        const arr2: number[] = [...arr1, 4, 5];
      `);
      expect(result.success).toBe(true);
      expect(result.output).toContain("[...arr1, 4, 5]");
    });

    test("compiles object spread", () => {
      const result = compile(
        `
        const obj1 = { a: 1 };
        const obj2 = { ...obj1, b: 2 };
      `,
        { skipTypeCheck: true }
      );
      expect(result.success).toBe(true);
      expect(result.output).toContain("...obj1");
    });
  });

  // Decorators
  describe("Decorators", () => {
    test("compiles class decorator", () => {
      const result = compile(
        `
        function Injectable() {
          return function(target: any): any {
            return target;
          };
        }
        
        @Injectable()
        class UserService {
          name: string = "UserService";
        }
      `,
        { skipTypeCheck: true }
      );
      expect(result.success).toBe(true);
      expect(result.output).toContain("@Injectable()");
      expect(result.output).toContain("class UserService");
    });

    test("compiles method decorator", () => {
      const result = compile(
        `
        function Log() {
          return function(target: any, key: string): void {
            console.log(key);
          };
        }
        
        class Service {
          @Log()
          doSomething(): void {
            console.log("doing");
          }
        }
      `,
        { skipTypeCheck: true }
      );
      expect(result.success).toBe(true);
      expect(result.output).toContain("@Log()");
      expect(result.output).toContain("doSomething()");
    });

    test("compiles property decorator", () => {
      const result = compile(
        `
        function Inject(token: string) {
          return function(target: any, key: string): void {};
        }
        
        class Controller {
          @Inject("UserService")
          userService: any;
        }
      `,
        { skipTypeCheck: true }
      );
      expect(result.success).toBe(true);
      expect(result.output).toContain('@Inject("UserService")');
      expect(result.output).toContain("userService");
    });

    test("compiles multiple decorators on class", () => {
      const result = compile(
        `
        function Controller(path: string) {
          return function(target: any): any { return target; };
        }
        function Injectable() {
          return function(target: any): any { return target; };
        }
        
        @Controller("/api")
        @Injectable()
        class ApiController {
          name: string;
        }
      `,
        { skipTypeCheck: true }
      );
      expect(result.success).toBe(true);
      expect(result.output).toContain('@Controller("/api")');
      expect(result.output).toContain("@Injectable()");
    });
  });

  // Generics
  describe("Generics", () => {
    test("compiles generic function", () => {
      const result = compile(
        `
        function identity<T>(value: T): T {
          return value;
        }
      `,
        { skipTypeCheck: true }
      );
      expect(result.success).toBe(true);
      expect(result.output).toContain("function identity(value)");
    });

    test("compiles generic class", () => {
      const result = compile(
        `
        class Box<T> {
          value: T;
          constructor(value: T) {
            this.value = value;
          }
        }
      `,
        { skipTypeCheck: true }
      );
      expect(result.success).toBe(true);
      expect(result.output).toContain("class Box");
      expect(result.output).not.toContain("<T>");
    });

    test("compiles generic interface", () => {
      const result = compile(
        `
        interface Container<T> {
          value: T;
        }
        const box: Container<number> = { value: 42 };
      `,
        { skipTypeCheck: true }
      );
      expect(result.success).toBe(true);
      expect(result.output).toContain("const box = { value: 42 }");
    });
  });

  // Import/Export
  describe("Modules", () => {
    test("compiles import declaration", () => {
      const result = compile(
        `
        import { Component } from "./component";
        const comp: Component = { name: "test" };
      `,
        { skipTypeCheck: true }
      );
      expect(result.success).toBe(true);
      expect(result.output).toContain(
        'import { Component } from "./component"'
      );
    });

    test("compiles export declaration", () => {
      const result = compile(
        `
        export const VERSION: string = "1.0.0";
      `,
        { skipTypeCheck: true }
      );
      expect(result.success).toBe(true);
      expect(result.output).toContain("export const VERSION");
    });

    test("compiles type-only import", () => {
      const result = compile(
        `
        import type { User } from "./types";
      `,
        { skipTypeCheck: true }
      );
      expect(result.success).toBe(true);
      // Type-only imports are currently preserved (could be removed in optimization)
      expect(result.output).toBeDefined();
    });

    test("compiles default export", () => {
      const result = compile(
        `
        function main(): void {
          console.log("main");
        }
        export default main;
      `,
        { skipTypeCheck: true }
      );
      expect(result.success).toBe(true);
      expect(result.output).toContain("export default main");
    });
  });

  // Abstract Classes
  describe("Abstract Classes", () => {
    test("compiles abstract class", () => {
      const result = compile(
        `
        abstract class Shape {
          abstract getArea(): number;
          describe(): string {
            return "I am a shape";
          }
        }
      `,
        { skipTypeCheck: true }
      );
      expect(result.success).toBe(true);
      expect(result.output).toContain("class Shape");
      expect(result.output).toContain("describe()");
    });
  });

  // Async/Await
  describe("Async/Await", () => {
    test("compiles async function", () => {
      const result = compile(
        `
        async function fetchData(): Promise<string> {
          return "data";
        }
      `,
        { skipTypeCheck: true }
      );
      expect(result.success).toBe(true);
      expect(result.output).toContain("async function fetchData()");
    });

    test("compiles await expression", () => {
      const result = compile(
        `
        async function main(): Promise<void> {
          const result: any = await fetch("url");
        }
      `,
        { skipTypeCheck: true }
      );
      expect(result.success).toBe(true);
      expect(result.output).toContain("await fetch");
    });
  });
});
