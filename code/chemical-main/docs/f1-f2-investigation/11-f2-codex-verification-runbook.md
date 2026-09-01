# F2 三维场景验证 Codex 执行指令（Runbook）

> 对象：Codex（兜底执行端）
> 目标：验证 F2 代码改动（iServer 链路 D 锚点逆变换 + 全局锚点 B→A）三维落图是否正确
> 前置状态：代码改动完成、探针已加（三条 `[F2]` console.log + `[F6]` 越界告警）、`vue-tsc` 通过
> 交付物：三条 `[F2]` 日志原文 + `[F6]` 告警（若有）+ 多角度截图，回传给 Claude 判读
>
> 本脚本零歧义、可复制粘贴执行。所有命令已写死绝对路径，不要改路径。所有判据数值已从源码核对，不要自行推断。

---

## 0. 前置准备

### 0.0 已由 Claude 核实的状态（2026-07-18 22:50，codex 无需重复核实，直接跳到第 2 节）

- **三服务已起并监听**：前端 5173（PID 48920）、后端 8081（PID 45104）、算法 8000（PID 44788，health 200 version 3.0.0）。
- **iServer 已可达且无需凭据**：`https://www.chemgas.lab6119.xyz/iserver/services.json` → 200；`.../networkanalyst/Park_RoadNetwork_Auto_N@chemical_park_vectors_cgcs2000.json` → 200。公共服务，curl 即用，不读密码。
- **本机 .venv 已修复**：uv trampoline 坑已绕过，算法服务用原生 venv python 跑，codex 不要重建 venv。

### 0.1 iServer 凭据 —— 本任务不读取

原 runbook 此处让 codex 读 `E:/ObsidianLearningGraph/80_Vault/Passwords.md`。**经 Claude 核实，F2 验证无需该凭据**（iServer 是公共服务，第 1 节 curl 域名即 200）。**codex 跳过此步，不要读 Passwords.md**，避免密码进入 codex session 日志。仅当第 1 节 curl 返回非 200、确需登服务器重启 iServer 时，才回到 Claude 处理（不在本 runbook 内读密码）。

**注意：18090 是 iServer 容器内部端口**（证据：docs/07 第 152 行，feature 返回 path 字段里出现 `http://127.0.0.1:18090/...`）。**外部访问走域名 `https://www.chemgas.lab6119.xyz`**，不是本机 18090。验证用 curl 域名，不直连 18090。

### 0.2 Node 25 绕 check:node

项目 dev server 要求 Node 25，但 `npm run dev` 前的 `check:node` 会因版本检测挡路。按 memory `chemical-park-local-run-env` 绕过：直接调 vite，跳过 check:node 脚本。

```bash
cd /g/竞赛/超图杯/code/chemical-main/frontend
node --version    # 确认 Node 25.x
npx vite --host 127.0.0.1 --port 5173 --strictPort
```

> 若 `npm run dev` 已配置为直跑 vite 不带 check:node，用 `npm run dev` 亦可。两种方式任选其一，只要 vite 起在 5173 即可。

---

## 1. 启动 iServer

### 1.1 确认 iServer 可达（首选，外部验证）

iServer 部署在远程服务器，外部经 `https://www.chemgas.lab6119.xyz` 访问，容器内部 18090 端口。先 curl 一个 networkanalyst 端点确认 200：

```bash
curl -sS -o /dev/null -w "%{http_code}\n" "https://www.chemgas.lab6119.xyz/iserver/services.json"
```

预期：HTTP 200，返回 iServer 服务列表 JSON。

### 1.2 验证 networkanalyst 端点（F2 关键服务）

```bash
curl -sS -o /dev/null -w "%{http_code}\n" "https://www.chemgas.lab6119.xyz/iserver/services/transportationAnalyst-chemical_park_vectors_cgcs2000_network-4/rest/networkanalyst/Park_RoadNetwork_Auto_N@chemical_park_vectors_cgcs2000.json"
```

预期：HTTP 200。

### 1.3 若 iServer 不可达

