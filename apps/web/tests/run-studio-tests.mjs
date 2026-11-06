import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import ts from "typescript";

const output = fs.mkdtempSync(path.join(os.tmpdir(), "renderly-studio-tests-"));
try {
  const program = ts.createProgram([path.resolve("lib/demo/demo-agent.ts")], {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    strict: true,
    skipLibCheck: true,
    baseUrl: process.cwd(),
    paths: { "@/*": ["./*"] },
    rootDir: process.cwd(),
    outDir: output,
  });
  const emitted = program.emit();
  const diagnostics = [
    ...ts.getPreEmitDiagnostics(program),
    ...emitted.diagnostics,
  ];
  if (diagnostics.length) {
    process.stderr.write(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCurrentDirectory: () => process.cwd(),
        getCanonicalFileName: (name) => name,
        getNewLine: () => "\n",
      }),
    );
    process.exitCode = 1;
  } else {
    const result = spawnSync(
      process.execPath,
      ["--test", "tests/studio.test.mjs"],
      {
        stdio: "inherit",
        env: { ...process.env, RENDERLY_STUDIO_TEST_BUILD: output },
      },
    );
    process.exitCode = result.status ?? 1;
  }
} finally {
  fs.rmSync(output, { recursive: true, force: true });
}
