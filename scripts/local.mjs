import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = { ...process.env };
if (existsSync(path.join(root, ".env"))) {
  for (const line of readFileSync(path.join(root, ".env"), "utf8").split(
    /\r?\n/,
  )) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && env[match[1]] === undefined) env[match[1]] = match[2];
  }
}
const mode = process.argv[2];
const children = new Set();
function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env,
      stdio: "inherit",
      ...options,
    });
    children.add(child);
    child.once("error", () => {
      children.delete(child);
      reject(new Error("Local command could not start"));
    });
    child.once("exit", (code, signal) => {
      children.delete(child);
      code === 0 || signal === "SIGTERM"
        ? resolve()
        : reject(
            new Error(
              "Local command failed; inspect the non-sensitive error above",
            ),
          );
    });
  });
}
function localEnvironment() {
  env.APP_ENV ??= "development";
  env.RENDERLY_LOCAL_IDENTITY = "true";
  env.API_ADDR ??= "127.0.0.1:8080";
  if (env.API_ADDR.startsWith(":")) env.API_ADDR = "127.0.0.1" + env.API_ADDR;
  env.DEV_USER_ID ??= "11111111-1111-4111-8111-111111111111";
  env.DEV_WORKSPACE_ID ??= "22222222-2222-4222-8222-222222222222";
}
function stop() {
  for (const child of children) child.kill("SIGTERM");
}
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
async function db(action) {
  await run("go", ["run", "./cmd/db", action], {
    cwd: path.join(root, "backend"),
  });
}
async function api() {
  mkdirSync(path.join(root, ".tools"), { recursive: true });
  await run(
    "go",
    ["build", "-o", path.join(root, ".tools/renderly-api"), "./cmd/api"],
    { cwd: path.join(root, "backend") },
  );
  return run(path.join(root, ".tools/renderly-api"), []);
}
async function web(command) {
  const webEnv = {
    ...process.env,
    RENDERLY_PROJECTS_MODE: "api",
    RENDERLY_API_ORIGIN: `http://${env.API_ADDR}`,
    RENDERLY_WORKSPACE_ID: env.DEV_WORKSPACE_ID,
  };
  return run(
    "pnpm",
    [
      "--filter",
      "@renderly/web",
      command,
      "--hostname",
      "127.0.0.1",
      "--port",
      env.PORT ?? "3000",
    ],
    { env: webEnv },
  );
}
try {
  if (mode === "migrate") {
    await db(process.argv[3] ?? "status");
  } else if (mode === "bootstrap") {
    localEnvironment();
    await db("bootstrap");
  } else if (mode === "setup") {
    localEnvironment();
    await run("docker", ["compose", "up", "-d", "--wait", "postgres"]);
    await db("up");
    await db("bootstrap");
  } else if (["api", "dev", "start", "web-dev", "web-start"].includes(mode)) {
    localEnvironment();
    if (mode === "api") await api();
    else if (mode.startsWith("web-")) await web(mode.slice(4));
    else {
      await run("docker", ["compose", "up", "-d", "--wait", "postgres"]);
      await Promise.all([api(), web(mode)]);
    }
  } else
    throw new Error(
      "Use setup | migrate up/status | bootstrap | api | dev | start | web-dev | web-start",
    );
} catch (error) {
  stop();
  console.error(error.message);
  process.exitCode = 1;
}