按 docs/07、docs/09 第 4 节及项目 `run-local.bat` 与 docs 说明排查：
- 读私密 Passwords.md 拿服务器 SSH 凭据，登服务器确认 iServer 容器在跑、18090 端口监听。
- 若 iServer 容器未启动：登服务器，用项目部署脚本或 docker 启动 iServer 容器，确认 18090 端口监听且 nginx/反代把 `https://www.chemgas.lab6119.xyz/iserver/*` 转发到容器 18090。
- 重启后重跑 1.1 / 1.2，确认 200 再继续。

> iServer 重发布（数据集 D→A 平移）不在本脚本范围。本脚本只验证已重发布后的落图。

---

## 2. 启动 dev server

```bash
cd /g/竞赛/超图杯/code/chemical-main/frontend
npx vite --host 127.0.0.1 --port 5173 --strictPort
```

等待 vite 输出形如：

```
  VITE vx.x.x  ready in xxx ms
  ➜  Local:   http://127.0.0.1:5173/
  ➜  Network: use --host to expose
```

看到 `Local: http://127.0.0.1:5173`（或 `localhost:5173`）即 dev server 就绪。保持该终端运行。

> 若端口 5173 被占，先 `netstat -ano | findstr :5173` 找 PID，`taskkill /PID <PID> /F` 释放，再重跑。或用 `--port 5174` 但后续浏览器地址要同步改。

---

## 3. 触发单建筑 iServer 疏散

### 3.1 打开页面 + DevTools

1. 浏览器打开 `http://127.0.0.1:5173/`，进入智慧地图页（smart_map）。
2. 按 F12 打开 DevTools，切到 Console 标签。
3. Console 顶部筛选框输入 `[F2]`，便于聚焦探针日志（截图前可清空筛选看全量，再切回 `[F2]` 截探针）。

### 3.2 点击"当前建筑路径"按钮（单建筑，走 SuperMap iServer 链路）

UI 入口（已从源码核对，零歧义）：
- 按钮文案：**「当前建筑路径」**（图标 `fa-route`）
- 源码位置：`frontend/src/views/smart_map/components/SmartMapEmergencyScenarioPanel.vue:176-178`
- emit 链：`@click="$emit('run-evacuation')"` → `index.vue:33 @run-evacuation="runEvacuationPlanning()"` → `useSmartMapEvacuationPlanningActions.ts:221 runEvacuationPlanning` → SuperMap iServer 链路（payload 含 startPoint，走 `runSuperMapNetworkEvacuation`）

点击「当前建筑路径」按钮触发单建筑疏散。

### 3.3 绝对不要点的按钮

- **「全建筑路径」**（图标 `fa-people-arrows-left-right`，`SmartMapEmergencyScenarioPanel.vue:179-181`）→ `index.vue:30 @run-batch-evacuation="runBatchEvacuationPlanning({ displayMode: 'all' })"` → **批量**，走 Python 兜底链路，会触发 F7 的"批量...降级 Python"标注。**不是本次验证目标，误点会污染判据。**

### 3.4 误触批量的识别

若 console 出现 `superMapNetworkFailure` 标注或"批量...降级 Python"字样，说明误触了批量入口（index.vue:30）。回到 3.2 点「当前建筑路径」重做。

---

## 4. 回收 console 日志（三条 [F2] 探针 + F6 告警）

触发单建筑疏散后，console 应依次出现以下日志。逐条核对判据。

### 4.1 探针 1：iServer 原始 path 首尾点

- **源码**：`frontend/src/views/smart_map/useSmartMapAlgorithmExecutors.ts:429` 与 `:442`
- **tag**：`extractSuperMapPath[guides]` 或 `extractSuperMapPath[route]`
- **日志格式**：
  ```
  [F2] extractSuperMapPath[guides] n=<点数> head=(<hx>,<hy>) tail=(<tx>,<ty>)
  ```

**判据**：`head` / `tail` 的 `x ∈ [457600, 457900]`，`y ∈ [3856000, 3856300]`（D 系，CGCS2000 EPSG:4547，iServer 数据集锚点 D `457692.843 / 3856127.172` 邻域）。

