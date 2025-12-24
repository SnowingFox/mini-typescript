import { tokenize } from "./lexer";
import { parse } from "./parser";
import { typeCheck } from "./checker";
import { emit } from "./emitter";
import { CompilerError, Program, Token } from "./types";

export interface CompileResult {
  success: boolean;
  output?: string;
  errors: CompilerError[];
  ast?: Program;
  tokens?: Token[];
}

export interface CompileOptions {
  /** Skip type checking phase */
  skipTypeCheck?: boolean;
  /** Include AST in result */
  includeAST?: boolean;
  /** Include tokens in result */
  includeTokens?: boolean;
}

/**
 * Compile TypeScript source code to JavaScript
 */
export function compile(
  source: string,
  options: CompileOptions = {}
): CompileResult {
  const result: CompileResult = {
    success: false,
    errors: [],
  };

  try {
    // Phase 1: Lexical Analysis
    const tokens = tokenize(source);
    if (options.includeTokens) {
      result.tokens = tokens;
    }

    // Phase 2: Syntax Analysis
    const ast = parse(tokens);
    if (options.includeAST) {
      result.ast = ast;
    }

    // Phase 3: Type Checking
    if (!options.skipTypeCheck) {
      const typeErrors = typeCheck(ast);
      if (typeErrors.length > 0) {
        result.errors = typeErrors;
        return result;
      }
    }

    // Phase 4: Code Generation
    const output = emit(ast);
    result.output = output;
    result.success = true;

    return result;
  } catch (error) {
    if (error instanceof Error) {
      result.errors.push({
        message: error.message,
        line: 1,
      });
    }
    return result;
  }
}

/**
 * Format compiler errors for display
 */
export function formatErrors(errors: CompilerError[], source?: string): string {
  const lines = source ? source.split("\n") : [];

  return errors
    .map((error) => {
      let msg = `Error (line ${error.line}): ${error.message}`;

      // Show source line if available
      if (lines[error.line - 1]) {
        msg += `\n  ${error.line} | ${lines[error.line - 1]}`;
      }

      return msg;
    })
    .join("\n\n");
}

// Re-export individual components for advanced usage
export { tokenize } from "./lexer";
export { parse } from "./parser";
export { typeCheck } from "./checker";
export { emit } from "./emitter";
export * from "./types";
