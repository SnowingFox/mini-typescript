// ============================================
// Token Types (词法分析)
// ============================================

export enum TokenType {
  // Keywords
  Let = "Let",
  Const = "Const",
  Var = "Var",
  Function = "Function",
  Interface = "Interface",
  Type = "Type",
  Return = "Return",
  If = "If",
  Else = "Else",
  While = "While",
  For = "For",
  Do = "Do",
  Break = "Break",
  Continue = "Continue",
  Switch = "Switch",
  Case = "Case",
  Default = "Default",
  Throw = "Throw",
  Try = "Try",
  Catch = "Catch",
  Finally = "Finally",
  New = "New",
  This = "This",
  Class = "Class",
  Extends = "Extends",
  Implements = "Implements",
  Public = "Public",
  Private = "Private",
  Protected = "Protected",
  Static = "Static",
  Readonly = "Readonly",
  Abstract = "Abstract",
  Get = "Get",
  Set = "Set",
  Constructor = "Constructor",
  Super = "Super",
  Import = "Import",
  Export = "Export",
  From = "From",
  As = "As",
  Async = "Async",
  Await = "Await",
  Yield = "Yield",
  Enum = "Enum",
  Namespace = "Namespace",
  Module = "Module",
  Declare = "Declare",
  Typeof = "Typeof",
  Keyof = "Keyof",
  Infer = "Infer",
  In = "In",
  Of = "Of",
  Instanceof = "Instanceof",
  Delete = "Delete",

  // Type Keywords
  NumberType = "NumberType",
  StringType = "StringType",
  BooleanType = "BooleanType",
  Void = "Void",
  Null = "Null",
  Undefined = "Undefined",
  Any = "Any",
  Unknown = "Unknown",
  Never = "Never",
  Object = "Object",
  Symbol = "Symbol",
  Bigint = "Bigint",

  // Literals
  Identifier = "Identifier",
  NumberLiteral = "NumberLiteral",
  StringLiteral = "StringLiteral",
  TemplateLiteral = "TemplateLiteral",
  TemplateHead = "TemplateHead",
  TemplateMiddle = "TemplateMiddle",
  TemplateTail = "TemplateTail",
  RegexLiteral = "RegexLiteral",
  True = "True",
  False = "False",

  // Operators
  Plus = "Plus", // +
  Minus = "Minus", // -
  Star = "Star", // *
  Slash = "Slash", // /
  Percent = "Percent", // %
  StarStar = "StarStar", // **
  PlusPlus = "PlusPlus", // ++
  MinusMinus = "MinusMinus", // --
  Equals = "Equals", // =
  PlusEquals = "PlusEquals", // +=
  MinusEquals = "MinusEquals", // -=
  StarEquals = "StarEquals", // *=
  SlashEquals = "SlashEquals", // /=
  PercentEquals = "PercentEquals", // %=
  EqualsEquals = "EqualsEquals", // ==
  EqualsEqualsEquals = "EqualsEqualsEquals", // ===
  BangEquals = "BangEquals", // !=
  BangEqualsEquals = "BangEqualsEquals", // !==
  LessThan = "LessThan", // <
  GreaterThan = "GreaterThan", // >
  LessThanEquals = "LessThanEquals", // <=
  GreaterThanEquals = "GreaterThanEquals", // >=
  Bang = "Bang", // !
  Ampersand = "Ampersand", // &
  AmpersandAmpersand = "AmpersandAmpersand", // &&
  Pipe = "Pipe", // |
  PipePipe = "PipePipe", // ||
  Caret = "Caret", // ^
  Tilde = "Tilde", // ~
  LessThanLessThan = "LessThanLessThan", // <<
  GreaterThanGreaterThan = "GreaterThanGreaterThan", // >>
  GreaterThanGreaterThanGreaterThan = "GreaterThanGreaterThanGreaterThan", // >>>
  Question = "Question", // ?
  QuestionDot = "QuestionDot", // ?.
  QuestionQuestion = "QuestionQuestion", // ??
  Arrow = "Arrow", // =>
  Spread = "Spread", // ...

