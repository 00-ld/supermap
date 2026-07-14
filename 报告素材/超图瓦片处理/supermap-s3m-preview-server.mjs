import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const host = "127.0.0.1";
const port = Number(process.env.SUPERMAP_S3M_PREVIEW_PORT || 8098);

const roots = {
  "/supermap3d/": "D:/BaiduNetdiskDownload/supermap-iclient3d-for-webgl_webgpu-2025u1/Build/SuperMap3D/",
  "/tiles/processing-factory/":
    "G:/竞赛/超图杯/园区大屏部署/瓦片/厂房三维瓦片/加工厂房/result_ImportFBX/",
  "/tiles/raw-warehouse/": "G:/竞赛/超图杯/园区大屏部署/瓦片/厂房三维瓦片/原材料仓库/",
  "/tiles/production-plant/":
    "G:/竞赛/超图杯/园区大屏部署/瓦片/厂房三维瓦片/生产装置厂房/result_ImportFBX/",
  "/tiles/heat-exchanger/": "G:/竞赛/超图杯/园区大屏部署/瓦片/设备三维瓦片/换热器/",
  "/tiles/vertical-tank/": "G:/竞赛/超图杯/园区大屏部署/瓦片/设备三维瓦片/立式罐子/",
  "/tiles/distillation-tower/": "G:/竞赛/超图杯/园区大屏部署/瓦片/设备三维瓦片/蒸馏塔/",
};

const layerConfigs = {
  "/tiles/processing-factory/config": "/tiles/processing-factory/result_ImportFBX.scp",
  "/tiles/raw-warehouse/config": "/tiles/raw-warehouse/result_ImportFBX.scp",
  "/tiles/production-plant/config": "/tiles/production-plant/result_ImportFBX.scp",
  "/tiles/heat-exchanger/config": "/tiles/heat-exchanger/换热器.scp",
  "/tiles/vertical-tank/config": "/tiles/vertical-tank/罐子.scp",
  "/tiles/distillation-tower/config": "/tiles/distillation-tower/蒸馏塔.scp",
};

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".scp", "application/json; charset=utf-8"],
  [".db", "application/octet-stream"],
  [".s3mb", "application/octet-stream"],
  [".wasm", "application/wasm"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".svg", "image/svg+xml"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".ttf", "font/ttf"],
]);

function logRequest(status, urlPath, filePath = "") {
  const line = `${new Date().toISOString()} ${status} ${urlPath}${filePath ? ` -> ${filePath}` : ""}\n`;
  fs.appendFile(path.join(__dirname, "preview-requests.log"), line, () => {});
}

function sendFile(res, filePath) {
  fs.stat(filePath, (statError, stat) => {
    if (statError || !stat.isFile()) {
      logRequest(404, "FILE", filePath);
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes.get(ext) || "application/octet-stream",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache",
    });
    logRequest(200, "FILE", filePath);
    fs.createReadStream(filePath).pipe(res);
  });
}

function resolveMappedFile(urlPath) {
  if (urlPath === "/" || urlPath === "/index.html") {
    return path.join(__dirname, "supermap-s3m-preview.html");
  }
  if (urlPath === "/manager/license.json") {
    return path.join(__dirname, "manager-license.json");
  }
  if (layerConfigs[urlPath]) {
    return resolveMappedFile(layerConfigs[urlPath]);
  }
  for (const [prefix, root] of Object.entries(roots)) {
    if (urlPath.startsWith(prefix)) {
      const rel = decodeURIComponent(urlPath.slice(prefix.length));
      const normalizedRoot = path.resolve(root);
      if (rel.endsWith("data/path/attribute.json") || rel.endsWith(".scpattribute.json")) {
        return path.join(normalizedRoot, "attribute.json");
      }
      if (rel.endsWith("data/path/attribute.db") || rel.endsWith(".scpattribute.db")) {
        return path.join(normalizedRoot, "attribute.db");
      }
      const filePath = path.resolve(normalizedRoot, rel);
      if (!filePath.startsWith(normalizedRoot)) {
        return null;
      }
      return filePath;
    }
  }
  return null;
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url || "/", `http://${host}:${port}`);
  const filePath = resolveMappedFile(requestUrl.pathname);
  if (!filePath) {
    logRequest(404, requestUrl.pathname);
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  logRequest("MAP", requestUrl.pathname, filePath);
  sendFile(res, filePath);
});

server.listen(port, host, () => {
  console.log(`SuperMap S3M preview server: http://${host}:${port}/`);
});
