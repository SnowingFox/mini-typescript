function Injectable() {
  return function(target) { target.prototype.__injectable = true; return target; };
}
function Controller(path) {
  return function(target) { target.prototype.__path = path; return target; };
}
function Get(route) {
  return function(target, propertyKey, descriptor) { target.__routes = target.__routes || []; target.__routes.push({ method: "GET", route: route, handler: propertyKey }); };
}
function Post(route) {
  return function(target, propertyKey, descriptor) { target.__routes = target.__routes || []; target.__routes.push({ method: "POST", route: route, handler: propertyKey }); };
}
function Inject(token) {
  return function(target, propertyKey) { target.__dependencies = target.__dependencies || {}; target.__dependencies[propertyKey] = token; };
}
class UserRepository {
  users = [];
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
  create(user) {
    this.users.push(user);
    return user;
  }
}
class UserService {
  repository;
  getAllUsers() {
    return this.repository.findAll();
  }
  getUserById(id) {
    return this.repository.findById(id);
  }
  createUser(name, email) {
    const id = Date.now();
    const user = { id: id, name: name, email: email };
    return this.repository.create(user);
  }
}
class UserController {
  userService;
  getUsers(req, res) {
    const users = this.userService.getAllUsers();
    res.json(users);
  }
  getUser(req, res) {
    const id = parseInt(req.params.id);
    const user = this.userService.getUserById(id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  }
  createUser(req, res) {
    const name = req.body.name;
    const email = req.body.email;
    const user = this.userService.createUser(name, email);
    res.status(201).json(user);
  }
}
class Application {
  controllers = [];
  registerController(controller) {
    this.controllers.push(controller);
  }
  printRoutes() {
    console.log("=== Registered Routes ===");
    for (const ctrl of this.controllers) {
      const basePath = ctrl.prototype.__path || "";
      const routes = ctrl.prototype.__routes || [];
      for (const route of routes) {
        console.log(route.method + " " + basePath + route.route + " -> " + route.handler);
      }
    }
  }
}
const app = new Application();
app.registerController(UserController);
app.printRoutes();
console.log("Decorators example completed!");
