import { spawn } from "node:child_process";

const env = { ...process.env };

if (process.platform === "win32" && !env.CARGO_BUILD_JOBS) {
  env.CARGO_BUILD_JOBS = "1";
  console.log(
    "desktop-build: defaulting CARGO_BUILD_JOBS=1 on Windows to reduce Rust/LLVM release-build memory peaks.",
  );
}

const command = process.platform === "win32" ? "tauri.cmd" : "tauri";
const child = spawn(command, ["build", ...process.argv.slice(2)], {
  env,
  shell: process.platform === "win32",
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(
    `desktop-build: failed to start Tauri build: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`desktop-build: Tauri build stopped by signal ${signal}.`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});
