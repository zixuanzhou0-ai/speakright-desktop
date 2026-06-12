import { execFile } from "node:child_process";
import { copyFile, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const repoRoot = process.cwd();
const videoRoot = path.join(repoRoot, "public", "videos");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const targetRoot = path.join(repoRoot, "src-tauri", "target", "video-compression", timestamp);
const tmpRoot = path.join(targetRoot, "tmp");
const reportJsonPath = path.join(targetRoot, "video-compression-report.json");
const reportMarkdownPath = path.join(targetRoot, "video-compression-report.md");
const backupRoot =
  process.env.SPEAKRIGHT_VIDEO_BACKUP_DIR ??
  path.join(path.parse(repoRoot).root, "SpeakRightVideoBackups", timestamp);

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const confirm = args.has("--confirm");
const minSavingPercent = Number(
  process.argv
    .find((arg) => arg.startsWith("--min-saving="))
    ?.split("=")
    .at(1) ?? "8",
);
const limitArg = process.argv
  .find((arg) => arg.startsWith("--limit="))
  ?.split("=")
  .at(1);
const limit = limitArg ? Number(limitArg) : null;

if (!dryRun && !confirm) {
  console.error("Refusing to mutate videos without --confirm. Use --dry-run to inspect.");
  process.exit(1);
}

if (!dryRun && (!Number.isFinite(minSavingPercent) || minSavingPercent <= 0)) {
  console.error("--min-saving must be a positive number.");
  process.exit(1);
}

const videoExtensions = new Set([".mp4", ".webm", ".mov"]);

function publicSrcFromFile(filePath) {
  const relative = path.relative(path.join(repoRoot, "public"), filePath);
  return `/${relative.split(path.sep).join("/")}`;
}

function relativeVideoPath(filePath) {
  return path.relative(videoRoot, filePath).split(path.sep).join("/");
}

function bytesToMb(bytes) {
  return Math.round((bytes / 1024 / 1024) * 10) / 10;
}

async function collectVideos(dir = videoRoot) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectVideos(fullPath)));
      continue;
    }

    if (entry.isFile() && videoExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

async function probe(filePath) {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_format",
    "-show_streams",
    "-of",
    "json",
    filePath,
  ]);
  return JSON.parse(stdout);
}

async function summarizeVideo(filePath) {
  const fileStat = await stat(filePath);
  const metadata = await probe(filePath);
  const videoStream = metadata.streams?.find((stream) => stream.codec_type === "video");
  const audioStream = metadata.streams?.find((stream) => stream.codec_type === "audio");
  const duration =
    Number(videoStream?.duration) ||
    Number(audioStream?.duration) ||
    Number(metadata.format?.duration) ||
    0;

  return {
    filePath,
    publicSrc: publicSrcFromFile(filePath),
    relativePath: relativeVideoPath(filePath),
    bytes: fileStat.size,
    duration,
    video: videoStream
      ? {
          codec: videoStream.codec_name,
          width: Number(videoStream.width) || 0,
          height: Number(videoStream.height) || 0,
          bitrate: Number(videoStream.bit_rate) || 0,
          frameRate: videoStream.avg_frame_rate ?? "",
        }
      : null,
    audio: audioStream
      ? {
          codec: audioStream.codec_name,
          bitrate: Number(audioStream.bit_rate) || 0,
          sampleRate: Number(audioStream.sample_rate) || 0,
          channels: Number(audioStream.channels) || 0,
        }
      : null,
  };
}

function compressionProfile(summary) {
  const rel = summary.relativePath.replaceAll("\\", "/");

  if (rel.includes("/youtube-lessons/")) {
    return {
      name: "teaching-long",
      crf: 26,
      audioBitrate: "80k",
      preset: "medium",
      maxWidth: 854,
      maxHeight: 480,
    };
  }

  if (
    rel.includes("/examples/") ||
    rel.includes("/articulation/") ||
    rel.includes("/seeing-speech/") ||
    rel.includes("/animation/")
  ) {
    return {
      name: "articulation-detail",
      crf: 23,
      audioBitrate: "96k",
      preset: "medium",
      maxWidth: 854,
      maxHeight: 480,
    };
  }

  return {
    name: "phoneme-lesson",
    crf: 24,
    audioBitrate: "80k",
    preset: "medium",
    maxWidth: 854,
    maxHeight: 480,
  };
}