**错误信号**：若 `x` 落 `460xxx`、`y` 落 `3849xxx`（A 系），说明锚点错——发给了 iServer A 系坐标或 iServer 数据集已重发布到 A，D 锚点逆变换会算崩。

### 4.2 探针 2：D 锚点逆变换 → 本地系

- **源码**：`frontend/src/components/SuperMapSceneViewer.vue:1482`
- **日志格式**：
  ```
  [F2] evacuation D->local { projectedHead: {x, y}, projectedTail: {x, y}, localHead: {x, y}, localTail: {x, y} }
  ```

**判据**：
- `projectedHead` / `projectedTail`：落 D 系（同 4.1，`x∈[457600,457900]`，`y∈[3856000,3856300]`）。
- `localHead` / `localTail`：落本地系 `[0, 1587] × [0, 947]`（与 `realMapAssets` 同源，相对坐标）。

**错误信号**：`localHead` 越出 `[0,1587]×[0,947]`（如负数或 >2000），说明 D 锚点逆变换 `projectedToLocalD` 参数错（D 锚点 projected 值不对，或 `mapMetersPerUnit` 口径错）。

### 4.3 探针 3：渲染链路中间值（mapPointToS3MLocal + tileset transform）

- **源码**：`frontend/src/components/SuperMapSceneViewer.vue:1910`
- **日志格式**：
  ```
  [F2] evacuation render-chain {
    mapHead: {x, y},
    mapTail: {x, y},
    s3mLocalHead: {x, y, z},
    s3mLocalTail: {x, y, z},
    ecefHead: {x, y, z},
    ecefTail: {x, y, z},
    georefTransformLen: <number>
  }
  ```

**判据**（逐字段）：
- `mapHead` / `mapTail`：本地系 `[0, 1587] × [0, 947]`（同 4.2 的 localHead/Tail）。
- `s3mLocalHead` / `s3mLocalTail`：应落 `LOCAL_S3M_BOUNDS` 内：
  - `x ∈ [left, right] = [-1605.9164671191247, 810.41634921256627]`
  - `y ∈ [bottom, top] = [-1130.1391864245234, 878.30004171701148]`
  - 越界说明 `mapPointToS3MLocal` 归一化错（上游 localPath 量级不对）。
- `ecefHead` / `ecefTail`：量级 `1e6 ~ 1e7`（ECEF 地心地固坐标，x/y/z 各分量百万到千万级）。量级 < 1e5 说明 tileset transform 未加载。
- `georefTransformLen`：**应 = 16**（Cesium `tileset.root.transform` 是 4×4 矩阵 = 16 个元素）。若 = 0 或 undefined，说明 `threeTilesGeoreference.transform` 未加载成功，3D Tiles 模型未就位，落图必塌。

### 4.4 F6 越界告警（错误信号，正常不应出现）

- **源码**：
  - `frontend/src/components/SuperMapSceneViewer.vue:2713` `[F6] mapPointToS3MLocal 输入非有限值`
  - `frontend/src/components/SuperMapSceneViewer.vue:2721` `[F6] mapPointToS3MLocal 输入越界`
  - `frontend/src/components/SuperMapSceneViewer.vue:3129` `[F6] clampMapPoint 输入越界`
  - `frontend/src/data/coordinate.js:41` `[F6] {fnName} 落图越界`
- **判据**：**正常情况不应出现任何 `[F6]` warn**。若出现，与 4.x 探针量级错对应——`mapPointToS3MLocal 输入越界` 说明输入 `point` 超出地图 `[0, map.width]×[0, map.height]`，根因是上游 localPath 量级错（4.2 localHead/Tail 越界）。

---

## 5. 截图三维场景

### 5.1 截图要求