  // Punctuation
  LeftParen = "LeftParen", // (
  RightParen = "RightParen", // )
  LeftBrace = "LeftBrace", // {
  RightBrace = "RightBrace", // }
  LeftBracket = "LeftBracket", // [
  RightBracket = "RightBracket", // ]
  Colon = "Colon", // :
  Semicolon = "Semicolon", // ;
  Comma = "Comma", // ,
  Dot = "Dot", // .
  At = "At", // @

  // Special
  EOF = "EOF",
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

// ============================================
// AST Node Types (语法分析)
// ============================================

export type ASTNode = Program | Statement | Expression | TypeNode;

export interface Program {
  kind: "Program";
  statements: Statement[];
}

// ============================================
// Statements
// ============================================

export type Statement =
  | VariableDeclaration
  | FunctionDeclaration
  | InterfaceDeclaration
  | TypeAliasDeclaration
  | ClassDeclaration
  | EnumDeclaration
  | ReturnStatement
  | IfStatement
  | WhileStatement
  | ForStatement
  | ForOfStatement
  | ForInStatement
  | DoWhileStatement
  | SwitchStatement
  | BreakStatement
  | ContinueStatement
  | ThrowStatement
  | TryStatement
  | ExpressionStatement
  | BlockStatement
  | ImportDeclaration
  | ExportDeclaration
  | EmptyStatement;

export interface VariableDeclaration {
  kind: "VariableDeclaration";
  name: string;
  varKind: "let" | "const" | "var";
  typeAnnotation?: TypeNode;
  initializer?: Expression;
  line: number;
}

export interface FunctionDeclaration {
  kind: "FunctionDeclaration";
  name: string;
  parameters: Parameter[];
  returnType?: TypeNode;
  body: BlockStatement;
  isAsync?: boolean;
  isGenerator?: boolean;
  typeParameters?: TypeParameterDeclaration[];
  line: number;
}

export interface Parameter {
  name: string;
  typeAnnotation?: TypeNode;
  optional?: boolean;
  defaultValue?: Expression;
  rest?: boolean;
}

export interface InterfaceDeclaration {
  kind: "InterfaceDeclaration";
  name: string;
  members: InterfaceMember[];
  extends?: TypeNode[];
  typeParameters?: TypeParameterDeclaration[];
  line: number;
}

export interface InterfaceMember {
  name: string;
  typeAnnotation: TypeNode;
  optional?: boolean;
  readonly?: boolean;
}

export interface TypeAliasDeclaration {
  kind: "TypeAliasDeclaration";
  name: string;
  typeParameters?: TypeParameterDeclaration[];
  type: TypeNode;
  line: number;
}

// Decorator
export interface Decorator {
  kind: "Decorator";
  expression: Expression;
  line: number;
}

export interface ClassDeclaration {
  kind: "ClassDeclaration";
  name: string;
  superClass?: Expression;
  implements?: TypeNode[];
  typeParameters?: TypeParameterDeclaration[];
  members: ClassMember[];
  decorators?: Decorator[];
  isAbstract?: boolean;
  line: number;
}

export type ClassMember =
  | PropertyDeclaration
  | MethodDeclaration
  | ConstructorDeclaration
  | GetterDeclaration
  | SetterDeclaration;

export interface PropertyDeclaration {
  kind: "PropertyDeclaration";
  name: string;
  typeAnnotation?: TypeNode;
  initializer?: Expression;
  accessibility?: "public" | "private" | "protected";
  isStatic?: boolean;
  isReadonly?: boolean;
  isAbstract?: boolean;
  decorators?: Decorator[];
  line: number;
}

export interface MethodDeclaration {
  kind: "MethodDeclaration";
  name: string;
  parameters: Parameter[];
  returnType?: TypeNode;
  body?: BlockStatement;
  accessibility?: "public" | "private" | "protected";
  isStatic?: boolean;
  isAbstract?: boolean;
  isAsync?: boolean;
  typeParameters?: TypeParameterDeclaration[];
  decorators?: Decorator[];
  line: number;
}

export interface ConstructorDeclaration {
  kind: "ConstructorDeclaration";
  parameters: Parameter[];
  body: BlockStatement;
  accessibility?: "public" | "private" | "protected";
  line: number;
}

export interface GetterDeclaration {
  kind: "GetterDeclaration";
  name: string;
  returnType?: TypeNode;
  body: BlockStatement;
  accessibility?: "public" | "private" | "protected";
  isStatic?: boolean;
  line: number;
}

export interface SetterDeclaration {
  kind: "SetterDeclaration";
  name: string;
  parameter: Parameter;
  body: BlockStatement;
  accessibility?: "public" | "private" | "protected";
  isStatic?: boolean;
  line: number;
}

export interface EnumDeclaration {
  kind: "EnumDeclaration";
  name: string;
  members: EnumMember[];
  isConst?: boolean;
  line: number;
}

export interface EnumMember {
  name: string;
  initializer?: Expression;
}

export interface ReturnStatement {
  kind: "ReturnStatement";
  argument?: Expression;
  line: number;
}

export interface IfStatement {
  kind: "IfStatement";
  condition: Expression;
  consequent: Statement;
  alternate?: Statement;
  line: number;
}

export interface WhileStatement {
  kind: "WhileStatement";
  condition: Expression;
  body: Statement;
  line: number;
}

export interface ForStatement {
  kind: "ForStatement";
  init?: VariableDeclaration | Expression;
  condition?: Expression;
  update?: Expression;
  body: Statement;
  line: number;
}

export interface ForOfStatement {
  kind: "ForOfStatement";
  variable: VariableDeclaration | Identifier;
  iterable: Expression;
  body: Statement;
  isAwait?: boolean;
  line: number;
}

export interface ForInStatement {
  kind: "ForInStatement";
  variable: VariableDeclaration | Identifier;
  object: Expression;
  body: Statement;
  line: number;
}

export interface DoWhileStatement {
  kind: "DoWhileStatement";
  body: Statement;
  condition: Expression;
  line: number;
}

export interface SwitchStatement {
  kind: "SwitchStatement";
  discriminant: Expression;
  cases: SwitchCase[];
  line: number;
}

export interface SwitchCase {
  test?: Expression; // null for default
  consequent: Statement[];
}

export interface BreakStatement {
  kind: "BreakStatement";
  label?: string;
  line: number;
}

export interface ContinueStatement {
  kind: "ContinueStatement";
  label?: string;
  line: number;
}

export interface ThrowStatement {
  kind: "ThrowStatement";
  argument: Expression;
  line: number;
}

export interface TryStatement {
  kind: "TryStatement";
  block: BlockStatement;
  handler?: CatchClause;
  finalizer?: BlockStatement;
  line: number;
}

export interface CatchClause {
  param?: Parameter;
  body: BlockStatement;
}

export interface ExpressionStatement {
  kind: "ExpressionStatement";
  expression: Expression;
  line: number;
}

export interface BlockStatement {
  kind: "BlockStatement";
  statements: Statement[];
  line: number;
}

export interface ImportDeclaration {
  kind: "ImportDeclaration";
  specifiers: ImportSpecifier[];
  source: string;
  isTypeOnly?: boolean;
  line: number;
}

export type ImportSpecifier =
  | ImportDefaultSpecifier
  | ImportNamespaceSpecifier
  | ImportNamedSpecifier;

export interface ImportDefaultSpecifier {
  kind: "ImportDefaultSpecifier";
  local: string;
}

export interface ImportNamespaceSpecifier {
  kind: "ImportNamespaceSpecifier";
  local: string;
}

export interface ImportNamedSpecifier {
  kind: "ImportNamedSpecifier";
  imported: string;
  local: string;
  isTypeOnly?: boolean;
}

export interface ExportDeclaration {
  kind: "ExportDeclaration";
  declaration?: Statement;
  specifiers?: ExportSpecifier[];
  source?: string;
  isDefault?: boolean;
  isTypeOnly?: boolean;
  line: number;
}

export interface ExportSpecifier {
  local: string;
  exported: string;
  isTypeOnly?: boolean;
}

export interface EmptyStatement {
  kind: "EmptyStatement";
  line: number;
}

// ============================================
// Type Nodes (类型注解 AST)
// ============================================

export type TypeNode =
  | TypeReference
  | ArrayType
  | TupleType
  | UnionType
  | IntersectionType
  | FunctionTypeNode
  | ObjectTypeNode
  | LiteralType
  | ConditionalType
  | IndexedAccessType
  | MappedType
  | TypeQuery
  | ParenthesizedType
  | OptionalType
  | RestType
  | InferType;

export interface TypeReference {
  kind: "TypeReference";
  typeName: string;
  typeArguments?: TypeNode[];
  line: number;
}

export interface ArrayType {
  kind: "ArrayType";
  elementType: TypeNode;
  line: number;
}

export interface TupleType {
  kind: "TupleType";
  elementTypes: TypeNode[];
  line: number;
}

export interface UnionType {
  kind: "UnionType";
  types: TypeNode[];
  line: number;
}

export interface IntersectionType {
  kind: "IntersectionType";
  types: TypeNode[];
  line: number;
}

export interface FunctionTypeNode {
  kind: "FunctionTypeNode";
  parameters: Parameter[];
  returnType: TypeNode;
  typeParameters?: TypeParameterDeclaration[];
  line: number;
}

export interface ObjectTypeNode {
  kind: "ObjectTypeNode";
  members: TypeMember[];
  line: number;
}

export interface TypeMember {
  name?: string;
  typeAnnotation: TypeNode;
  optional?: boolean;
  readonly?: boolean;
  isIndex?: boolean;
  indexType?: TypeNode;
}

export interface LiteralType {
  kind: "LiteralType";
  value: string | number | boolean | null;
  line: number;
}

export interface ConditionalType {
  kind: "ConditionalType";
  checkType: TypeNode;
  extendsType: TypeNode;
  trueType: TypeNode;
  falseType: TypeNode;
  line: number;
}

export interface IndexedAccessType {
  kind: "IndexedAccessType";
  objectType: TypeNode;
  indexType: TypeNode;
  line: number;
}

export interface MappedType {
  kind: "MappedType";
  typeParameter: TypeParameterDeclaration;
  type: TypeNode;
  readonly?: boolean | "+" | "-";
  optional?: boolean | "+" | "-";
  nameType?: TypeNode;
  line: number;
}

export interface TypeQuery {
  kind: "TypeQuery";
  exprName: string;
  line: number;
}

export interface ParenthesizedType {
  kind: "ParenthesizedType";
  type: TypeNode;
  line: number;
}

export interface OptionalType {
  kind: "OptionalType";
  type: TypeNode;
  line: number;
}

export interface RestType {
  kind: "RestType";
  type: TypeNode;
  line: number;
}

export interface InferType {
  kind: "InferType";
  typeParameter: TypeParameterDeclaration;
  line: number;
}

export interface TypeParameterDeclaration {
  name: string;
  constraint?: TypeNode;
  default?: TypeNode;
}

// Legacy TypeAnnotation for backwards compatibility
export interface TypeAnnotation {
  kind: "TypeAnnotation";
  typeName: string;
  line: number;
}

// ============================================
// Expressions
// ============================================

export type Expression =
  | BinaryExpression
  | UnaryExpression
  | UpdateExpression
  | CallExpression
  | MemberExpression
  | ComputedMemberExpression
  | Identifier
  | NumericLiteral
  | StringLiteral
  | BooleanLiteral
  | NullLiteral
  | UndefinedLiteral
  | ObjectLiteral
  | ArrayLiteral
  | ArrowFunction
  | FunctionExpression
  | ConditionalExpression
  | AssignmentExpression
  | LogicalExpression
  | NewExpression
  | ThisExpression
  | SuperExpression
  | SpreadElement
  | AwaitExpression
  | YieldExpression
  | TemplateLiteralExpr
  | TaggedTemplateExpression
  | TypeAssertion
  | AsExpression
  | NonNullExpression
  | ClassExpression
  | ParenthesizedExpression;

export interface BinaryExpression {
  kind: "BinaryExpression";
  operator: string;
  left: Expression;
  right: Expression;
  line: number;
}

export interface UnaryExpression {
  kind: "UnaryExpression";
  operator: string;
  operand: Expression;
  prefix: boolean;
  line: number;
}

export interface UpdateExpression {
  kind: "UpdateExpression";
  operator: "++" | "--";
  argument: Expression;
  prefix: boolean;
  line: number;
}

export interface CallExpression {
  kind: "CallExpression";
  callee: Expression;
  arguments: Expression[];
  typeArguments?: TypeNode[];
  optional?: boolean;
  line: number;
}

export interface MemberExpression {
  kind: "MemberExpression";
  object: Expression;
  property: string;
  optional?: boolean;
  line: number;
}

export interface ComputedMemberExpression {
  kind: "ComputedMemberExpression";
  object: Expression;
  property: Expression;
  optional?: boolean;
  line: number;
}

export interface Identifier {
  kind: "Identifier";
  name: string;
  line: number;
}

export interface NumericLiteral {
  kind: "NumericLiteral";
  value: number;
  line: number;
}

export interface StringLiteral {
  kind: "StringLiteral";
  value: string;
  line: number;
}

export interface BooleanLiteral {
  kind: "BooleanLiteral";
  value: boolean;
  line: number;
}

export interface NullLiteral {
  kind: "NullLiteral";
  line: number;
}

export interface UndefinedLiteral {
  kind: "UndefinedLiteral";
  line: number;
}

export interface ObjectLiteral {
  kind: "ObjectLiteral";
  properties: ObjectProperty[];
  line: number;
}

export interface ObjectProperty {
  key: string | Expression;
  value: Expression;
  computed?: boolean;
  shorthand?: boolean;
  method?: boolean;
}

export interface ArrayLiteral {
  kind: "ArrayLiteral";
  elements: (Expression | SpreadElement | null)[];
  line: number;
}

export interface ArrowFunction {
  kind: "ArrowFunction";
  parameters: Parameter[];
  returnType?: TypeNode;
  body: Expression | BlockStatement;
  isAsync?: boolean;
  typeParameters?: TypeParameterDeclaration[];
  line: number;
}

export interface FunctionExpression {
  kind: "FunctionExpression";
  name?: string;
  parameters: Parameter[];
  returnType?: TypeNode;
  body: BlockStatement;
  isAsync?: boolean;
  isGenerator?: boolean;
  typeParameters?: TypeParameterDeclaration[];
  line: number;
}

export interface ConditionalExpression {
  kind: "ConditionalExpression";
  condition: Expression;
  consequent: Expression;
  alternate: Expression;
  line: number;
}

export interface AssignmentExpression {
  kind: "AssignmentExpression";
  operator: string;
  left: Expression;
  right: Expression;
  line: number;
}

export interface LogicalExpression {
  kind: "LogicalExpression";
  operator: "&&" | "||" | "??";
  left: Expression;
  right: Expression;
  line: number;
}

export interface NewExpression {
  kind: "NewExpression";
  callee: Expression;
  arguments: Expression[];
  typeArguments?: TypeNode[];
  line: number;
}

export interface ThisExpression {
  kind: "ThisExpression";
  line: number;
}

export interface SuperExpression {
  kind: "SuperExpression";
  line: number;
}

export interface SpreadElement {
  kind: "SpreadElement";
  argument: Expression;
  line: number;
}

export interface AwaitExpression {
  kind: "AwaitExpression";
  argument: Expression;
  line: number;
}

export interface YieldExpression {
  kind: "YieldExpression";
  argument?: Expression;
  delegate: boolean;
  line: number;
}

export interface TemplateLiteralExpr {
  kind: "TemplateLiteralExpr";
  quasis: string[];
  expressions: Expression[];
  line: number;
}

export interface TaggedTemplateExpression {
  kind: "TaggedTemplateExpression";
  tag: Expression;
  quasi: TemplateLiteralExpr;
  line: number;
}

export interface TypeAssertion {
  kind: "TypeAssertion";
  typeAnnotation: TypeNode;
  expression: Expression;
  line: number;
}

export interface AsExpression {
  kind: "AsExpression";
  expression: Expression;
  typeAnnotation: TypeNode;
  line: number;
}

export interface NonNullExpression {
  kind: "NonNullExpression";
  expression: Expression;
  line: number;
}

export interface ClassExpression {
  kind: "ClassExpression";
  name?: string;
  superClass?: Expression;
  implements?: TypeNode[];
  members: ClassMember[];
  line: number;
}

export interface ParenthesizedExpression {
  kind: "ParenthesizedExpression";
  expression: Expression;
  line: number;
}

// ============================================
// Type System (类型检查)
// ============================================

export type Type =
  | PrimitiveType
  | LiteralTypeValue
  | ArrayTypeValue
  | TupleTypeValue
  | UnionTypeValue
  | IntersectionTypeValue
  | FunctionType
  | InterfaceType
  | ClassType
  | EnumType
  | TypeAliasType
  | GenericType
  | ConditionalTypeValue
  | IndexedAccessTypeValue
  | MappedTypeValue
  | UnknownType
  | NeverType
  | AnyType;

export interface PrimitiveType {
  kind:
    | "number"
    | "string"
    | "boolean"
    | "void"
    | "null"
    | "undefined"
    | "symbol"
    | "bigint";
}

export interface LiteralTypeValue {
  kind: "literal";
  value: string | number | boolean;
}

export interface ArrayTypeValue {
  kind: "array";
  elementType: Type;
}

export interface TupleTypeValue {
  kind: "tuple";
  elementTypes: Type[];
}

export interface UnionTypeValue {
  kind: "union";
  types: Type[];
}

export interface IntersectionTypeValue {
  kind: "intersection";
  types: Type[];
}

export interface FunctionType {
  kind: "function";
  params: { name: string; type: Type; optional?: boolean }[];
  returnType: Type;
  typeParameters?: TypeParameterValue[];
}

export interface InterfaceType {
  kind: "interface";
  name: string;
  members: Map<string, { type: Type; optional?: boolean; readonly?: boolean }>;
  extends?: Type[];
}

export interface ClassType {
  kind: "class";
  name: string;
  members: Map<
    string,
    { type: Type; accessibility?: string; static?: boolean }
  >;
  staticMembers: Map<string, { type: Type }>;
  superClass?: Type;
  implements?: Type[];
}

export interface EnumType {
  kind: "enum";
  name: string;
  members: Map<string, number | string>;
}

export interface TypeAliasType {
  kind: "typeAlias";
  name: string;
  type: Type;
  typeParameters?: TypeParameterValue[];
}

export interface GenericType {
  kind: "generic";
  name: string;
  constraint?: Type;
  default?: Type;
}

export interface TypeParameterValue {
  name: string;
  constraint?: Type;
  default?: Type;
}

export interface ConditionalTypeValue {
  kind: "conditional";
  checkType: Type;
  extendsType: Type;
  trueType: Type;
  falseType: Type;
}

export interface IndexedAccessTypeValue {
  kind: "indexedAccess";
  objectType: Type;
  indexType: Type;
}

export interface MappedTypeValue {
  kind: "mapped";
  typeParameter: TypeParameterValue;
  type: Type;
}

export interface UnknownType {
  kind: "unknown";
}

export interface NeverType {
  kind: "never";
}

export interface AnyType {
  kind: "any";
}

// ============================================
// Compiler Errors
// ============================================

export interface CompilerError {
  message: string;
  line: number;
  column?: number;
  severity?: "error" | "warning" | "info";
}

// ============================================
// Utility Types
// ============================================

export function createNumberType(): PrimitiveType {
  return { kind: "number" };
}

export function createStringType(): PrimitiveType {
  return { kind: "string" };
}

export function createBooleanType(): PrimitiveType {
  return { kind: "boolean" };
}

export function createVoidType(): PrimitiveType {
  return { kind: "void" };
}

export function createNullType(): PrimitiveType {
  return { kind: "null" };
}

export function createUndefinedType(): PrimitiveType {
  return { kind: "undefined" };
}

export function createAnyType(): AnyType {
  return { kind: "any" };
}

export function createUnknownType(): UnknownType {
  return { kind: "unknown" };
}

export function createNeverType(): NeverType {
  return { kind: "never" };
}

export function createArrayType(elementType: Type): ArrayTypeValue {
  return { kind: "array", elementType };
}

export function createUnionType(types: Type[]): UnionTypeValue {
  return { kind: "union", types };
}

export function createIntersectionType(types: Type[]): IntersectionTypeValue {
  return { kind: "intersection", types };
}