function ffmpegArgs({ input, output, summary, profile }) {
  const scaleFilter = `scale=w=min(${profile.maxWidth}\\,iw):h=min(${profile.maxHeight}\\,ih):force_original_aspect_ratio=decrease`;
  const args = [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    input,
    "-map",
    "0:v:0",
  ];

  if (summary.audio) {
    args.push("-map", "0:a:0");
  }

  args.push(
    "-vf",
    scaleFilter,
    "-c:v",
    "libx264",
    "-preset",
    profile.preset,
    "-crf",
    String(profile.crf),
    "-pix_fmt",
    "yuv420p",
  );

  if (summary.audio) {
    args.push("-c:a", "aac", "-b:a", profile.audioBitrate, "-ac", "1", "-ar", "48000");
  } else {
    args.push("-an");
  }

  args.push("-movflags", "+faststart", output);
  return args;
}

function validateCandidate({ original, candidate }) {
  if (!candidate.video?.width || !candidate.video?.height) {
    return "candidate has no readable video stream";
  }

  if (original.audio && !candidate.audio) {
    return "candidate lost audio stream";
  }

  if (original.duration && candidate.duration) {
    const maxDelta = Math.max(1.5, original.duration * 0.02);
    if (Math.abs(original.duration - candidate.duration) > maxDelta) {
      return `duration changed too much (${original.duration.toFixed(2)}s -> ${candidate.duration.toFixed(2)}s)`;
    }
  }

  const savingPercent = ((original.bytes - candidate.bytes) / original.bytes) * 100;
  if (savingPercent < minSavingPercent) {
    return `saving below ${minSavingPercent}% (${savingPercent.toFixed(1)}%)`;
  }

  return null;
}

async function backupAll(videos) {
  for (const filePath of videos) {
    const relative = path.relative(videoRoot, filePath);
    const backupPath = path.join(backupRoot, relative);
    await mkdir(path.dirname(backupPath), { recursive: true });
    await copyFile(filePath, backupPath);
  }
}

async function compressOne(original) {
  if (path.extname(original.filePath).toLowerCase() !== ".mp4") {
    return {
      status: "skipped",
      reason: "non-mp4 source path would require reference migration",
      original,
    };
  }

  const profile = compressionProfile(original);
  const tempPath = path.join(tmpRoot, original.relativePath);
  await mkdir(path.dirname(tempPath), { recursive: true });

  await execFileAsync(
    "ffmpeg",
    ffmpegArgs({
      input: original.filePath,
      output: tempPath,
      summary: original,
      profile,
    }),
    { maxBuffer: 1024 * 1024 * 8 },
  );

  const candidate = await summarizeVideo(tempPath);
  const validationError = validateCandidate({ original, candidate });
  if (validationError) {
    return {
      status: "skipped",
      reason: validationError,
      original,
      candidate,
      profile,
    };
  }

  await copyFile(tempPath, original.filePath);
  const replaced = await summarizeVideo(original.filePath);

  return {
    status: "replaced",
    reason: null,
    original,
    candidate: replaced,
    profile,
    savedBytes: original.bytes - replaced.bytes,
    savedPercent: ((original.bytes - replaced.bytes) / original.bytes) * 100,
  };
}

function groupSummary(items) {
  const byProfile = new Map();
  for (const item of items) {
    const profile = item.profile?.name ?? compressionProfile(item.original).name;
    byProfile.set(profile, (byProfile.get(profile) ?? 0) + 1);
  }
  return Object.fromEntries([...byProfile.entries()].sort());
}

