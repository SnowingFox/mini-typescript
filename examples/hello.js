// interface Person removed
function greet(name) {
  return "Hello, " + name;
}
function createPerson(name, age) {
  return { name: name, age: age };
}
let message = greet("World");
const pi = 3.14159;
let alice = createPerson("Alice", 30);
let a = 10;
let b = 5;
let sum = a + b;
function abs(x) {
  if (x >= 0) {
    return x;
  } else {
    return -x;
  }
}
let result = abs(-42);
