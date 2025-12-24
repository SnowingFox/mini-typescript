/**
 * Mini-TS: A minimal TypeScript to JavaScript transpiler
 *
 * This module exports the main compiler API and all individual components.
 */

export { compile, formatErrors } from './src/compiler';
export { tokenize, Lexer } from './src/lexer';
export { parse, Parser } from './src/parser';
export { typeCheck, TypeChecker } from './src/checker';
export { emit, Emitter } from './src/emitter';
export * from './src/types';
