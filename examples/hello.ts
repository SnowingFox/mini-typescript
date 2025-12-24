// Mini-TS Example: Hello World

// Interface declaration (will be erased)
interface Person {
  name: string;
  age: number;
}

// Function with typed parameters and return type
function greet(name: string): string {
  return "Hello, " + name;
}

// Function with multiple parameters
function createPerson(name: string, age: number): Person {
  return { name: name, age: age };
}

// Variable declarations with types
let message: string = greet("World");
const pi: number = 3.14159;

// Using interface type
let alice: Person = createPerson("Alice", 30);

// Arithmetic operations
let a: number = 10;
let b: number = 5;
let sum: number = a + b;

// Conditional statement
function abs(x: number): number {
  if (x >= 0) {
    return x;
  } else {
    return -x;
  }
}

// Function call
let result: number = abs(-42);
