export const meta = {
  name: 'f1-f2-coordinate-investigation',
  description: '并行深读 F1/F2 涉及代码与坐标系契约，发现落盘 docs/f1-f2-investigation/ 后综合判定',
  phases: ['investigate', 'synthesize']
}

const OUT = 'code/chemical-main/docs/f1-f2-investigation'
const common = `工作目录 G:/竞赛/超图杯。化工园区前端代码在 code/chemical-main/frontend/src/，后端在 code/chemical-main/backend/，文档在 code/chemical-main/docs/。所有发现必须基于真实代码核实，引用 file:line，不得推测。如遇阻塞（文件不存在、服务起不来），如实写明阻塞，不编造。用中文写。`

await phase('investigate', async () => {
  await parallel([
    agent({
      name: 'payload-builder',
      subagent_type: 'general-purpose',
      prompt: `${common}\n任务：深读疏散 payload 构造链路，判定 F1。\n读：\n- code/chemical-main/frontend/src/data/supermapCupScenario.ts 全文（重点 buildSuperMapCupEvacuationPayload 约 :221-240、resolveRoutePath 约 :269-276、SUPERMAP_CUP_SCENARIO 常量约 :101）\n- code/chemical-main/frontend/src/data/realMapAssets.ts（roads 来源、toAlgorithmRoad、buildingEntrances）\n- supermapCupScenario.ts 导入的坐标相关模块\n回答并落盘到 ${OUT}/01-payload-builder.md：\n1. payload 顶层 coordSys 字段实际值？来自哪个常量？\n2. roads 数组 x/y 来自哪里？toAlgorithmRoad 前后坐标系？量级（0~1587 本地 vs 457xxx 投影）？\n3. startPoint x/y 来自 buildingEntrances 哪个字段？坐标系？量级？\n4. localToProjected/projectedToLocal 在 payload 构造时是否被调用？\n5. sourceCoordSys(PCS_NON_EARTH_LOCAL_METER) 是否进 payload 顶层？\n给出 F1 判定：payload 坐标系标注与实际数据是否一致？后端若依赖 coordSys 转换会出什么问题？`
    }),
    agent({
      name: 'iserver-executor',
      subagent_type: 'general-purpose',
      prompt: `${common}\n任务：深读 iServer 网络分析执行器，判定 F2。\n读：\n- code/chemical-main/frontend/src/views/smart_map/useSmartMapAlgorithmExecutors.ts 全文（重点 requestSuperMapPath 约 :344-380、extractSuperMapPath、snapPointToRoad 约 :277-298、executeSuperMapNetworkAnalysis 约 :124）\n- code/chemical-main/frontend/src/views/smart_map/useSuperMapIserverData.ts（roadRectFromLine 约 :276-312）\n回答并落盘到 ${OUT}/02-iserver-executor.md：\n1. iServer path.rjson 请求怎么构造？发给哪个数据集 URL？请求体 startPoint/终点坐标量级？\n2. extractSuperMapPath 怎么从 pathList[0] 抽点？{x,y} 有没有坐标转换？\n3. 点塞进 AlgorithmRecord.path 后有没有标注坐标系？\n4. snapPointToRoad 吸附后坐标量级？发给 iServer 时是本地系还是投影系？\n5. 推断 iServer cgcs2000 数据集返回 path 点的坐标系？依据？\n给出 F2 判定：iServer 路径返回坐标系是否被前端正确处理？若返回 CGCS2000 投影坐标，dev/prod 分别什么后果？`
    }),
    agent({
      name: 'coord-transform',
      subagent_type: 'general-purpose',
      prompt: `${common}\n任务：深读坐标转换层。\n读：\n- code/chemical-main/frontend/src/data/supermapGeoreference.js 全文\n- code/chemical-main/frontend/src/data/coordinate.js 全文\n- supermapCupScenario.ts 里所有调用 localToProjected/projectedToLocal/mapPointToGeo 的地方\n回答并落盘到 ${OUT}/03-coord-transform.md：\n1. mapPointToGeo/localToProjected/projectedToLocal/mapPointToSceneCartesian/mapPointToS3MLocal/mapDistanceToSceneMeters 各自签名、输入输出坐标系？\n2. 锚点偏移逻辑在哪？偏移值？\n3. dev 球面 CGCS2000 模式(VITE_SUPERMAP_3D_APPLY_LAYER_POSITION=true)下 mapPointToSceneCartesian 完整调用链？\n4. prod 本地 EPSG:0 S3M 模式(=false)下 mapPointToS3MLocal 归一化与 clamp 逻辑？\n5. 若把 CGCS2000 投影坐标(E≈457000,N≈3855000)误当本地系喂给 mapPointToSceneCartesian，dev/prod 分别发生什么？量级推算。`
    }),
    agent({
      name: 'scene-overlay',
      subagent_type: 'general-purpose',
      prompt: `${common}\n任务：深读三维落图。\n读：\n- code/chemical-main/frontend/src/components/SuperMapSceneViewer.vue 的 drawEvacuationOverlay(约:1881)及调用的所有坐标函数\n- mapPointToSceneCartesian 调用点\n- 疏散路径渲染(polyline/ellipse)相关\n回答并落盘到 ${OUT}/04-scene-overlay.md：\n1. AlgorithmRecord.path 的点怎么流到三维渲染？经过哪些坐标转换？\n2. drawEvacuationOverlay 在 dev/prod 两种模式下对同一份 path 点的处理差异？\n3. 当前代码对 path 点坐标系有没有显式标注或量级探测？\n4. 若 path 点是 CGCS2000 投影坐标，当前渲染会让路径飘到哪里(dev)/塌成哪里(prod)？`
    }),
    agent({
      name: 'backend-contract',
      subagent_type: 'general-purpose',
      prompt: `${common}\n任务：查后端疏散规划接口契约，判定后端是否依赖 coordSys 做坐标转换。\n找：\n- code/chemical-main/backend/ 或 python 算法服务目录下 runEvacuationPlanning/evacuation 路由\n- 看 startup.bat/run-local.bat 启动了哪些 python 服务、端口\n读：找到的路由文件、请求体 schema、坐标处理逻辑\n回答并落盘到 ${OUT}/05-backend-contract.md：\n1. 疏散规划 API 端点？端口？请求体 schema(coordSys/roads/startPoint)？\n2. 后端是否读取 coordSys 做坐标转换？还是直接当本地坐标用？\n3. 后端返回 path 点坐标系？本地米制还是 CGCS2000 投影？\n4. 后端是否调用 iServer？传给 iServer 的坐标是什么系？\n5. F1 待核实结论：后端到底用 coordSys 转换还是直接用？代码证据 file:line。`
    }),
    agent({
      name: 'env-runbook',
      subagent_type: 'general-purpose',
      prompt: `${common}\n任务：理清本地运行环境，给出跑一次实际疏散请求看坐标量级的操作手册。\n读：\n- code/chemical-main/frontend/.env.development、.env.production 全文\n- code/chemical-main/run-local.bat、sandbox-run.bat、sandbox-shutdown.bat、根目录 startup.bat\n- backend 启动配置、python 服务启动配置\n回答并落盘到 ${OUT}/06-env-runbook.md：\n1. 各服务端口、启动命令、依赖(MySQL/Python/Java/前端/iServer)？\n2. iServer 服务地址？cgcs2000 数据集 URL？iServer 在本机还是远程？\n3. 触发一次单建筑疏散请求完整步骤：启动哪些服务→打开哪个页面→点哪个按钮→或 curl 哪个 API？\n4. 前端代码里临时加 console.log 打印 payload 和返回 path 坐标，最该加在哪几个 file:line？\n5. 3D-chemical_park_cgcs2000/rest/realspace 是否真 404？怎么验证？\n6. dev 球面 vs prod 本地模式分别怎么启动验证？`
    })
  ])
})

