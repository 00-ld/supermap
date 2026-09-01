const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require(
  path.resolve(__dirname, "..", "frontend", "node_modules", "playwright"),
);

const frontendDir = path.resolve(__dirname, "..", "frontend");
const testPort = Number(process.env.SCREEN_PORT || 5174);
const url = process.env.SCREEN_URL || `http://127.0.0.1:${testPort}/#/screen`;
const outDir = path.resolve(
  __dirname,
  "..",
  "frontend",
  "logs",
  `codex-supermap-road-route-${Date.now()}`,
);
const anomalousTileNames = [
  "Tile_-0001_-0002_0000_0000_0000.b3dm",
  "Tile_-0001_0001_0000_0000_0000.b3dm",
  "Tile_0000_-0002_0000_0000_0000.b3dm",
  "Tile_0000_-0003_0000_0000_0000.b3dm",
  "Tile_0000_0001_0000_0000_0000.b3dm",
];

function sleep(timeoutMs) {
  return new Promise((resolve) => setTimeout(resolve, timeoutMs));
}

async function waitForVite() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${testPort}/`);
      if (response.ok) return;
    } catch {
      // Vite 正在启动。
    }
    await sleep(500);
  }
  throw new Error(`临时 Vite 服务未在 ${testPort} 端口就绪`);
}

function startVite() {
  const viteEntry = path.resolve(
    frontendDir,
    "node_modules",
    "vite",
    "bin",
    "vite.js",
  );
  return spawn(
    process.execPath,
    [viteEntry, "--host", "127.0.0.1", "--port", String(testPort)],
    {
      cwd: frontendDir,
      stdio: "ignore",
      windowsHide: true,
    },
  );
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const vite = startVite();
  try {
    await waitForVite();
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 1600, height: 960 },
      deviceScaleFactor: 1,
    });
    const consoleLogs = [];
    page.on("console", (message) =>
      consoleLogs.push(`${message.type()}: ${message.text()}`),
    );

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(
      () => Boolean(window.__supermapCupDebug?.viewer),
      null,
      { timeout: 60000 },
    );
    await sleep(12000);
    const hiddenTilePatterns = [
      ...(process.env.HIDE_ANOMALOUS_TILES === "1" ? anomalousTileNames : []),
      ...String(process.env.HIDE_TILE_PATTERNS || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ];
    if (hiddenTilePatterns.length) {
      await page.evaluate(
        ({ tileNames, hideModelsOnly }) => {
          const debug = window.__supermapCupDebug || {};
          const primitives = debug.viewer?.scene?.primitives;
          const stack = [];
          for (let index = 0; index < (primitives?.length || 0); index += 1) {
            const primitive = primitives.get(index);
            if (primitive?.root) stack.push(primitive.root);
          }
          const hidden = [];
          const seen = new Set();
          while (stack.length) {
            const tile = stack.pop();
            if (!tile || seen.has(tile)) continue;
            seen.add(tile);
            let content = null;
            try {
              content = tile.content || tile._content || null;
            } catch {
              content = null;
            }
            const uri =
              content?.uri ||
              tile._contentResource?._url ||
              tile._header?.content?.uri ||
              "";
            if (tileNames.some((name) => String(uri).includes(name))) {
              if (content && typeof content === "object") {
                content.show = false;
                if (content._model && typeof content._model === "object") {
                  content._model.show = false;
                }
              }
              if (!hideModelsOnly) tile.show = false;
              hidden.push(String(uri).split("/").pop());
            }
            if (tile.children) stack.push(...tile.children);
          }
          debug.viewer?.scene?.requestRender?.();
          return hidden;
        },
        {
          tileNames: hiddenTilePatterns,
          hideModelsOnly: process.env.HIDE_MODELS_ONLY === "1",
        },
      );
      await sleep(800);
    }
    await page.evaluate(() => {
      window.__supermapCupDebug?.flyToSensor?.("PL-10L");
      window.__supermapCupDebug?.startEvacuationStartSelection?.();
    });
    await sleep(4500);
    const canvasBox = await page.locator("canvas").first().boundingBox();
    if (!canvasBox) throw new Error("未找到三维画布");
    await page.mouse.click(
      canvasBox.x + canvasBox.width / 2,
      canvasBox.y + canvasBox.height / 2,
    );
    await sleep(900);
    await page.evaluate(async () => {
      await window.__supermapCupDebug?.runEvacuationDemo?.();
    });
    await sleep(Number(process.env.ROUTE_SETTLE_MS || 2200));
    await page.screenshot({
      path: path.join(outDir, "route-ready.png"),
      fullPage: false,
    });

    const state = await page.evaluate(() => {
      const debug = window.__supermapCupDebug || {};
      const runtime = window.SuperMap3D || window.Cesium || window.SuperMap;
      const entities =
        debug.viewer?.entities?._entities?._array ||
        debug.viewer?.entities?.values ||
        [];
      const routeEntities = entities
        .filter((entity) =>
          /疏散路线|安全出口|疏散起点/.test(String(entity?.name || "")),
        )
        .map((entity) => String(entity?.name || ""));
      const routeStartEntity = entities.find(
        (entity) => String(entity?.name || "") === "疏散起点",
      );
      const routeStartPosition = routeStartEntity?.position?.getValue?.(
        debug.viewer?.clock?.currentTime,
      );
      const routeStartCartographic =
        runtime?.Cartographic?.fromCartesian?.(routeStartPosition);
      const routeStartDegrees =
        routeStartCartographic && runtime?.Math?.toDegrees
          ? {
              longitude: runtime.Math.toDegrees(
                routeStartCartographic.longitude,
              ),
              latitude: runtime.Math.toDegrees(routeStartCartographic.latitude),
              height: Number(routeStartCartographic.height || 0),
            }
          : null;
      const routeCamera = debug.viewer?.scene?.camera || debug.viewer?.camera;
      const routeCameraCartographic = routeCamera?.positionCartographic;
      const routeCameraDegrees =
        routeCameraCartographic && runtime?.Math?.toDegrees
          ? {
              longitude: runtime.Math.toDegrees(
                routeCameraCartographic.longitude,
              ),
              latitude: runtime.Math.toDegrees(
                routeCameraCartographic.latitude,
              ),
              height: Number(routeCameraCartographic.height || 0),
            }
          : null;
      const resultText = Array.from(
        document.querySelectorAll(".algorithm-result"),
      ).map((node) => node.textContent?.trim() || "");
      const navigationInset = document.querySelector(".route-navigation-inset");
      const navigationRoute = navigationInset
        ? {
            visible: true,
            pointBadge:
              navigationInset.querySelector("header b")?.textContent?.trim() ||
              "",
            routePolyline:
              navigationInset
                .querySelector(".route-line")
                ?.getAttribute("points") || "",
            exitLabel:
              navigationInset
                .querySelector("footer span")
                ?.textContent?.trim() || "",
          }
        : { visible: false, pointBadge: "", routePolyline: "", exitLabel: "" };
      const primitives = debug.viewer?.scene?.primitives;
      let tileset = null;
      for (let index = 0; index < (primitives?.length || 0); index += 1) {
        const primitive = primitives.get(index);
        if (primitive?.root) {
          tileset = primitive;
          break;
        }
      }
      const tileStates = { ready: 0, loading: 0, failed: 0, content: 0 };
      const stack = tileset?.root ? [tileset.root] : [];
      const seen = new Set();
      while (stack.length) {
        const tile = stack.pop();
        if (!tile || seen.has(tile)) continue;
        seen.add(tile);
        let content = null;
        try {
          content = tile.content || tile._content || null;
        } catch {
          content = null;
        }
        if (content) tileStates.content += 1;
        if (tile._contentState === 2 || tile._contentState === 3)
          tileStates.ready += 1;
        if (tile._contentState === 1) tileStates.loading += 1;
        if (tile._contentState === 4) tileStates.failed += 1;
        if (tile.children) stack.push(...tile.children);
      }
      return {
        messages: debug.messages || [],
        routeEntities,
        routeStartDegrees,
        routeCameraDegrees,
        resultText,
        navigationRoute,
        evacuationVerification:
          debug.getEvacuationResult?.()?.networkVerification || null,
        exitId: debug.getEvacuationResult?.()?.exitId || null,
        tilesLoaded: tileset?._tilesLoaded || false,
        tileStates,
      };
    });
    await page.screenshot({
      path: path.join(outDir, "route.png"),
      fullPage: false,
    });
    await page.evaluate(() => window.__supermapCupDebug?.focusScene?.());
    await sleep(3800);
    const overviewTiles = await page.evaluate(() => {
      const debug = window.__supermapCupDebug || {};
      const runtime = window.SuperMap3D || window.Cesium || window.SuperMap;
      const primitives = debug.viewer?.scene?.primitives;
      let tileset = null;
      for (let index = 0; index < (primitives?.length || 0); index += 1) {
        const primitive = primitives.get(index);
        if (primitive?.root) {
          tileset = primitive;
          break;
        }
      }
      const stateNames = ["unloaded", "loading", "loaded", "ready", "failed"];
      const contents = [];
      const stack = tileset?.root ? [tileset.root] : [];
      const seen = new Set();
      while (stack.length) {
        const tile = stack.pop();
        if (!tile || seen.has(tile)) continue;
        seen.add(tile);
        let content = null;
        try {
          content = tile.content || tile._content || null;
        } catch {
          content = null;
        }
        const uri =
          content?.uri ||
          tile._contentResource?._url ||
          tile._header?.content?.uri;
        if (
          uri &&
          (tile._selected || tile.selected || tile._contentState === 3)
        ) {
          contents.push({
            uri: String(uri).split("/").pop(),
            selected: Boolean(tile._selected || tile.selected),
            state: stateNames[tile._contentState] || String(tile._contentState),
            geometricError: tile.geometricError,
          });
        }
        if (tile.children) stack.push(...tile.children);
      }
      const camera = debug.viewer?.scene?.camera || debug.viewer?.camera;
      const position = camera?.positionCartographic;
      const sphereCenter =
        tileset?.boundingSphere?.center || tileset?._boundingSphere?.center;
      const centerCartographic =
        runtime?.Cartographic?.fromCartesian?.(sphereCenter);
      const targetCenter = runtime?.Cartesian3?.fromDegrees?.(
        113.569463,
        34.76965,
        8,
      );
      const centerDegrees =
        centerCartographic && runtime?.Math?.toDegrees
          ? {
              longitude: runtime.Math.toDegrees(centerCartographic.longitude),
              latitude: runtime.Math.toDegrees(centerCartographic.latitude),
              height: Number(centerCartographic.height || 0),
            }
          : null;
      return {
        selectedContents: contents,
        cameraHeight: Number(position?.height || 0),
        tilesetRadius: Number(tileset?.boundingSphere?.radius || 0),
        centerDegrees,
        targetCenterDelta:
          sphereCenter && targetCenter
            ? {
                x: Number(targetCenter.x - sphereCenter.x),
                y: Number(targetCenter.y - sphereCenter.y),
                z: Number(targetCenter.z - sphereCenter.z),
              }
            : null,
      };
    });
    await page.screenshot({
      path: path.join(outDir, "overview-after-route.png"),
      fullPage: false,
    });
    if (process.env.CAPTURE_CLOSE_MODEL === "1") {
      await page.evaluate(
        (range) => {
          const debug = window.__supermapCupDebug || {};
          const runtime = window.SuperMap3D || window.Cesium || window.SuperMap;
          const camera = debug.viewer?.scene?.camera || debug.viewer?.camera;
          const primitives = debug.viewer?.scene?.primitives;
          let tileset = null;
          for (let index = 0; index < (primitives?.length || 0); index += 1) {
            const primitive = primitives.get(index);
            if (primitive?.root) {
              tileset = primitive;
              break;
            }
          }
          if (
            !camera?.flyToBoundingSphere ||
            !tileset?.boundingSphere ||
            !runtime?.HeadingPitchRange
          )
            return;
          const radians = runtime.Math?.toRadians || ((value) => value);
          camera.flyToBoundingSphere(tileset.boundingSphere, {
            offset: new runtime.HeadingPitchRange(
              radians(18),
              radians(-34),
              range,
            ),
            duration: 0.8,
          });
        },
        Number(process.env.CLOSE_MODEL_RANGE || 460),
      );
      await sleep(Number(process.env.CLOSE_MODEL_WAIT_MS || 1600));
      await page.screenshot({
        path: path.join(outDir, "model-core-close.png"),
        fullPage: false,
      });
    }
    fs.writeFileSync(
      path.join(outDir, "state.json"),
      JSON.stringify({ state, consoleLogs }, null, 2),
    );
    await browser.close();
    const center = overviewTiles.centerDegrees;
    const isGeoreferenceValid = Boolean(
      center &&
      Math.abs(center.longitude - 113.569463) < 0.0002 &&
      Math.abs(center.latitude - 34.76965) < 0.0002 &&
      Math.abs(center.height - 8) < 20,
    );
    const routeStart = state.routeStartDegrees;
    const isRouteElevationValid = Boolean(
      routeStart && Math.abs(routeStart.height - 8) < 20,
    );
    const routeCamera = state.routeCameraDegrees;
    const isRouteCameraValid = Boolean(
      routeCamera &&
      Math.abs(routeCamera.longitude - 113.569463) < 0.01 &&
      Math.abs(routeCamera.latitude - 34.76965) < 0.01,
    );
    console.log(
      JSON.stringify(
        {
          outDir,
          state,
          overviewTiles,
          isGeoreferenceValid,
          isRouteElevationValid,
          isRouteCameraValid,
          routeLogs: consoleLogs.filter((line) =>
            /\[F2\]|道路路径|网络分析|疏散/i.test(line),
          ),
        },
        null,
        2,
      ),
    );
    if (!isGeoreferenceValid) {
      throw new Error("3D Tiles模型中心未落在目标经纬度地表，拒绝验收");
    }
    if (!isRouteElevationValid) {
      throw new Error("疏散路线未落在3D Tiles地表，拒绝验收");
    }
    if (!isRouteCameraValid) {
      throw new Error("疏散路线镜头未定位到3D Tiles园区，拒绝验收");
    }
  } finally {
    vite.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
