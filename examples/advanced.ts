// Mini-TS Advanced Example: Testing TypeScript 5.0 Features

// =====================
// Type Aliases
// =====================
type ID = number;
type Name = string;

// =====================
// Interfaces
// =====================
interface User {
  id: ID;
  name: Name;
  email?: string;
}

// =====================
// Classes with Inheritance
// =====================
class Animal {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  speak(): string {
    return "Some sound";
  }
}

class Dog extends Animal {
  breed: string;

  constructor(name: string, breed: string) {
    super(name);
    this.breed = breed;
  }

  speak(): string {
    return "Woof!";
  }

  fetch(): string {
    return this.name + " is fetching!";
  }
}

// =====================
// Enums
// =====================
enum Color {
  Red,
  Green,
  Blue,
}

enum HttpStatus {
  OK = 200,
  NotFound = 404,
  ServerError = 500,
}

// =====================
// Arrow Functions
// =====================
const add = (a: number, b: number): number => a + b;
const greet = (name: string): string => {
  return "Hello, " + name + "!";
};

const multiply = (x: number, y: number): number => x * y;

// =====================
// Array Types
// =====================
const numbers: number[] = [1, 2, 3, 4, 5];
const names: string[] = ["Alice", "Bob", "Charlie"];

// =====================
// Union Types
// =====================
let value: string | number = "hello";
value = 42;

// =====================
// Optional Chaining and Nullish Coalescing
// =====================
function getUserName(user: User | null): string {
  return user?.name ?? "Anonymous";
}

// =====================
// Logical Operators
// =====================
function isValidUser(user: User): boolean {
  return user.id > 0 && user.name.length > 0;
}

// =====================
// Ternary Operator
// =====================
function abs(n: number): number {
  return n >= 0 ? n : -n;
}

// =====================
// For...of Loop
// =====================
function sumNumbers(nums: number[]): number {
  let sum: number = 0;
  for (const n of nums) {
    sum = sum + n;
  }
  return sum;
}

// =====================
// While Loop
// =====================
function countdown(n: number): void {
  while (n > 0) {
    console.log(n);
    n = n - 1;
  }
}

// =====================
// Try/Catch
// =====================
function safeParse(json: string): any {
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

// =====================
// Switch Statement
// =====================
function getColorName(color: Color): string {
  switch (color) {
    case Color.Red:
      return "Red";
    case Color.Green:
      return "Green";
    case Color.Blue:
      return "Blue";
    default:
      return "Unknown";
  }
}

// =====================
// Default Parameters
// =====================
function greetWithDefault(name: string = "World"): string {
  return "Hello, " + name + "!";
}

// =====================
// Rest Parameters (spread)
// =====================
function logAll(...args: any[]): void {
  for (const arg of args) {
    console.log(arg);
  }
}

// =====================
// Test execution
// =====================
const dog = new Dog("Buddy", "Golden Retriever");
console.log(dog.speak());
console.log(dog.fetch());

console.log("Sum:", sumNumbers(numbers));
console.log("Greet:", greet("World"));
console.log("Add:", add(10, 20));
console.log("Multiply:", multiply(3, 7));
console.log("Abs:", abs(-42));

const user: User = { id: 1, name: "Alice" };
console.log("User valid:", isValidUser(user));
console.log("User name:", getUserName(user));
console.log("Anonymous:", getUserName(null));

console.log("Color:", getColorName(Color.Blue));
console.log("Default greeting:", greetWithDefault());
