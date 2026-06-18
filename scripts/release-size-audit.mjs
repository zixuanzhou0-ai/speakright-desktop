import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const outputDir = path.join(root, "src-tauri", "target", "release-size-audit");
const outputPath = path.join(outputDir, "report.json");

const sizeTargets = [
  { id: "public-audio", path: path.join(root, "public", "audio") },
  { id: "public-videos", path: path.join(root, "public", "videos") },
  { id: "docs", path: path.join(root, "docs") },
  { id: "out-static-export", path: path.join(root, "out") },
  { id: "tauri-target", path: path.join(root, "src-tauri", "target") },
  {
    id: "release-exe",
    path: path.join(root, "src-tauri", "target", "release", "speakright.exe"),
  },
  {
    id: "release-bundle",
    path: path.join(root, "src-tauri", "target", "release", "bundle"),
  },
];

const largestFileScopes = [
  { id: "docs", path: path.join(root, "docs") },
  { id: "public-audio", path: path.join(root, "public", "audio") },
  { id: "public-videos", path: path.join(root, "public", "videos") },
  {
    id: "release-bundle",
    path: path.join(root, "src-tauri", "target", "release", "bundle"),
  },
];

function toRelative(filePath) {
  return path.relative(root, filePath).replaceAll(path.sep, "/");
}

function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

async function walkSize(targetPath, options = {}) {
  if (!existsSync(targetPath)) {
    return { exists: false, bytes: 0, files: 0, directories: 0 };
  }

  const info = await stat(targetPath);
  if (info.isFile()) {
    return { exists: true, bytes: info.size, files: 1, directories: 0 };
  }

  let bytes = 0;
  let files = 0;
  let directories = 1;
  for (const entry of await readdir(targetPath, { withFileTypes: true })) {
    if (options.skipNames?.has(entry.name)) continue;
    const entryPath = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      const child = await walkSize(entryPath, options);
      bytes += child.bytes;
      files += child.files;
      directories += child.directories;
    } else if (entry.isFile()) {
      const childInfo = await stat(entryPath);
      bytes += childInfo.size;
      files += 1;
    }
  }
  return { exists: true, bytes, files, directories };
}

async function collectLargestFiles(scope, limit = 12) {
  if (!existsSync(scope.path)) return [];

  const files = [];
  async function visit(dirPath) {
    const info = await stat(dirPath);
    if (info.isFile()) {
      files.push({
        path: toRelative(dirPath),
        bytes: info.size,
        human: formatBytes(info.size),
      });
      return;
    }
    for (const entry of await readdir(dirPath, { withFileTypes: true })) {
      const entryPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        await visit(entryPath);
      } else if (entry.isFile()) {
        const entryInfo = await stat(entryPath);
        files.push({
          path: toRelative(entryPath),
          bytes: entryInfo.size,
          human: formatBytes(entryInfo.size),
        });
      }
    }
  }

  await visit(scope.path);
  return files.sort((left, right) => right.bytes - left.bytes).slice(0, limit);
}

async function trackedSourceSize() {
  try {
    const { stdout } = await execFileAsync("git", ["ls-files", "-z"], {
      cwd: root,
      encoding: "buffer",
      maxBuffer: 16 * 1024 * 1024,
    });
    const files = stdout.toString("utf8").split("\0").filter(Boolean);
    let bytes = 0;
    let counted = 0;
    for (const relativePath of files) {
      const filePath = path.join(root, relativePath);
      if (!existsSync(filePath)) continue;
      const info = await stat(filePath);
      if (!info.isFile()) continue;
      bytes += info.size;
      counted += 1;
    }
    return { available: true, files: counted, bytes, human: formatBytes(bytes) };
  } catch (error) {
    return {
      available: false,
      files: 0,
      bytes: 0,
      human: "0 B",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const targets = [];
  for (const target of sizeTargets) {
    const size = await walkSize(target.path, {
      skipNames: new Set([".git", "node_modules"]),
    });
    targets.push({
      id: target.id,
      path: toRelative(target.path),
      ...size,
      human: formatBytes(size.bytes),
    });
  }

  const largestFiles = {};
  for (const scope of largestFileScopes) {
    largestFiles[scope.id] = await collectLargestFiles(scope);
  }

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    note: "Read-only size audit. This script reports size distribution and does not delete or generate assets.",
    trackedSource: await trackedSourceSize(),
    targets,
    largestFiles,
  };

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Release size audit written: ${outputPath}`);
  console.log("Tracked source:", report.trackedSource.human);
  for (const target of targets) {
    const status = target.exists ? target.human : "missing";
    console.log(`${target.id}: ${status} (${target.path})`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