截图须能看清以下要素：
- 疏散路径线：绿色 `#52ffb8`（源码 `SuperMapSceneViewer.vue:1933` `addPolylineEntity(path, '疏散路线', '#52ffb8', ...)`）
- 起点：建筑门口
- 终点：园区出口（park-south / park-east）
- 路径贴合 `road-north-main` 等路网，不塌成单点、不飘、不穿墙、不逆行

### 5.2 多角度截图（至少两张）

1. **俯视图**：相机俯视园区，看路径整体走向与路网贴合度。
2. **侧视图**：相机侧斜视，看路径高度（不贴地飘空 / 不穿地下）与建筑相对位置。

> 候选路线（`#7dd3fc` 浅蓝，`SuperMapSceneViewer.vue:1925`）会一并渲染，截图时区分主路线（绿）与候选（浅蓝）。

---

## 6. 判定标准

### 6.1 通过（F2 验证通过）

**全部满足**：
1. 探针 1：iServer path 首尾点落 D 系（`x∈[457600,457900]`，`y∈[3856000,3856300]`）。
2. 探针 2：`projectedPath` 落 D 系，`localPath` 落 `[0,1587]×[0,947]`。
3. 探针 3：`s3mLocalHead/Tail` 落 `LOCAL_S3M_BOUNDS`，`ecefHead/Tail` 量级 `1e6~1e7`，`georefTransformLen = 16`。
4. 无任何 `[F6]` 越界告警。
5. 截图视觉确认：绿色路径落在模型道路上，起点在建筑门口、终点在出口，不塌不飘不穿墙。

### 6.2 量级对但视觉错（渲染链路问题）

探针 1/2/3 量级全对、无 F6，但截图路径飘 / 穿墙 / 不贴路：
- 回 memory `supermap_cup_3dtiles_render_chain` 复核 `mapPointToS3MLocal` 映射（`SuperMapSceneViewer.vue:2728-2731`，归一化 + `LOCAL_S3M_BUSINESS_OFFSET` 偏移）。
- 复核 `threeTilesMapPointToEcef`（`SuperMapSceneViewer.vue:1907` 调用）是否正确套用 `tileset.root.transform`。

### 6.3 量级错（D 锚点投影错）

探针 1 iServer path 不落 D 系（落 A 系 `460xxx/3849xxx`，或量级离谱）：
- 回 `docs/f1-f2-investigation/09-f2-decision-final-and-iserver-republish-spec.md` **第 8 节** D 锚点反推复核。
- 核对 `frontend/src/data/supermapGeoreference.js:130-135` `SUPERMAP_ISERVER_DATA_ANCHOR.projected = { easting: 457692.843, northing: 3856127.172 }` 是否被误改。
- 核对 iServer 数据集是否已重发布到 A（若已重发布到 A，前端仍发 D 会算崩——此时要么前端改回 A，要么 iServer 保持 D，二选一，见 docs/09 第 3.2 节）。

---

## 7. 结果回传

codex 把以下材料回传给 Claude：

1. **三条 `[F2]` 日志原文**（console 复制粘贴，含 `n=` / `head=` / `tail=` / 各字段数值）。
2. **`[F6]` 告警原文**（若有，含 `point` / `rawNx` / `rawNy` 等字段；若无，明确写"无 F6 告警"）。
3. **截图**：俯视 + 侧视至少两张，文件名含 `f2-verify-topdown` / `f2-verify-side`。

Claude 判读后决定：
- **量级全对 + 视觉对** → F2 标"已验证"，删除三条 `[F2]` 探针（`useSmartMapAlgorithmExecutors.ts:429/442`、`SuperMapSceneViewer.vue:1482/1910`）。
- **量级对但视觉错** → 定位渲染链路问题继续修。
- **量级错** → 定位 D 锚点投影问题继续修。

---

## 8. 失败兜底

### 8.1 iServer 不可达

- 检查 `https://www.chemgas.lab6119.xyz/iserver/services.json` 是否 200。
- **codex 不读 Passwords.md**（避免密码进 session 日志）。若 services.json 非 200，把 `curl -sS -o /dev/null -w "%{http_code}" https://www.chemgas.lab6119.xyz/iserver/services.json` 的输出和 `curl -v` 的错误写进交付物，标记"iServer 不可达，需 Claude 登服务器排查"，本 runbook 终止。登服务器重启 iServer 由 Claude 在 codex 会话外处理。

