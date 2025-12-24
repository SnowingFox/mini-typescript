// type ID removed
// type StringOrNumber removed
// interface Point removed
// interface Named removed
class Shape {
  color;
  constructor(color) {
    this.color = color;
  }
  describe() {
    return "A " + this.color + " shape";
  }
}
class Circle extends Shape {
  radius;
  constructor(color, radius) {
    super(color);
    this.radius = radius;
  }
  area() {
    return 3.14159 * this.radius * this.radius;
  }
  describe() {
    return "A " + this.color + " circle with radius " + this.radius;
  }
}
var LogLevel;
(function (LogLevel) {
  LogLevel[LogLevel["Debug"] = 0] = "Debug";
  LogLevel[LogLevel["Info"] = 1] = "Info";
  LogLevel[LogLevel["Warn"] = 2] = "Warn";
  LogLevel[LogLevel["Error"] = 3] = "Error";
})(LogLevel || (LogLevel = {}));
var Status;
(function (Status) {
  Status["Active"] = "ACTIVE";
  Status["Inactive"] = "INACTIVE";
})(Status || (Status = {}));
const add = (a, b) => a + b;
const multiply = (x, y) => x * y;
const greet = (name) => { return "Hello, " + name + "!"; };
function sum(numbers) {
  let total = 0;
  for (const n of numbers) {
    total = total + n;
  }
  return total;
}
function filterPositive(numbers) {
  const result = [];
  for (const n of numbers) {
    if (n > 0) {
      result.push(n);
    }
  }
  return result;
}
function greetUser(name, greeting = "Hello") {
  return greeting + ", " + name + "!";
}
function joinStrings(...strings) {
  let result = "";
  for (const s of strings) {
    result = result + s;
  }
  return result;
}
// interface User removed
function getUserEmail(user) {
  return user?.email ?? "no-email@example.com";
}
function isValidNumber(value) {
  return value > 0 && value < 100;
}
function getDefault(value) {
  return value ?? "default";
}
function getLogLevelName(level) {
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
function safeDivide(a, b) {
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
function factorial(n) {
  let result = 1;
  let i = n;
  while (i > 1) {
    result = result * i;
    i = i - 1;
  }
  return result;
}
function abs(n) {
  return n >= 0 ? n : -n;
}
function max(a, b) {
  return a > b ? a : b;
}
console.log("=== Mini-TS Showcase ===\n");
const circle = new Circle("red", 5);
console.log("Circle:", circle.describe());
console.log("Area:", circle.area());
console.log("\nLog Level:", getLogLevelName(LogLevel.Info));
console.log("Status:", Status.Active);
console.log("\nArrow Functions:");
console.log("add(2, 3) =", add(2, 3));
console.log("multiply(4, 5) =", multiply(4, 5));
console.log("greet('World') =", greet("World"));
const numbers = [1, 2, 3, 4, 5];
console.log("\nArrays:");
console.log("sum([1,2,3,4,5]) =", sum(numbers));
console.log("filterPositive([-1,2,-3,4]) =", filterPositive([-1, 2, -3, 4]));
console.log("\nDefault Parameters:");
console.log("greetUser('Alice') =", greetUser("Alice"));
console.log("greetUser('Bob', 'Hi') =", greetUser("Bob", "Hi"));
console.log("\nRest Parameters:");
console.log("joinStrings('a', 'b', 'c') =", joinStrings("a", "b", "c"));
console.log("\nOptional Chaining:");
const user1 = { id: 1, name: "Alice", email: "alice@example.com" };
const user2 = { id: 2, name: "Bob" };
console.log("User1 email:", getUserEmail(user1));
console.log("User2 email:", getUserEmail(user2));
console.log("Null user email:", getUserEmail(null));
console.log("\nMath:");
console.log("abs(-42) =", abs(-42));
console.log("max(10, 20) =", max(10, 20));
console.log("factorial(5) =", factorial(5));
console.log("\nError Handling:");
console.log("safeDivide(10, 2) =", safeDivide(10, 2));
console.log("safeDivide(10, 0) =", safeDivide(10, 0));
console.log("\n=== Showcase Complete ===");
