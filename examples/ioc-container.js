class Container {
  static instance;
  services = {};
  factories = {};
  static getInstance() {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }
  register(token, factory) {
    this.factories[token] = factory;
  }
  registerClass(token, cls, deps) {
    const self = this;
    this.factories[token] = function() { const d0 = deps.length > 0 ? self.resolve(deps[0]) : undefined; const d1 = deps.length > 1 ? self.resolve(deps[1]) : undefined; const d2 = deps.length > 2 ? self.resolve(deps[2]) : undefined; if (deps.length === 0) { return new cls(); } else if (deps.length === 1) { return new cls(d0); } else if (deps.length === 2) { return new cls(d0, d1); } else { return new cls(d0, d1, d2); } };
  }
  resolve(token) {
    if (this.services[token]) {
      return this.services[token];
    }
    const factory = this.factories[token];
    if (!factory) {
      throw new Error("No provider for " + token);
    }
    const instance = factory();
    this.services[token] = instance;
    return instance;
  }
  clear() {
    this.services = {};
    this.factories = {};
  }
}
class UserRepository {
  users = [];
  nextId = 1;
  findAll() {
    return this.users;
  }
  findById(id) {
    for (const user of this.users) {
      if (user.id === id) {
        return user;
      }
    }
    return null;
  }
  create(name, email) {
    const user = { id: this.nextId, name: name, email: email };
    this.nextId = this.nextId + 1;
    this.users.push(user);
    return user;
  }
  deleteById(id) {
    const initialLength = this.users.length;
    const filtered = [];
    for (const user of this.users) {
      if (user.id !== id) {
        filtered.push(user);
      }
    }
    this.users = filtered;
    return this.users.length < initialLength;
  }
}
class UserService {
  userRepo;
  constructor(userRepo) {
    this.userRepo = userRepo;
  }
  getAllUsers() {
    console.log("[UserService] Getting all users");
    return this.userRepo.findAll();
  }
  getUserById(id) {
    console.log("[UserService] Getting user by id: " + id);
    return this.userRepo.findById(id);
  }
  createUser(name, email) {
    console.log("[UserService] Creating user: " + name);
    return this.userRepo.create(name, email);
  }
  deleteUser(id) {
    console.log("[UserService] Deleting user: " + id);
    return this.userRepo.deleteById(id);
  }
}
class UserController {
  userService;
  basePath = "/api/users";
  routes = [];
  constructor(userService) {
    this.userService = userService;
    this.setupRoutes();
  }
  setupRoutes() {
    this.routes.push({ method: "GET", route: "/", handler: "list" });
    this.routes.push({ method: "GET", route: "/:id", handler: "getOne" });
    this.routes.push({ method: "POST", route: "/", handler: "create" });
    this.routes.push({ method: "DELETE", route: "/:id", handler: "deleteOne" });
  }
  list(req, res) {
    const users = this.userService.getAllUsers();
    res.json(users);
  }
  getOne(req, res) {
    const id = parseInt(req.params.id);
    const user = this.userService.getUserById(id);
    if (user) {
      res.json(user);
    } else {
      res.setStatus(404).json({ error: "User not found" });
    }
  }
  create(req, res) {
    const user = this.userService.createUser(req.body.name, req.body.email);
    res.setStatus(201).json(user);
  }
  deleteOne(req, res) {
    const id = parseInt(req.params.id);
    const deleted = this.userService.deleteUser(id);
    if (deleted) {
      res.json({ message: "User deleted" });
    } else {
      res.setStatus(404).json({ error: "User not found" });
    }
  }
}
class NestApplication {
  controllers = [];
  registerController(controller) {
    this.controllers.push({ instance: controller, path: controller.basePath, routes: controller.routes });
  }
  printRoutes() {
    console.log("\n=== Registered Routes ===");
    for (const ctrl of this.controllers) {
      for (const route of ctrl.routes) {
        console.log(route.method + " " + ctrl.path + route.route + " -> " + route.handler);
      }
    }
    console.log("");
  }
  handleRequest(method, path, body) {
    for (const ctrl of this.controllers) {
      for (const route of ctrl.routes) {
        if (route.method === method) {
          const fullPath = ctrl.path + route.route;
          const match = this.matchPath(fullPath, path);
          if (match) {
            const req = { params: match.params, body: body };
            let responseData = null;
            let statusCode = 200;
            const res = { json: function(data) { responseData = data; }, setStatus: function(code) { statusCode = code; return res; } };
            const handler = ctrl.instance[route.handler];
            handler.call(ctrl.instance, req, res);
            return { statusCode: statusCode, data: responseData };
          }
        }
      }
    }
    return { statusCode: 404, data: { error: "Not Found" } };
  }
  matchPath(pattern, path) {
    const patternParts = pattern.split("/");
    const pathParts = path.split("/");
    if (patternParts.length !== pathParts.length) {
      return null;
    }
    const params = {};
    for (let i = 0; i < patternParts.length; i = i + 1) {
      const patt = patternParts[i];
      const pathPart = pathParts[i];
      if (patt.startsWith(":")) {
        const paramName = patt.substring(1);
        params[paramName] = pathPart;} else       if (patt !== pathPart) {
        return null;
      }
    }
    return { params: params };
  }
}
console.log("=== NestJS-style IoC Container Demo ===\n");
const container = Container.getInstance();
container.registerClass("UserRepository", UserRepository, []);
container.registerClass("UserService", UserService, ["UserRepository"]);
container.registerClass("UserController", UserController, ["UserService"]);
const userController = container.resolve("UserController");
const app = new NestApplication();
app.registerController(userController);
app.printRoutes();
console.log("--- Creating users ---");
let response = app.handleRequest("POST", "/api/users/", { name: "Alice", email: "alice@example.com" });
console.log("Response:", response.statusCode, JSON.stringify(response.data));
response = app.handleRequest("POST", "/api/users/", { name: "Bob", email: "bob@example.com" });
console.log("Response:", response.statusCode, JSON.stringify(response.data));
response = app.handleRequest("POST", "/api/users/", { name: "Charlie", email: "charlie@example.com" });
console.log("Response:", response.statusCode, JSON.stringify(response.data));
console.log("\n--- Getting all users ---");
response = app.handleRequest("GET", "/api/users/", null);
console.log("Response:", response.statusCode, JSON.stringify(response.data));
console.log("\n--- Getting user by ID ---");
response = app.handleRequest("GET", "/api/users/2", null);
console.log("Response:", response.statusCode, JSON.stringify(response.data));
console.log("\n--- Getting non-existent user ---");
response = app.handleRequest("GET", "/api/users/999", null);
console.log("Response:", response.statusCode, JSON.stringify(response.data));
console.log("\n--- Deleting user ---");
response = app.handleRequest("DELETE", "/api/users/2", null);
console.log("Response:", response.statusCode, JSON.stringify(response.data));
console.log("\n--- Getting all users after delete ---");
response = app.handleRequest("GET", "/api/users/", null);
console.log("Response:", response.statusCode, JSON.stringify(response.data));
console.log("\n=== IoC Container Demo Completed Successfully ===");