await phase('synthesize', async () => {
  await agent({
    name: 'synthesizer',
    subagent_type: 'general-purpose',
    prompt: `${common}\n任务：读 ${OUT}/ 下 01-06 所有 .md，综合判定 F1/F2，给出修复方向与验证步骤。\n读：${OUT}/01-payload-builder.md、02-iserver-executor.md、03-coord-transform.md、04-scene-overlay.md、05-backend-contract.md、06-env-runbook.md\n输出到 ${OUT}/00-synthesis.md，结构：\n## F1 判定\n- payload 坐标系标注与实际数据是否一致？(是/否+证据 file:line)\n- 后端是否依赖 coordSys 做转换？(代码证据)\n- 修复方向：A 保持现状补 sourceCoordSys / B 构造时转投影坐标 / C 其他\n## F2 判定\n- iServer 路径返回坐标系？(推断+依据)\n- 前端是否正确处理？\n- 修复方向：A resolveRoutePath 加量级探测 / B 执行器返回带 pathCoordSys / C 其他\n## 验证步骤\n- 怎么跑实际请求确认坐标量级(具体命令/操作)\n- 在哪几个 file:line 加 console.log\n- dev/prod 双环境怎么验\n## 阻塞清单\n- 哪些问题阻塞实际验证(iServer 未运行、realspace 404)\n## 给主控的建议\n- F1/F2 应该先改哪个、改什么、风险点\n不要编造，证据不足写"待实际请求确认"。`
  })
})
