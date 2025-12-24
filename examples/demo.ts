// Mini-TS Demo: A runnable example

// Function with types
function add(a: number, b: number): number {
  return a + b;
}

function greet(name: string): string {
  return "Hello, " + name;
}

// Variables with types
let x: number = 10;
let y: number = 20;
let sum: number = add(x, y);

// Use console.log (it's a global, type checker allows it)
console.log(greet("Mini-TS"));
console.log("10 + 20 = " + sum);
