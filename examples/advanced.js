// type ID removed
// type Name removed
// interface User removed
class Animal {
  name;
  constructor(name) {
    this.name = name;
  }
  speak() {
    return "Some sound";
  }
}
class Dog extends Animal {
  breed;
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }
  speak() {
    return "Woof!";
  }
  fetch() {
    return this.name + " is fetching!";
  }
}
var Color;
(function (Color) {
  Color[Color["Red"] = 0] = "Red";
  Color[Color["Green"] = 1] = "Green";
  Color[Color["Blue"] = 2] = "Blue";
})(Color || (Color = {}));
var HttpStatus;
(function (HttpStatus) {
  HttpStatus[HttpStatus["OK"] = 200] = "OK";
  HttpStatus[HttpStatus["NotFound"] = 404] = "NotFound";
  HttpStatus[HttpStatus["ServerError"] = 500] = "ServerError";
})(HttpStatus || (HttpStatus = {}));
const add = (a, b) => a + b;
const greet = (name) => { return "Hello, " + name + "!"; };
const multiply = (x, y) => x * y;
const numbers = [1, 2, 3, 4, 5];
const names = ["Alice", "Bob", "Charlie"];
let value = "hello";
value = 42;
function getUserName(user) {
  return user?.name ?? "Anonymous";
}
function isValidUser(user) {
  return user.id > 0 && user.name.length > 0;
}
function abs(n) {
  return n >= 0 ? n : -n;
}
function sumNumbers(nums) {
  let sum = 0;
  for (const n of nums) {
    sum = sum + n;
  }
  return sum;
}
function countdown(n) {
  while (n > 0) {
    console.log(n);
    n = n - 1;
  }
}
function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}
function getColorName(color) {
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
function greetWithDefault(name = "World") {
  return "Hello, " + name + "!";
}
function logAll(...args) {
  for (const arg of args) {
    console.log(arg);
  }
}
const dog = new Dog("Buddy", "Golden Retriever");
console.log(dog.speak());
console.log(dog.fetch());
console.log("Sum:", sumNumbers(numbers));
console.log("Greet:", greet("World"));
console.log("Add:", add(10, 20));
console.log("Multiply:", multiply(3, 7));
console.log("Abs:", abs(-42));
const user = { id: 1, name: "Alice" };
console.log("User valid:", isValidUser(user));
console.log("User name:", getUserName(user));
console.log("Anonymous:", getUserName(null));
console.log("Color:", getColorName(Color.Blue));
console.log("Default greeting:", greetWithDefault());
