import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import ts from "typescript";

const requestedSuite = process.argv[2];
if (
  requestedSuite !== undefined &&
  requestedSuite !== "studio" &&
  requestedSuite !== "workspace" &&
  requestedSuite !== "projects"
) {
  throw new Error(`Unknown test suite: ${requestedSuite}`);
}
const suite = requestedSuite ?? "studio";
const output = fs.mkdtempSync(path.join(os.tmpdir(), "renderly-studio-tests-"));
try {
  const entries =
    suite === "projects"
      ? [
          "lib/projects/project-sync.ts",
          "lib/server/project-proxy.ts",
          "lib/demo/workspace-store.ts",
        ]
      : [
          suite === "workspace"
            ? "lib/demo/workspace-store.ts"
            : "lib/demo/demo-agent.ts",
        ];
  const program = ts.createProgram(
    entries.map((entry) => path.resolve(entry)),
    {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.Node10,
      strict: true,
      skipLibCheck: true,
      baseUrl: process.cwd(),
      paths: { "@/*": ["./*"] },
      rootDir: process.cwd(),
      outDir: output,
    },
  );
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
      ["--test", `tests/${suite}.test.mjs`],
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
