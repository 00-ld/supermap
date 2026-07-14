# Backend Service

本目录存放 Java Spring Boot 后端服务，负责用户认证、业务数据管理、传感器与小车数据接口、告警记录、图片识别服务转发，以及对 Python 算法服务的受控调用。

## 技术栈

- Spring Boot 3.4
- JDK 21
- MyBatis
- MySQL
- JWT
- Argon2id 密码哈希（不启用旧哈希兼容）

## 标准入口

- 应用入口：`src/main/java/com/at/ChemicalApplication.java`
- 配置文件：`src/main/resources/application.yml`
- MyBatis 映射：`src/main/resources/mapper/`
- 局部 SQL 资源：`src/main/resources/schema-*.sql`、`src/main/resources/init-sensor-db.sql`

## 目录职责

```text
backend/
  src/main/java/com/at/config/        Spring MVC、CORS、拦截器等配置
  src/main/java/com/at/controller/    HTTP API 控制器
  src/main/java/com/at/exception/     全局异常处理
  src/main/java/com/at/interceptor/   登录 token 与管理员权限拦截
  src/main/java/com/at/mapper/        MyBatis 数据访问接口
  src/main/java/com/at/pojo/          实体、查询对象和统一响应对象
  src/main/java/com/at/service/       业务服务接口
  src/main/java/com/at/service/impl/  业务服务实现
  src/main/java/com/at/utils/         JWT、响应写入等低耦合工具
```

当前主业务后端保持 Java Spring Boot 技术栈，不在本阶段迁移为 Python。Python 只作为 `algorithm/` 下的算法服务存在，由 Java 后端或 Nginx 受控调用。

## 运行方式

本地直接运行时必须显式选择 `local` 配置，并提供数据库密码和 `JWT_SECRET`：

```powershell
$env:SPRING_DATASOURCE_PASSWORD="your_local_mysql_password"
$env:JWT_SECRET="replace_with_random_32_char_min_secret"
mvn.cmd -Dspring-boot.run.profiles=local spring-boot:run
```

打包：

```bash
mvn clean package -DskipTests
```

生成的 `target/` 目录和 `.jar` 构建产物不得提交到 GitHub。当前 Docker 部署使用 `deploy/backend/Dockerfile` 从 `backend/` 源码构建后端镜像，不需要也不应手工复制 jar 到 `deploy/backend/`。

Windows PowerShell 本地运行示例：

```powershell
cd backend
$env:SPRING_DATASOURCE_URL="jdbc:mysql://127.0.0.1:3306/chemical?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true"
$env:SPRING_DATASOURCE_USERNAME="root"
$env:SPRING_DATASOURCE_PASSWORD="your_local_mysql_password"
$env:JWT_SECRET="replace_with_random_32_char_min_secret"
$env:CORS_ALLOWED_ORIGINS="http://localhost:5173"
$env:SERVER_PORT="8081"
mvn -Dspring-boot.run.profiles=local spring-boot:run
```

本地开发前应先创建 MySQL 数据库：

```sql
CREATE DATABASE chemical CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 配置要求

敏感配置必须来自环境变量或部署平台密钥，不得写死在代码中：

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `JWT_SECRET`
- `ALGORITHM_API_KEY`
- `ANALYSIS_SERVICE_URL`
- `CORS_ALLOWED_ORIGINS`
- `INSPECTION_DEFAULT_LOCATION`

本地临时配置文件不得提交。需要新增配置时，应优先在 `application.yml` 中使用 `${ENV_NAME:default}` 形式。

## 接口规范

后端接口统一返回 `Result<T>` 外壳，字段应与项目统一 JSON 协议保持一致。新增接口不得直接返回数据库实体给前端，应通过 DTO、VO 或明确的响应结构输出。

统一响应字段：

```json
{
  "code": 200,
  "message": "成功",
  "data": {},
  "ok": true,
  "timestamp": 1789000000000,
  "requestId": "uuid"
}
```

维护要求：

- Controller 返回类型优先使用 `Result<T>` / `Result<?>`；不要在业务接口外再叠 HTTP 状态与响应体状态的双层语义。
- 失败响应不得向前端暴露数据库连接、服务器路径、异常堆栈或密钥内容。
- 登录、注册、图片识别、传感器、小车、告警等接口必须保持响应格式一致。
- 新增分页接口应使用统一分页对象，不要在多个接口中重复定义同义字段。

## 算法与 YOLO 服务调用

后端对算法能力只做受控调用和业务编排，不在 Java Controller 中重写扩散、溯源、D* Lite 或 YOLO 推理算法。

调用边界：

- `ALGORITHM_API_KEY` 用于 Java 后端或 Nginx 调用 Python 算法服务时写入 `X-API-Key`。
- `ANALYSIS_SERVICE_URL` 指向 YOLO/人员识别服务；未配置时相关接口应失败提示，不得静默回退到个人电脑地址。
- `INSPECTION_DEFAULT_LOCATION` 用于图片识别记录的默认巡检区域，生产环境应按园区实际区域配置。
- Python 算法服务端口不直接暴露公网，生产环境由 Nginx 或 Docker 内网转发。
- 算法返回结果进入业务库前，应记录模型版本、请求时间、数据来源和必要质量标记。

## 目录维护规则

- `controller/` 只处理 HTTP 入参、鉴权结果和响应封装。
- `service/` 和 `service/impl/` 承载业务流程编排。
- `mapper/` 只负责数据库访问，不写页面逻辑和算法逻辑。
- `pojo/` 保持字段命名清晰，避免同义重复字段。
- `utils/` 只放低耦合工具类，不放具体业务流程。
- 新增包名使用小写英文，不新增中文包名、临时包名或大小写混杂包名。
- 新增配置项必须同步更新本 README、根 README 或部署文档中的环境变量说明。
- 不要在 Java 代码中硬编码 `localhost`、生产域名、个人电脑路径或第三方密钥。

## 验证命令

```bash
mvn -q -DskipTests compile
```

涉及仓库提交前，还应从项目根目录执行：

```bash
python tools/audit_repository.py
```

涉及数据库脚本、统一响应协议、登录鉴权或算法转发时，应同步更新 `docs/api-reference.md`、`docs/development-guide.md` 或部署文档。
