/**
 * Mini-TS Showcase - TypeScript 5.0 Features Demo
 * 展示 Mini-TS 编译器支持的主要特性
 */

// ===========================
// 1. 类型别名 (Type Aliases)
// ===========================
type ID = number;
type StringOrNumber = string | number;

// ===========================
// 2. 接口 (Interfaces)
// ===========================
interface Point {
  x: number;
  y: number;
}

interface Named {
  name: string;
}

// ===========================
// 3. 类与继承 (Classes)
// ===========================
class Shape {
  color: string;

  constructor(color: string) {
    this.color = color;
  }

  describe(): string {
    return "A " + this.color + " shape";
  }
}

class Circle extends Shape {
  radius: number;

  constructor(color: string, radius: number) {
    super(color);
    this.radius = radius;
  }

  area(): number {
    return 3.14159 * this.radius * this.radius;
  }

  describe(): string {
    return "A " + this.color + " circle with radius " + this.radius;
  }
}

// ===========================
// 4. 枚举 (Enums)
// ===========================
enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3
}

enum Status {
  Active = "ACTIVE",
  Inactive = "INACTIVE"
}

// ===========================
// 5. 箭头函数 (Arrow Functions)
// ===========================
const add = (a: number, b: number): number => a + b;
const multiply = (x: number, y: number): number => x * y;
const greet = (name: string): string => {
  return "Hello, " + name + "!";
};

// ===========================
// 6. 数组和循环
// ===========================
function sum(numbers: number[]): number {
  let total: number = 0;
  for (const n of numbers) {
    total = total + n;
  }
  return total;
}

function filterPositive(numbers: number[]): number[] {
  const result: number[] = [];
  for (const n of numbers) {
    if (n > 0) {
      result.push(n);
    }
  }
  return result;
}

// ===========================
// 7. 可选参数和默认参数
// ===========================
function greetUser(name: string, greeting: string = "Hello"): string {
  return greeting + ", " + name + "!";
}

// ===========================
// 8. 剩余参数 (Rest Parameters)
// ===========================
function joinStrings(...strings: string[]): string {
  let result: string = "";
  for (const s of strings) {
    result = result + s;
  }
  return result;
}

// ===========================
// 9. 可选链和空值合并
// ===========================
interface User {
  id: ID;
  name: string;
  email?: string;
}

function getUserEmail(user: User | null): string {
  return user?.email ?? "no-email@example.com";
}

// ===========================
// 10. 逻辑运算符
// ===========================
function isValidNumber(value: number): boolean {
  return value > 0 && value < 100;
}

function getDefault(value: string | null): string | null {
  return value ?? "default";
}

// ===========================
// 11. Switch 语句
// ===========================
function getLogLevelName(level: LogLevel): string {
  switch (level) {
    case LogLevel.Debug:
      return "DEBUG";
    case LogLevel.Info:
      return "INFO";
    case LogLevel.Warn:
      return "WARN";
    case LogLevel.Error:
      return "ERROR";
    default:
      return "UNKNOWN";
  }
}

// ===========================
// 12. Try/Catch
// ===========================
function safeDivide(a: number, b: number): number {
  try {
    if (b === 0) {
      throw "Division by zero";
    }
    return a / b;
  } catch (e) {
    console.log("Error:", e);
    return 0;
  }
}

// ===========================
// 13. While 循环
// ===========================
function factorial(n: number): number {
  let result: number = 1;
  let i: number = n;
  while (i > 1) {
    result = result * i;
    i = i - 1;
  }
  return result;
}

// ===========================
// 14. 三元运算符
// ===========================
function abs(n: number): number {
  return n >= 0 ? n : -n;
}

function max(a: number, b: number): number {
  return a > b ? a : b;
}

// ===========================
// 测试运行
// ===========================
console.log("=== Mini-TS Showcase ===\n");

// Classes
const circle = new Circle("red", 5);
console.log("Circle:", circle.describe());
console.log("Area:", circle.area());

// Enums
console.log("\nLog Level:", getLogLevelName(LogLevel.Info));
console.log("Status:", Status.Active);

// Arrow Functions
console.log("\nArrow Functions:");
console.log("add(2, 3) =", add(2, 3));
console.log("multiply(4, 5) =", multiply(4, 5));
console.log("greet('World') =", greet("World"));

// Arrays
const numbers: number[] = [1, 2, 3, 4, 5];
console.log("\nArrays:");
console.log("sum([1,2,3,4,5]) =", sum(numbers));
console.log("filterPositive([-1,2,-3,4]) =", filterPositive([-1, 2, -3, 4]));

// Default Parameters
console.log("\nDefault Parameters:");
console.log("greetUser('Alice') =", greetUser("Alice"));
console.log("greetUser('Bob', 'Hi') =", greetUser("Bob", "Hi"));

// Rest Parameters
console.log("\nRest Parameters:");
console.log("joinStrings('a', 'b', 'c') =", joinStrings("a", "b", "c"));

// Optional Chaining
console.log("\nOptional Chaining:");
const user1: User = { id: 1, name: "Alice", email: "alice@example.com" };
const user2: User = { id: 2, name: "Bob" };
console.log("User1 email:", getUserEmail(user1));
console.log("User2 email:", getUserEmail(user2));
console.log("Null user email:", getUserEmail(null));

// Math Operations
console.log("\nMath:");
console.log("abs(-42) =", abs(-42));
console.log("max(10, 20) =", max(10, 20));
console.log("factorial(5) =", factorial(5));

// Error Handling
console.log("\nError Handling:");
console.log("safeDivide(10, 2) =", safeDivide(10, 2));
console.log("safeDivide(10, 0) =", safeDivide(10, 0));

console.log("\n=== Showcase Complete ===");

