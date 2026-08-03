# SuperMap iMobile 移动端项目 —— Gemini 网页端交接与代码修改指南

> **说明**：本指南专为将本项目代码交由 **Gemini 网页端（Web 版 Gemini Advanced / 1.5 Pro）** 继续维护、重构或新增功能而设计。文档总结了系统架构、超图 SDK 关键集成避坑点、当前 UI 规范与精准文件映射。

---

## 📌 一、 项目技术栈与架构概览

* **运行平台**：原生 Android (Java 17/21, Gradle 8.x)
* **GIS SDK**：`SuperMap iMobile for Android 2026` (`com.supermap.mapping.*`, `com.supermap.data.*`)
* **网络与 API**：`Retrofit2` + `OkHttp 4.12.0`（复用 iMobile 自带 OkHttp）
* **视觉设计规范**：**iOS 极简高保真 Premium 风格**（大白/珍珠浅灰 `#F8FAFC`、纯白 16dp 圆角卡片、莫兰迪极细边框 `#E2E8F0`、iOS 皇家蓝 `#0066CC`）。
* **后端映射**：Spring Boot 后端（8081 端口），USB 调试下需配合 `adb reverse tcp:8081 tcp:8081`。

---

## 📁 二、 核心文件与精准路径映射

给 Gemini 网页端发送代码修改指令时，请直接指定以下文件路径：

```text
移动端/
├── app/src/main/assets/
│   └── config.properties                 # [关键配置] 后端 BaseUrl 与 iServer REST 服务地址
├── app/src/main/java/com/at/mobile/
│   ├── App.java                           # [初始化] 移动端入口，SuperMap 许可激活与初始化
│   ├── map/
│   │   └── SuperMapHelper.java            # [GIS核心] 7大矢量图层下载/渲染/打点/毒气扩散圈
│   ├── data/
│   │   ├── local/AppConfig.java           # 读取 assets/config.properties
│   │   ├── local/SessionManager.java      # Token、当前用户、角色与车辆 SharedPreferences
│   │   └── repository/TaskRepository.java # 任务与事故网络请求仓库
│   └── ui/
│       ├── login/LoginActivity.java       # 登录界面逻辑
│       ├── main/MainActivity.java         # 底部导航（事故/地图/我的）主框架
│       ├── map/MapActivity.java           # 地图主界面（HUD 坐标芯片/悬浮工具栏/气象挂件）
│       ├── incident/IncidentListActivity.java # 事故告警中心
│       ├── task/TaskCreateActivity.java   # 任务创建与指派表单
│       ├── task/TaskDetailActivity.java   # 任务详情与状态流转
│       ├── checkin/CheckinActivity.java   # 现场 GPS 定位 + 拍照打卡
│       └── mine/MyTaskActivity.java       # [新增] 我的待办与个人中心
└── app/src/main/res/
    ├── values/colors.xml                  # iOS 极简莫兰迪配色系统
    ├── values/styles.xml                  # 圆角按钮与输入框通用 Style
    └── layout/                            # 全套极简 UI Layout XML
```

---

## ⚠️ 三、 给 Gemini 网页端的 4 大【硬核避坑指南】

当要求 Gemini 网页端修改或新增代码时，**必须在 Prompt 中附带以下注意事项**：

1. **绝对禁止改成 HTTPS**：
   - 调试手机的时间已被修改至 **2019 年** 以激活 SuperMap 试用许可。如果修改代码发出 `https://` 请求，系统底层会报 `SSLHandshakeException: Chain validation failed`（因为 2019 年下现代 SSL 证书会被判定为“尚未生效”）。**网络请求必须保持 `http://` 纯 HTTP 地址**。
2. **SuperMap 复合图层与数据源模式**：
   - 勿将 `SuperMapHelper` 改为 `EngineType.Rest` 直接打开 REST 地图服务（会导致 iServer 复合图层子图层样式丢失，地图变空）。
   - 本项目已采用 `DataDownloadService` 异步下载 7 大数据集到本地 UDB 格式数据源（`parkDownload.udb`），并由本地引擎渲染，这是保证图层样式完整的唯一可靠方案。
3. **OpenGL 线程安全与 MapControl**：
   - 超图 `MapControl` 和 `MapView` 的渲染与 OpenGL 线程绑定。在异步网络回调（如 Retrofit / Repository）中更新地图点位或刷新视图时，**必须 post 到主线程**（例如 `mainHandler.post(...)` 或在 Activity UI 线程中执行），否则会引发底层 C++ Native Crash。
4. **资源文件与 Layout 避免全屏报错**：
   - 地图页 `MapActivity` 中的业务数据（如任务点/巡检车）属于可选叠加层。即便接口网络失败，**绝不能将全屏 `loadingOverlay` 遮罩设为 `VISIBLE`**，否则会把成功加载的超图地图底图误盖住。

---

## 📝 四、 Gemini 网页端交互 Prompt 模版

您可以直接复制以下 Prompt 发送给网页端 Gemini，让其为您修改或新增功能：

```markdown
你好，Gemini！我现在正在开发基于 SuperMap iMobile 2026 SDK 的 Android 化工应急 App。

请阅读以下项目规则与路径：
- 项目使用 Java 原生 Android，设计风格为【iOS 极简高保真 Premium 风格】（珍珠亮灰 #F8FAFC、纯白 16dp 圆角卡片 #FFFFFF、莫兰迪细边框 #E2E8F0、皇家蓝 #0066CC）。
- 核心地图类：g:\竞赛\超图杯\移动端\app\src\main\java\com\at\mobile\map\SuperMapHelper.java
- 配置文件：g:\竞赛\超图杯\移动端\app\src\main\assets\config.properties
- 注意事项：由于测试设备时间为 2019 年，所有 API 请求必须保持 http:// 纯 HTTP 格式，不可使用 https。

【我的新需求】：
[在此处填写您希望 Gemini 网页端为您修改或增加的功能描述]

请为我提供完整的 Java 类代码及对应的 XML 布局文件内容。
```

---

## 🚀 五、 常见修改场景与命令备忘

后置接管者在网页端获取代码并覆盖本地后，可在本地 Powershell 执行以下命令一键部署：

1. **端口转发（手机 USB 连线必备）**：
   ```powershell
   adb reverse tcp:8081 tcp:8081
   ```
2. **一键编译并安装**：
   ```powershell
   cd g:\竞赛\超图杯\移动端
   .\gradlew.bat installDebug
   ```
3. **查看真机运行日志**：
   ```powershell
   adb logcat -s ChemApp SuperMapHelper
   ```