### 8.2 dev server 起不来

- 检查 Node 版本：`node --version`，需 Node 25.x（见 memory `chemical-park-local-run-env`）。
- 检查依赖：`cd /g/竞赛/超图杯/code/chemical-main/frontend && npm install --no-audit --no-fund`。
- check:node 挡路：跳过 `npm run dev`，直接 `npx vite --host 127.0.0.1 --port 5173 --strictPort`（见 0.2 / 第 2 节）。
- 端口占用：`netstat -ano | findstr :5173` 找 PID，`taskkill /PID <PID> /F` 释放。

### 8.3 触发的是 Python 兜底而非 SuperMap iServer

- 确认点的是「当前建筑路径」按钮（`SmartMapEmergencyScenarioPanel.vue:176`，emit `run-evacuation` → `index.vue:33 runEvacuationPlanning`），不是「全建筑路径」（`:179`，emit `run-batch-evacuation` → `index.vue:30 runBatchEvacuationPlanning`）。
- 看 console 有无 `superMapNetworkFailure` 标注或"批量...降级 Python"字样。若有，说明误触了批量入口或 iServer 链路失败降级到 Python——前者回到 3.2 重点单建筑按钮，后者回 8.1 排查 iServer 可达性。
- 确认 iServer 链路真跑通的标志：探针 1 `[F2] extractSuperMapPath[...]` 出现且 `head/tail` 落 D 系。若探针 1 完全不出现，说明根本没走 iServer 链路（走了 Python 兜底或请求失败）。

---

## 附：源码位置速查（判据核对用）

| 探针 / 告警 | 源码位置 | 关键判据值 |
|---|---|---|
| `[F2] extractSuperMapPath[guides/route]` | `useSmartMapAlgorithmExecutors.ts:429,442` | head/tail 落 D 系 `x∈[457600,457900] y∈[3856000,3856300]` |
| `[F2] evacuation D->local` | `SuperMapSceneViewer.vue:1482` | projectedPath 落 D 系，localPath 落 `[0,1587]×[0,947]` |
| `[F2] evacuation render-chain` | `SuperMapSceneViewer.vue:1910` | s3mLocal 落 LOCAL_S3M_BOUNDS，ecef 量级 1e6~1e7，georefTransformLen=16 |
| `[F6] mapPointToS3MLocal 输入越界` | `SuperMapSceneViewer.vue:2721` | 正常不应出现 |
| `[F6] mapPointToS3MLocal 输入非有限值` | `SuperMapSceneViewer.vue:2713` | 正常不应出现 |
| `[F6] clampMapPoint 输入越界` | `SuperMapSceneViewer.vue:3129` | 正常不应出现 |
| `[F6] {fnName} 落图越界` | `coordinate.js:41` | 正常不应出现 |
| D 锚点定义 | `supermapGeoreference.js:130-135` | `projected: {easting: 457692.843, northing: 3856127.172}` |
| LOCAL_S3M_BOUNDS | `SuperMapSceneViewer.vue:472-477` | `left=-1605.9165, right=810.4163, bottom=-1130.1392, top=878.3000` |
| 单建筑按钮 | `SmartMapEmergencyScenarioPanel.vue:176-178` | 文案「当前建筑路径」→ `run-evacuation` |
| 批量按钮（勿点） | `SmartMapEmergencyScenarioPanel.vue:179-181` | 文案「全建筑路径」→ `run-batch-evacuation` |
| iServer 外部入口 | `.env.development:11` | `https://www.chemgas.lab6119.xyz` |
| iServer 内部端口 | docs/07 第 152 行 | 18090（容器内，外部经域名访问） |
| 私密凭据 | `E:/ObsidianLearningGraph/80_Vault/Passwords.md` | iServer / SSH 凭据 — **本任务不读取，见 0.1** |
