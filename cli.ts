#!/usr/bin/env bun

import { compile, formatErrors } from "./src/compiler";

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printUsage();
    process.exit(1);
  }

  // Parse arguments
  let inputFile = "";
  let outputFile = "";
  let skipTypeCheck = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--skip-type-check" || arg === "-s") {
      skipTypeCheck = true;
    } else if (arg === "-o" && i + 1 < args.length) {
      outputFile = args[++i];
    } else if (!arg.startsWith("-")) {
      if (!inputFile) {
        inputFile = arg;
      } else if (!outputFile) {
        outputFile = arg;
      }
    }
  }

  if (!inputFile) {
    console.error("Error: No input file specified");
    printUsage();
    process.exit(1);
  }

  // If no output file specified, derive from input
  if (!outputFile) {
    outputFile = inputFile.replace(/\.ts$/, ".js");
  }

  try {
    // Read input file
    const sourceFile = Bun.file(inputFile);
    const source = await sourceFile.text();

    console.log(`Compiling ${inputFile}...`);

    // Compile
    const result = compile(source, { skipTypeCheck });

    if (!result.success) {
      console.error("\n❌ Compilation failed with errors:\n");
      console.error(formatErrors(result.errors, source));
      process.exit(1);
    }

    // Write output
    await Bun.write(outputFile, result.output!);

    console.log(`✅ Successfully compiled to ${outputFile}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

function printUsage() {
  console.log(`
Mini-TS Compiler

Usage:
  bun cli.ts <input.ts> [output.js] [options]

Arguments:
  input.ts    TypeScript source file to compile
  output.js   Output JavaScript file (optional, defaults to input.js)

Options:
  --skip-type-check, -s   Skip type checking
  -o <file>               Specify output file

Examples:
  bun cli.ts hello.ts              # Outputs to hello.js
  bun cli.ts src/app.ts dist/app.js
  bun cli.ts app.ts --skip-type-check
  bun cli.ts app.ts -s -o out.js

Supported Features:
  - Variable declarations (let/const/var) with type annotations
  - Function declarations with typed parameters and return types
  - Interface and type alias declarations
  - Classes with inheritance, decorators, and access modifiers
  - Enums, generics, arrow functions
  - Async/await, optional chaining, nullish coalescing
  - Import/export modules
`);
}

main();
