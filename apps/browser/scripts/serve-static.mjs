import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.cwd(), "out");
const port = Number(process.env.PORT || 4173);

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mp3", "audio/mpeg"],
  [".mp4", "video/mp4"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".wasm", "application/wasm"],
  [".wav", "audio/wav"],
  [".webp", "image/webp"],
]);

function resolveRequestPath(urlPath) {
  const normalized = normalize(decodeURIComponent(urlPath.split("?")[0]));
  const safePath = normalized.replace(/^(\.\.[/\\])+/, "");
  const candidate = join(root, safePath);
  if (!candidate.startsWith(root)) return null;
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  const indexPath = join(candidate, "index.html");
  if (existsSync(indexPath)) return indexPath;
  const htmlPath = `${candidate}.html`;
  if (existsSync(htmlPath) && statSync(htmlPath).isFile()) return htmlPath;
  return join(root, "index.html");
}

if (!existsSync(root)) {
  console.error("Static export not found. Run npm run build:static first.");
  process.exit(1);
}

createServer((request, response) => {
  const filePath = resolveRequestPath(request.url || "/");
  if (!filePath || !existsSync(filePath)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type":
      contentTypes.get(extname(filePath)) ?? "application/octet-stream",
  });
  createReadStream(filePath).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`SpeakRight Browser static server: http://127.0.0.1:${port}`);
});
