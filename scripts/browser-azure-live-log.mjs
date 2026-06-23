import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const allowedLocales = new Set(["en-US", "es-ES", "fr-FR", "ru-RU"]);
const allowedStatuses = new Set(["pass", "fail", "blocked"]);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const logDir = path.join(repoRoot, ".runlogs");
const logPath = path.join(logDir, "browser-azure-live-check.md");

const defaultRoutes = {
  "en-US": "/phonemes/ee",
  "es-ES": "/phonemes/es-a",
  "fr-FR": "/phonemes/fr-i",
  "ru-RU": "/phonemes/ru-a",
};

function usage() {
  return `Usage:
  npm run browser:azure-live-log
  npm run browser:azure-live-log -- --record --locale en-US --route /phonemes/ee --status pass --score 86 --notes "score rendered from browser recording"

This tool writes only sanitized validation metadata to:
  .runlogs/browser-azure-live-check.md

Never pass provider keys, raw Azure payloads, recordings, account IDs, or
screenshots containing secrets to this command.`;
}

function assertSafeValue(name, value) {
  const text = String(value ?? "");
  if (
    /subscription|secret|token|api[_-]?key|azure[_-]?key|speech[_-]?key/i.test(
      name,
    ) ||
    /sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{20,}|[A-Za-z0-9+/]{32,}={0,2}/.test(
      text,
    )
  ) {
    throw new Error(
      `Refusing to write possible secret material from "${name}" to ${logPath}.`,
    );
  }
}

function parseArgs(argv) {
  const result = { record: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--record") {
      result.record = true;
      continue;
    }
    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }
    const key = arg.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for --${key}`);
    }
    assertSafeValue(key, value);
    result[key] = value;
    index += 1;
  }
  return result;
}

function ensureLogFile() {
  fs.mkdirSync(logDir, { recursive: true });
  if (fs.existsSync(logPath)) return;

  const rows = Object.entries(defaultRoutes)
    .map(
      ([locale, route]) =>
        `| ${locale} | ${route} | pending |  |  |  |`,
    )
    .join("\n");

  fs.writeFileSync(
    logPath,
    `# Browser Azure Live Check

This private local log tracks the release-blocking Browser Edition Azure Speech
checks. It is intentionally under .runlogs/ and ignored by Git.

## Rules

- Serve Browser Edition from localhost or HTTPS, never file://.
- Use a clean browser profile or clear Browser Edition storage.
- Configure Azure Speech in Settings using session storage unless persistence is
  explicitly being tested.
- Record one fresh microphone sample per locale.
- Confirm visible numeric scores render from Azure Speech Pronunciation
  Assessment in the browser runtime.
- Do not store provider keys, recordings, account IDs, screenshots containing
  keys, raw Azure payloads, or private user paths here.

## Checklist

| Locale | Suggested route | Status | Score | Checked at | Notes |
| --- | --- | --- | --- | --- | --- |
${rows}

## Append-Only Entries

`,
    "utf8",
  );
}

function sanitizeNotes(notes) {
  const value = String(notes ?? "").replace(/\s+/g, " ").trim();
  assertSafeValue("notes", value);
  return value.slice(0, 180);
}

function normalizeScore(score) {
  if (score === undefined) return "";
  if (!/^\d{1,3}$/.test(score)) {
    throw new Error("--score must be an integer from 0 to 100.");
  }
  const value = Number(score);
  if (value < 0 || value > 100) {
    throw new Error("--score must be an integer from 0 to 100.");
  }
  return String(value);
}

function appendRecord(args) {
  const { locale, route, status } = args;
  if (!allowedLocales.has(locale)) {
    throw new Error(
      `--locale must be one of: ${Array.from(allowedLocales).join(", ")}`,
    );
  }
  if (!allowedStatuses.has(status)) {
    throw new Error(
      `--status must be one of: ${Array.from(allowedStatuses).join(", ")}`,
    );
  }
  const routeValue = route || defaultRoutes[locale];
  if (!routeValue.startsWith("/")) {
    throw new Error("--route must be an app-relative path like /phonemes/ee.");
  }

  const score = normalizeScore(args.score);
  const notes = sanitizeNotes(args.notes);
  const checkedAt = new Date().toISOString();
  const row = `| ${locale} | ${routeValue} | ${status} | ${score} | ${checkedAt} | ${notes} |\n`;

  fs.appendFileSync(logPath, row, "utf8");
}

try {
  const args = parseArgs(process.argv.slice(2));
  ensureLogFile();
  if (args.record) {
    appendRecord(args);
    console.log(`Appended sanitized live-check entry to ${logPath}`);
  } else {
    console.log(usage());
    console.log(`\nCreated or verified: ${logPath}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error(`\n${usage()}`);
  process.exit(1);
}
