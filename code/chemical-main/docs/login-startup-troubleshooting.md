# 登录报错排查与启动顺序

## 常见原因

1. Java 后端没有启动。前端开发服务器只负责页面，登录接口需要后端监听 `8081`。
2. 后端连错数据库。Docker Compose 内部使用 `mysql:3306`；本机 `startup.bat` 会把 Docker MySQL 映射到 `127.0.0.1:3307`，手动 Maven 启动必须和实际端口保持一致。
3. 数据库未初始化。`chemical` 库中必须存在 `user` 表；canonical 初始化脚本不写入默认管理员账号。
4. MySQL 密码未传给后端。本机运行时需要设置 `SPRING_DATASOURCE_PASSWORD` 或 `DB_PASSWORD`。
5. YOLO 服务未启动或 Java 后端未配置 `ANALYSIS_SERVICE_URL`，会导致人员识别接口返回 503 或 500。

## 启动顺序

### 推荐：一键启动

在项目根目录双击或通过终端运行：

```bat
startup.bat
```

脚本会按顺序检查或启动：

1. MySQL 数据库：`startup.bat` 使用 Docker 容器 `chemical-mysql`，并映射到本机 `127.0.0.1:3307`。
2. Python 算法扩散服务：`127.0.0.1:8000`。
3. YOLO 人员识别服务：`127.0.0.1:8001`。
4. Java 后端：`127.0.0.1:8081`。
5. 前端开发服务：`127.0.0.1:5173`。

如果修改了任一服务的启动命令、端口、环境变量、数据库初始化方式或启动顺序，必须同步更新根目录 `startup.bat`。

以下步骤用于手动排查。

### 1. 启动并初始化 MySQL

确认一键脚本使用的本机 MySQL 映射端口正在监听 `3307`：

```powershell
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -eq 3307 }
```

初始化数据库：

```powershell
cd <项目根目录>
mysql --protocol=TCP --host=127.0.0.1 --port=3307 --user=root --password < deploy\mysql\init.sql
```

初始化脚本会创建 `chemical` 数据库和 `user` 表，但不会写入默认管理员账号。首次部署后请先注册普通用户，再由 DBA 或受信任运维显式提升账号角色。

### 2. 启动 YOLO 识别服务

```powershell
cd <项目根目录>
$env:ALGORITHM_REQUIRE_AUTH="true"
$env:ALGORITHM_API_KEY="<本地随机算法密钥>"
uv sync --frozen --no-dev --no-install-project --extra yolo
uv run uvicorn algorithm.polo:app --host 127.0.0.1 --port 8001
```

验证服务：

```powershell
Invoke-WebRequest http://127.0.0.1:8001/docs
```

### 3. 启动 Java 后端

```powershell
cd <项目根目录>\backend
$env:SPRING_PROFILES_ACTIVE="local"
$env:SPRING_DATASOURCE_PASSWORD="你的 MySQL root 密码"
$env:SPRING_DATASOURCE_URL="jdbc:mysql://127.0.0.1:3307/chemical?useSSL=false"
$env:ALGORITHM_API_KEY="<与 YOLO/算法服务一致的本地随机算法密钥>"
$env:ANALYSIS_SERVICE_URL="http://127.0.0.1:8001/api/analysis/person"
$env:INSPECTION_DEFAULT_LOCATION="核心作业区 A7"
mvn.cmd spring-boot:run
```

启动成功后应能看到 `8081` 端口：

```powershell
Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -eq 8081 }
```

### 4. 启动前端

```powershell
cd <项目根目录>\frontend
npm run dev
```

前端地址：

```text
http://127.0.0.1:5173/index.html
```

## 验证登录接口

```powershell
Invoke-RestMethod `
  -Uri "http://127.0.0.1:8081/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"username":"<已创建账号>","password":"<对应密码>"}'
```

如果返回 `code: 200` 且 `data` 中有 token，说明后端、数据库和该登录账号都正常。

## 验证 YOLO 代理接口

先登录拿 token，再把图片通过 Java 后端代理到 YOLO 服务：

```powershell
$login = Invoke-RestMethod `
  -Uri "http://127.0.0.1:8081/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"username":"<已创建账号>","password":"<对应密码>"}'

$token = $login.data
curl.exe -X POST http://127.0.0.1:8081/api/analysis/person `
  -H "token: $token" `
  -F "file=@yolo_test_person_like.jpg;type=image/jpeg"
```

成功时接口返回 `code: 200`，`data.status` 为 `success`，并带有 `image_base64` 识别结果图。
