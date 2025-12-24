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
    target.__routes.push({ method: "GET", route, handler: propertyKey });
  };
}

function Post(route: string) {
  return function (target: any, propertyKey: string, descriptor: any): void {
    target.__routes = target.__routes || [];
    target.__routes.push({ method: "POST", route, handler: propertyKey });
  };
}

function Inject(token: string) {
  return function (target: any, propertyKey: string): void {
    target.__dependencies = target.__dependencies || {};
    target.__dependencies[propertyKey] = token;
  };
}

function Log() {
  return function (target: any, propertyKey: string, descriptor: any): any {
    const original = descriptor.value;
    descriptor.value = function (...args: any[]) {
      console.log(
        "Calling " + propertyKey + " with args: " + JSON.stringify(args)
      );
      const result = original.apply(this, args);
      console.log("Result: " + JSON.stringify(result));
      return result;
    };
    return descriptor;
  };
}

function Validate() {
  return function (target: any, propertyKey: string, descriptor: any): any {
    const original = descriptor.value;
    descriptor.value = function (...args: any[]) {
      for (const arg of args) {
        if (arg === null || arg === undefined) {
          throw new Error("Validation failed: null or undefined argument");
        }
      }
      return original.apply(this, args);
    };
    return descriptor;
  };
}

// ============================================
// Service Layer with Decorators
// ============================================

interface User {
  id: number;
  name: string;
  email: string;
}

@Injectable()
class UserRepository {
  private users: User[] = [];

  findAll(): User[] {
    return this.users;
  }

  findById(id: number): User | null {
    for (const user of this.users) {
      if (user.id === id) {
        return user;
      }
    }
    return null;
  }

  create(user: User): User {
    this.users.push(user);
    return user;
  }

  delete(id: number): boolean {
    const index = this.users.findIndex((u: User) => u.id === id);
    if (index >= 0) {
      this.users.splice(index, 1);
      return true;
    }
    return false;
  }
}

@Injectable()
class UserService {
  @Inject("UserRepository")
  private repository: UserRepository;

  @Log()
  @Validate()
  getAllUsers(): User[] {
    return this.repository.findAll();
  }

  @Log()
  getUserById(id: number): User | null {
    return this.repository.findById(id);
  }

  @Log()
  @Validate()
  createUser(name: string, email: string): User {
    const id = Date.now();
    const user: User = { id, name, email };
    return this.repository.create(user);
  }
}

// ============================================
// Controller Layer with Decorators
// ============================================

interface Request {
  params: Record<string, string>;
  body: any;
}

interface Response {
  json: (data: any) => void;
  status: (code: number) => Response;
}

@Controller("/api/users")
@Injectable()
class UserController {
  @Inject("UserService")
  private userService: UserService;

  @Get("/")
  getUsers(req: Request, res: Response): void {
    const users = this.userService.getAllUsers();
    res.json(users);
  }

  @Get("/:id")
  getUser(req: Request, res: Response): void {
    const id = parseInt(req.params.id);
    const user = this.userService.getUserById(id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  }

  @Post("/")
  @Validate()
  createUser(req: Request, res: Response): void {
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