async function writeReports({ mode, originals, results }) {
  await mkdir(targetRoot, { recursive: true });
  const replaced = results.filter((item) => item.status === "replaced");
  const skipped = results.filter((item) => item.status === "skipped");
  const originalBytes = originals.reduce((sum, item) => sum + item.bytes, 0);
  const finalBytes = results.reduce(
    (sum, item) =>
      sum +
      (item.status === "replaced" && item.candidate
        ? item.candidate.bytes
        : item.original.bytes),
    0,
  );
  const savedBytes = originalBytes - finalBytes;
  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    videoRoot,
    backupRoot: mode === "dry-run" ? null : backupRoot,
    minSavingPercent,
    totals: {
      checked: originals.length,
      replaced: replaced.length,
      skipped: skipped.length,
      originalBytes,
      finalBytes,
      savedBytes,
      originalMb: bytesToMb(originalBytes),
      finalMb: bytesToMb(finalBytes),
      savedMb: bytesToMb(savedBytes),
      savedPercent: originalBytes ? (savedBytes / originalBytes) * 100 : 0,
    },
    byProfile: groupSummary(results),
    results,
  };

  await writeFile(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const topSavings = [...replaced]
    .sort((left, right) => right.savedBytes - left.savedBytes)
    .slice(0, 20);
  const skippedReasons = new Map();
  for (const item of skipped) {
    skippedReasons.set(item.reason, (skippedReasons.get(item.reason) ?? 0) + 1);
  }

  const markdown = [
    "# SpeakRight Video Compression Report",
    "",
    `- Mode: ${mode}`,
    `- Checked: ${report.totals.checked}`,
    `- Replaced: ${report.totals.replaced}`,
    `- Skipped: ${report.totals.skipped}`,
    `- Original size: ${report.totals.originalMb} MB`,
    `- Final size: ${report.totals.finalMb} MB`,
    `- Saved: ${report.totals.savedMb} MB (${report.totals.savedPercent.toFixed(1)}%)`,
    `- Backup: ${report.backupRoot ?? "not created in dry-run"}`,
    "",
    "## Top Savings",
    "",
    "| Saved MB | Saved % | File |",
    "| ---: | ---: | --- |",
    ...topSavings.map(
      (item) =>
        `| ${bytesToMb(item.savedBytes)} | ${item.savedPercent.toFixed(1)} | ${item.original.relativePath} |`,
    ),
    "",
    "## Skipped Reasons",
    "",
    ...[...skippedReasons.entries()].map(([reason, count]) => `- ${count}: ${reason}`),
    "",
  ].join("\n");

  await writeFile(reportMarkdownPath, markdown, "utf8");
  return report;
}

async function main() {
  const videos = (await collectVideos()).slice(0, limit ?? undefined);
  const originals = [];
  for (const filePath of videos) {
    originals.push(await summarizeVideo(filePath));
  }

  if (dryRun) {
    const results = originals.map((original) => ({
      status: "planned",
      original,
      profile: compressionProfile(original),
    }));
    const report = await writeReports({ mode: "dry-run", originals, results });
    console.log(
      `Video compression dry-run: ${report.totals.checked} files, ${report.totals.originalMb} MB total.`,
    );
    console.log(`Report: ${reportJsonPath}`);
    return;
  }

  await backupAll(videos);

  const results = [];
  for (const [index, original] of originals.entries()) {
    process.stdout.write(
      `[${index + 1}/${originals.length}] ${original.relativePath} (${bytesToMb(original.bytes)} MB) ... `,
    );
    try {
      const result = await compressOne(original);
      results.push(result);
      if (result.status === "replaced") {
        console.log(
          `replaced, saved ${bytesToMb(result.savedBytes)} MB (${result.savedPercent.toFixed(1)}%)`,
        );
      } else {
        console.log(`skipped: ${result.reason}`);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      results.push({ status: "failed", reason, original, profile: compressionProfile(original) });
      console.log(`failed: ${reason}`);
    }
  }

  const report = await writeReports({ mode: "confirm", originals, results });
  console.log(
    `Video compression finished: ${report.totals.replaced}/${report.totals.checked} replaced, saved ${report.totals.savedMb} MB (${report.totals.savedPercent.toFixed(1)}%).`,
  );
  console.log(`Backup: ${backupRoot}`);
  console.log(`Report: ${reportJsonPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
