// ============================================
// Advanced Decorators Example
// ============================================
// This example demonstrates TypeScript decorators
// for class, method, property, and parameter decoration

// Decorator Factories
function Injectable() {
  return function (target: any): any {
    target.prototype.__injectable = true;
    return target;
  };
}

function Controller(path: string) {
  return function (target: any): any {
    target.prototype.__path = path;
    return target;
  };
}

function Get(route: string) {
  return function (target: any, propertyKey: string, descriptor: any): void {
    target.__routes = target.__routes || [];
    target.__routes.push({ method: "GET", route: route, handler: propertyKey });
  };
}

function Post(route: string) {
  return function (target: any, propertyKey: string, descriptor: any): void {
    target.__routes = target.__routes || [];
    target.__routes.push({
      method: "POST",
      route: route,
      handler: propertyKey,
    });
  };
}

function Inject(token: string) {
  return function (target: any, propertyKey: string): void {
    target.__dependencies = target.__dependencies || {};
    target.__dependencies[propertyKey] = token;
  };
}

// ============================================
// Service Layer with Decorators
// ============================================

@Injectable()
class UserRepository {
  private users: any[] = [];

  findAll(): any[] {
    return this.users;
  }

  findById(id: number): any {
    for (const user of this.users) {
      if (user.id === id) {
        return user;
      }
    }
    return null;
  }

  create(user: any): any {
    this.users.push(user);
    return user;
  }
}

@Injectable()
class UserService {
  @Inject("UserRepository")
  private repository: any;

  getAllUsers(): any[] {
    return this.repository.findAll();
  }

  getUserById(id: number): any {
    return this.repository.findById(id);
  }

  createUser(name: string, email: string): any {
    const id = Date.now();
    const user = { id: id, name: name, email: email };
    return this.repository.create(user);
  }
}

// ============================================
// Controller Layer with Decorators
// ============================================

@Controller("/api/users")
@Injectable()
class UserController {
  @Inject("UserService")
  private userService: any;

  @Get("/")
  getUsers(req: any, res: any): void {
    const users = this.userService.getAllUsers();
    res.json(users);
  }

  @Get("/:id")
  getUser(req: any, res: any): void {
    const id = parseInt(req.params.id);
    const user = this.userService.getUserById(id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  }

  @Post("/")
  createUser(req: any, res: any): void {
    const name: string = req.body.name;
    const email: string = req.body.email;
    const user = this.userService.createUser(name, email);
    res.status(201).json(user);
  }
}

// ============================================
// Application Bootstrap
// ============================================

class Application {
  private controllers: any[] = [];

  registerController(controller: any): void {
    this.controllers.push(controller);
  }

  printRoutes(): void {
    console.log("=== Registered Routes ===");
    for (const ctrl of this.controllers) {
      const basePath = ctrl.prototype.__path || "";
      const routes = ctrl.prototype.__routes || [];
      for (const route of routes) {
        console.log(
          route.method + " " + basePath + route.route + " -> " + route.handler
        );
      }
    }
  }
}

// Bootstrap application
const app = new Application();
app.registerController(UserController);
app.printRoutes();

console.log("Decorators example completed!");
