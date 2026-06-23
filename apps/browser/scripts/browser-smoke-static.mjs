import { spawn } from "node:child_process";

const port = Number(process.env.PORT || 4173);
const smokeUrl = `http://127.0.0.1:${port}`;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(smokeUrl);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await delay(250);
  }
  throw new Error(`Static server did not become ready at ${smokeUrl}`);
}

function runNodeScript(script, env = {}) {
  const child = spawn(process.execPath, [script], {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    stdio: "inherit",
  });
  return new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} exited with ${code}`));
    });
  });
}

const server = spawn(process.execPath, ["scripts/serve-static.mjs"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port) },
  stdio: "inherit",
});

try {
  await waitForServer();
  await runNodeScript("scripts/browser-smoke.mjs", {
    SPEAKRIGHT_BROWSER_SMOKE_URL: smokeUrl,
  });
} finally {
  server.kill();
}
