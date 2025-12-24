#!/usr/bin/env bun

import { compile, formatErrors } from "./src/compiler";

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printUsage();
    process.exit(1);
  }

  const inputFile = args[0];
  let outputFile = args[1];

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
    const result = compile(source);

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
  bun cli.ts <input.ts> [output.js]

Arguments:
  input.ts    TypeScript source file to compile
  output.js   Output JavaScript file (optional, defaults to input.js)

Examples:
  bun cli.ts hello.ts           # Outputs to hello.js
  bun cli.ts src/app.ts dist/app.js

Supported Features:
  - Variable declarations (let/const) with type annotations
  - Function declarations with typed parameters and return types
  - Interface declarations
  - Basic expressions and statements
  - Type checking for number and string types
`);
}

main();
