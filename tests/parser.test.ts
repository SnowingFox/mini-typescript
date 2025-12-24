import { test, expect, describe } from 'bun:test';
import { tokenize } from '../src/lexer';
import { parse } from '../src/parser';

describe('Parser', () => {
  test('parses variable declaration with type annotation', () => {
    const tokens = tokenize('let x: number = 42;');
    const ast = parse(tokens);

    expect(ast.kind).toBe('Program');
    expect(ast.statements.length).toBe(1);

    const stmt = ast.statements[0];
    expect(stmt.kind).toBe('VariableDeclaration');

    if (stmt.kind === 'VariableDeclaration') {
      expect(stmt.name).toBe('x');
      expect(stmt.varKind).toBe('let');
      expect(stmt.typeAnnotation?.typeName).toBe('number');
      expect(stmt.initializer?.kind).toBe('NumericLiteral');
    }
  });

  test('parses const declaration with string type', () => {
    const tokens = tokenize('const greeting: string = "hello";');
    const ast = parse(tokens);

    const stmt = ast.statements[0];
    expect(stmt.kind).toBe('VariableDeclaration');

    if (stmt.kind === 'VariableDeclaration') {
      expect(stmt.varKind).toBe('const');
      expect(stmt.typeAnnotation?.typeName).toBe('string');
      expect(stmt.initializer?.kind).toBe('StringLiteral');
    }
  });

  test('parses function declaration', () => {
    const tokens = tokenize('function add(a: number, b: number): number { return a + b; }');
    const ast = parse(tokens);

    const stmt = ast.statements[0];
    expect(stmt.kind).toBe('FunctionDeclaration');

    if (stmt.kind === 'FunctionDeclaration') {
      expect(stmt.name).toBe('add');
      expect(stmt.parameters.length).toBe(2);
      expect(stmt.parameters[0].name).toBe('a');
      expect(stmt.parameters[0].typeAnnotation?.typeName).toBe('number');
      expect(stmt.returnType?.typeName).toBe('number');
      expect(stmt.body.statements.length).toBe(1);
    }
  });

  test('parses interface declaration', () => {
    const tokens = tokenize('interface Person { name: string; age: number; }');
    const ast = parse(tokens);

    const stmt = ast.statements[0];
    expect(stmt.kind).toBe('InterfaceDeclaration');

    if (stmt.kind === 'InterfaceDeclaration') {
      expect(stmt.name).toBe('Person');
      expect(stmt.members.length).toBe(2);
      expect(stmt.members[0].name).toBe('name');
      expect(stmt.members[0].typeAnnotation.typeName).toBe('string');
      expect(stmt.members[1].name).toBe('age');
      expect(stmt.members[1].typeAnnotation.typeName).toBe('number');
    }
  });

  test('parses if statement', () => {
    const tokens = tokenize('if (x > 0) { return x; }');
    const ast = parse(tokens);

    const stmt = ast.statements[0];
    expect(stmt.kind).toBe('IfStatement');

    if (stmt.kind === 'IfStatement') {
      expect(stmt.condition.kind).toBe('BinaryExpression');
      expect(stmt.consequent.kind).toBe('BlockStatement');
    }
  });

  test('parses if-else statement', () => {
    const tokens = tokenize('if (x > 0) { return 1; } else { return 0; }');
    const ast = parse(tokens);

    const stmt = ast.statements[0];
    expect(stmt.kind).toBe('IfStatement');

    if (stmt.kind === 'IfStatement') {
      expect(stmt.alternate).toBeDefined();
      expect(stmt.alternate?.kind).toBe('BlockStatement');
    }
  });

  test('parses binary expression', () => {
    const tokens = tokenize('let result = 1 + 2 * 3;');
    const ast = parse(tokens);

    const stmt = ast.statements[0];
    if (stmt.kind === 'VariableDeclaration') {
      const init = stmt.initializer;
      expect(init?.kind).toBe('BinaryExpression');

      // Should respect operator precedence: 1 + (2 * 3)
      if (init?.kind === 'BinaryExpression') {
        expect(init.operator).toBe('+');
        expect(init.right.kind).toBe('BinaryExpression');
      }
    }
  });

  test('parses function call', () => {
    const tokens = tokenize('add(1, 2);');
    const ast = parse(tokens);

    const stmt = ast.statements[0];
    expect(stmt.kind).toBe('ExpressionStatement');

    if (stmt.kind === 'ExpressionStatement') {
      const expr = stmt.expression;
      expect(expr.kind).toBe('CallExpression');

      if (expr.kind === 'CallExpression') {
        expect(expr.callee.kind).toBe('Identifier');
        expect(expr.arguments.length).toBe(2);
      }
    }
  });

  test('parses object literal', () => {
    const tokens = tokenize('let obj = { name: "Alice", age: 30 };');
    const ast = parse(tokens);

    const stmt = ast.statements[0];
    if (stmt.kind === 'VariableDeclaration') {
      const init = stmt.initializer;
      expect(init?.kind).toBe('ObjectLiteral');

      if (init?.kind === 'ObjectLiteral') {
        expect(init.properties.length).toBe(2);
        expect(init.properties[0].key).toBe('name');
        expect(init.properties[1].key).toBe('age');
      }
    }
  });

  test('parses return statement without value', () => {
    const tokens = tokenize('function foo(): void { return; }');
    const ast = parse(tokens);

    const func = ast.statements[0];
    if (func.kind === 'FunctionDeclaration') {
      const ret = func.body.statements[0];
      expect(ret.kind).toBe('ReturnStatement');
      if (ret.kind === 'ReturnStatement') {
        expect(ret.argument).toBeUndefined();
      }
    }
  });
});

