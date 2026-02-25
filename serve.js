const fs = require("fs");
const fsp = fs.promises;
const http = require("http");
const path = require("path");

const portArg = Number(process.argv[2]);
const port = Number.isFinite(portArg) && portArg > 0 ? portArg : 5500;
const root = __dirname;
const dataFile = path.join(root, "demo_state.json");
const maxBodySize = 20 * 1024 * 1024;

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
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
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

async function loadState() {
  try {
    const raw = await fsp.readFile(dataFile, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

async function saveState(state) {
  const tmp = `${dataFile}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(state, null, 2), "utf8");
  await fsp.rename(tmp, dataFile);
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
      if (!state || typeof state !== "object") {
        return sendJson(res, 400, { ok: false, error: "invalid_state" });
      }

      await saveState(state);
      return sendJson(res, 200, { ok: true });
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: "state_write_failed" });
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
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not Found");
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeMap[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
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
