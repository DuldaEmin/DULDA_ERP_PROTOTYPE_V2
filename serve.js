const fs = require("fs");
const fsp = fs.promises;
const http = require("http");
const path = require("path");

const portArg = Number(process.argv[2]);
const port = Number.isFinite(portArg) && portArg > 0 ? portArg : 5500;
const root = __dirname;
const dataFile = path.join(root, "demo_state.json");
const historyDir = path.join(root, ".state-history");
const historyRetentionCount = 200;
const maxBodySize = 200 * 1024 * 1024;
const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};
let pdfBrowserPromise = null;

const mimeMap = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8", ...noCacheHeaders });
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > maxBodySize) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function sanitizeDownloadName(value) {
  const raw = String(value || "teslim-belgesi")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]+/g, "-")
    .replace(/\s+/g, "_");
  const normalized = raw || "teslim-belgesi";
  return normalized.slice(0, 96);
}

async function getPdfBrowser() {
  if (!pdfBrowserPromise) {
    let playwright;
    try {
      playwright = require("playwright");
    } catch (_) {
      throw new Error("playwright_not_available");
    }
    const chromium = playwright?.chromium;
    if (!chromium) throw new Error("playwright_not_available");
    pdfBrowserPromise = (async () => {
      const launchAttempts = [
        { headless: true },
        { headless: true, channel: "chrome" },
        { headless: true, channel: "msedge" },
      ];
      const errors = [];
      for (const options of launchAttempts) {
        try {
          return await chromium.launch(options);
        } catch (err) {
          const label = options.channel ? `channel:${options.channel}` : "bundled";
          errors.push(`${label}:${String(err?.message || err)}`);
        }
      }
      throw new Error(`playwright_launch_failed:${errors.join(" | ")}`);
    })();
  }
  return pdfBrowserPromise;
}

async function renderPdfFromHtml(html) {
  const browser = await getPdfBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.setContent(String(html || ""), { waitUntil: "domcontentloaded" });
    await page.emulateMedia({ media: "print" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
      preferCSSPageSize: true,
    });
    return pdfBuffer;
  } finally {
    await context.close();
  }
}

async function loadState() {
  try {
    const raw = await fsp.readFile(dataFile, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

function getStateTimestamp(state) {
  const ts = state?.meta?.updated_at || state?.meta?.created_at || "";
  const ms = Date.parse(ts);
  return Number.isFinite(ms) ? ms : 0;
}

function getStateRevision(state) {
  const revision = Number(state?.meta?.revision);
  return Number.isInteger(revision) && revision >= 0 ? revision : 0;
}

async function ensureHistoryDir() {
  await fsp.mkdir(historyDir, { recursive: true });
}

async function writeHistorySnapshot(state, label) {
  if (!state || typeof state !== "object") return;
  await ensureHistoryDir();
  const revision = getStateRevision(state);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const safeLabel = String(label || "snapshot").replace(/[^a-zA-Z0-9_-]+/g, "_");
  const fileName = `${stamp}_r${String(revision).padStart(6, "0")}_${safeLabel}.json`;
  await fsp.writeFile(path.join(historyDir, fileName), JSON.stringify(state, null, 2), "utf8");
}

async function pruneHistorySnapshots(limit = historyRetentionCount) {
  if (!Number.isInteger(limit) || limit < 1) return;
  let entries;
  try {
    entries = await fsp.readdir(historyDir, { withFileTypes: true });
  } catch (err) {
    if (err?.code === "ENOENT") return;
    throw err;
  }

  const files = entries
    .filter((entry) => entry?.isFile?.() && String(entry.name || "").toLowerCase().endsWith(".json"))
    .map((entry) => String(entry.name || ""))
    .sort()
    .reverse();

  const staleFiles = files.slice(limit);
  if (!staleFiles.length) return;

  await Promise.allSettled(
    staleFiles.map((fileName) => fsp.unlink(path.join(historyDir, fileName)))
  );
}

async function saveState(state, options = {}) {
  const current = await loadState();
  const baseRevision = Number(options?.baseRevision);
  const incomingTs = getStateTimestamp(state);
  const currentTs = getStateTimestamp(current);
  const currentRevision = getStateRevision(current);

  if (current && Number.isInteger(baseRevision) && baseRevision !== currentRevision) {
    return { written: false, stale: true, conflict: true, currentRevision };
  }

  // Prevent older payloads from overwriting newer state when revision is not provided.
  if (current && (!Number.isInteger(baseRevision)) && incomingTs > 0 && currentTs > 0 && incomingTs < currentTs) {
    return { written: false, stale: true, conflict: true, currentRevision };
  }

  const nextRevision = currentRevision + 1;
  if (!state.meta || typeof state.meta !== "object") state.meta = {};
  state.meta.revision = nextRevision;

  if (current) {
    await writeHistorySnapshot(current, "before-save");
  }
  const tmp = `${dataFile}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(state, null, 2), "utf8");
  await fsp.rename(tmp, dataFile);
  await writeHistorySnapshot(state, "after-save");
  try {
    await pruneHistorySnapshots();
  } catch (err) {
    console.warn("History snapshot cleanup failed.", err);
  }
  return { written: true, stale: false, conflict: false, revision: nextRevision };
}

const server = http.createServer(async (req, res) => {
  const reqPath = decodeURIComponent((req.url || "/").split("?")[0]);

  if (req.method === "GET" && reqPath === "/api/state") {
    try {
      const state = await loadState();
      return sendJson(res, 200, { ok: true, state });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: "state_read_failed" });
    }
  }

  if (req.method === "POST" && reqPath === "/api/state") {
    try {
      const body = await readBody(req);
      const payload = JSON.parse(body || "{}");
      const state = payload?.state || payload;
      const baseRevision = payload?.baseRevision;
      if (!state || typeof state !== "object") {
        return sendJson(res, 400, { ok: false, error: "invalid_state" });
      }

      const result = await saveState(state, { baseRevision });
      if (result?.conflict) {
        return sendJson(res, 409, { ok: false, error: "save_conflict", ...result });
      }
      return sendJson(res, 200, { ok: true, ...result });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: "state_write_failed" });
    }
  }

  if (req.method === "POST" && reqPath === "/api/dispatch-pdf") {
    try {
      const body = await readBody(req);
      const payload = JSON.parse(body || "{}");
      const html = String(payload?.html || "");
      if (!html.trim()) {
        return sendJson(res, 400, { ok: false, error: "invalid_html" });
      }
      const fileName = sanitizeDownloadName(payload?.fileName || "teslim-belgesi");
      const pdfBuffer = await renderPdfFromHtml(html);
      res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
        ...noCacheHeaders,
      });
      res.end(pdfBuffer);
      return;
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: "pdf_build_failed", message: String(err?.message || err) });
    }
  }

  const safePath = path.normalize(reqPath).replace(/^([.][.][/\\])+/, "");
  let filePath = path.join(root, safePath === "/" ? "index.html" : safePath);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (statErr, stat) => {
    if (!statErr && stat.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", ...noCacheHeaders });
        res.end("Not Found");
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeMap[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType, ...noCacheHeaders });
      res.end(data);
    });
  });
});

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(`Port ${port} kullanımda.`);
    process.exit(1);
  }
  console.error(err);
  process.exit(1);
});

server.listen(port, () => {
  console.log(`Dulda ERP demo hazır: http://localhost:${port}/index.html`);
  console.log(`Kalıcı veri dosyası: ${dataFile}`);
});

process.on("exit", () => {
  if (!pdfBrowserPromise) return;
  Promise.resolve(pdfBrowserPromise)
    .then((browser) => browser?.close?.())
    .catch(() => {});
});
