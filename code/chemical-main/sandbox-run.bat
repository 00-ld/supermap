@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Chaotu (SuperMap) Sandbox Run

REM ============================================================
REM  SANDBOX one-click startup (isolated from cehui sandbox)
REM  - MySQL: Docker container chaotu-mysql @ 127.0.0.1:3407
REM  - Algorithm / YOLO / Java backend / frontend dev server all bind 127.0.0.1
REM  - Algorithm auth disabled locally, no API key needed for frontend
REM  - Reads .env.local (must exist)
REM  - Ports 3407/8100/8101/8181/6173, no clash with cehui sandbox (3307/8000/8001/8081/5173)
REM ============================================================

set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"

set "MYSQL_IMAGE=mysql:8.0"
set "MYSQL_PORT=3407"
set "MYSQL_DATABASE=chemical"
set "MYSQL_CONTAINER=chaotu-mysql"
set "ALGORITHM_PORT=8100"
set "YOLO_PORT=8101"
set "BACKEND_PORT=8181"
set "FRONTEND_PORT=6173"

if not exist "%ROOT%\.env.local" (
  echo [ERROR] .env.local not found. Copy .env.local.example to .env.local first.
  exit /b 1
)
for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%ROOT%\.env.local") do (
  if not "%%~A"=="" if not "%%~A"==" " set "%%~A=%%~B"
)

if not defined DB_PASSWORD set "DB_PASSWORD=%MYSQL_ROOT_PASSWORD%"
if not defined MYSQL_ROOT_PASSWORD set "MYSQL_ROOT_PASSWORD=%DB_PASSWORD%"
set "SPRING_PROFILES_ACTIVE=local"
set "SPRING_DATASOURCE_USERNAME=%DB_USERNAME%"
set "SPRING_DATASOURCE_PASSWORD=%DB_PASSWORD%"
set "SPRING_DATASOURCE_URL=jdbc:mysql://127.0.0.1:%MYSQL_PORT%/%MYSQL_DATABASE%?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true"
set "ALGORITHM_REQUIRE_AUTH=false"
set "ANALYSIS_SERVICE_URL=http://127.0.0.1:%YOLO_PORT%/api/analysis/person"
set "CORS_ALLOWED_ORIGINS=http://localhost:%FRONTEND_PORT%,http://127.0.0.1:%FRONTEND_PORT%"
set "SERVER_PORT=%BACKEND_PORT%"

if not exist "%ROOT%\logs" mkdir "%ROOT%\logs" >nul 2>nul
if not exist "%ROOT%\.codex-runlogs" mkdir "%ROOT%\.codex-runlogs" >nul 2>nul

echo.
echo ==========================================
echo  Chemical Park - Local Run
echo ==========================================
echo Project:  %ROOT%
echo DB:       127.0.0.1:%MYSQL_PORT% / %MYSQL_DATABASE% (Docker %MYSQL_CONTAINER%)
echo Auth:     algorithm auth OFF (local only)
echo.

REM Stop old processes holding project ports
for %%P in (%ALGORITHM_PORT% %YOLO_PORT% %BACKEND_PORT% %FRONTEND_PORT%) do (
  for /f "tokens=5" %%I in ('netstat -ano -p tcp ^| findstr /R /C:":%%P .*LISTENING"') do (
    if not "%%I"=="0" taskkill /PID %%I /T /F >nul 2>nul
  )
)

REM 1. Docker MySQL
call :ensure_docker
if errorlevel 1 goto fail
call :ensure_mysql
if errorlevel 1 goto fail

REM Resolve absolute paths for mvn/npm/python/uv (PATH may be restricted when launched from non-shell parent)
call :resolve_tools
if errorlevel 1 goto fail

REM Prepare Python deps (includes torch for diffusion model + yolo extra)
echo [DEPS] Ensuring Python deps (uv sync --extra yolo)...
cd /d "%ROOT%"
"%UV_CMD%" sync --extra yolo > "%ROOT%\logs\uv-sync.log" 2>&1
if not errorlevel 1 goto :uv_ok
echo [WARN] uv sync had issues, algorithm service may fail to start.
:uv_ok
echo [DEPS] Python deps done.
cd /d "%ROOT%"

REM Prepare frontend deps if node_modules missing (guarded to avoid cmd if-block parse issues on CN paths)
if not exist "%ROOT%\frontend\node_modules" goto :install_frontend
goto :frontend_deps_done
:install_frontend
echo [DEPS] Installing frontend deps (npm install)...
pushd "%ROOT%\frontend"
call "%NPM_CMD%" install --no-audit --no-fund
popd
:frontend_deps_done
echo [DEPS] Frontend deps check done.

REM 2. Algorithm service (FastAPI diffusion / source tracing)
call :start_uvicorn "%ALGORITHM_PORT%" "Algorithm API" "algorithm.api_server:app"

REM 3. YOLO person detection (optional, skipped if no weights)
if not exist "%ROOT%\models\yolo11m.pt" goto :skip_yolo
call :start_uvicorn "%YOLO_PORT%" "YOLO Person API" "algorithm.polo:app"
goto :yolo_done
:skip_yolo
echo [SKIP] YOLO Person API skipped, models\yolo11m.pt not found, optional
:yolo_done

REM 4. Java backend
call :start_service "%BACKEND_PORT%" "Java Backend" "%ROOT%\backend" "%MVN_CMD%" "spring-boot:run -Dspring-boot.run.jvmArguments=-Dspring.profiles.active=local"

REM 5. Frontend dev server
call :start_service "%FRONTEND_PORT%" "Frontend Dev" "%ROOT%\frontend" "%NPM_CMD%" "run dev -- --host 127.0.0.1 --port %FRONTEND_PORT%"

echo.
echo [WAIT] Checking services...
call :wait_port "%ALGORITHM_PORT%" "Algorithm"
call :wait_port "%BACKEND_PORT%" "Backend"
call :wait_port "%FRONTEND_PORT%" "Frontend"
curl.exe -fsS --max-time 8 "http://127.0.0.1:%ALGORITHM_PORT%/api/health" >nul 2>nul && echo [OK] Algorithm health || echo [WARN] Algorithm health check failed

echo.
echo ==========================================
echo  Local run started
echo ==========================================
echo Frontend:  http://127.0.0.1:%FRONTEND_PORT%/index.html
echo Backend:   http://127.0.0.1:%BACKEND_PORT%/api
echo Algorithm: http://127.0.0.1:%ALGORITHM_PORT%/api/health
echo YOLO:      http://127.0.0.1:%YOLO_PORT%/docs
echo.
echo Stop all: run shutdown.bat
echo.
exit /b 0

:fail
echo.
echo [FAILED] Startup cannot continue.
exit /b 1

:resolve_tools
REM Resolve absolute paths so services start even when launched from a parent with restricted PATH
set "MVN_CMD=mvn.cmd"
set "NPM_CMD=npm.cmd"
set "PYTHON_CMD=python.exe"
set "UV_CMD=uv.exe"
if defined MAVEN_HOME if exist "%MAVEN_HOME%\bin\mvn.cmd" set "MVN_CMD=%MAVEN_HOME%\bin\mvn.cmd"
if "%MVN_CMD%"=="mvn.cmd" if defined M2_HOME if exist "%M2_HOME%\bin\mvn.cmd" set "MVN_CMD=%M2_HOME%\bin\mvn.cmd"
if "%MVN_CMD%"=="mvn.cmd" call :resolve_maven
if "%MVN_CMD%"=="mvn.cmd" goto :mvn_fail
goto :mvn_ok
:mvn_fail
echo [ERROR] Maven (mvn.cmd) not found. Set MAVEN_HOME or install Maven.
exit /b 1
:mvn_ok
echo [OK] Maven: %MVN_CMD%
if defined NODE_HOME if exist "%NODE_HOME%\node.exe" set "NPM_CMD=%NODE_HOME%\npm.cmd"
if defined NODE_HOME if exist "%NODE_HOME%\node.exe" set "PATH=%NODE_HOME%;%PATH%"
if not "%NPM_CMD%"=="npm.cmd" goto :npm_ok
if exist "C:\Program Files\nodejs\npm.cmd" set "NPM_CMD=C:\Program Files\nodejs\npm.cmd"
if exist "C:\Program Files\nodejs\npm.cmd" set "PATH=C:\Program Files\nodejs;%PATH%"
:npm_ok
if exist "%ROOT%\.venv\Scripts\python.exe" set "PYTHON_CMD=%ROOT%\.venv\Scripts\python.exe"
if not exist "%ROOT%\.venv\Scripts\python.exe" if exist "%USERPROFILE%\AppData\Local\Microsoft\WindowsApps\python.exe" set "PYTHON_CMD=%USERPROFILE%\AppData\Local\Microsoft\WindowsApps\python.exe"
if exist "%USERPROFILE%\.local\bin\uv.exe" set "UV_CMD=%USERPROFILE%\.local\bin\uv.exe"
if not exist "%USERPROFILE%\.local\bin\uv.exe" if exist "%USERPROFILE%\AppData\Roaming\Python\Python312\Scripts\uv.exe" set "UV_CMD=%USERPROFILE%\AppData\Roaming\Python\Python312\Scripts\uv.exe"
echo [OK] npm: %NPM_CMD%
echo [OK] python: %PYTHON_CMD%
echo [OK] uv: %UV_CMD%
exit /b 0

:resolve_maven
for %%D in (C D E F) do call :try_maven_drive %%D
if "%MVN_CMD%"=="mvn.cmd" call :find_maven_under "%USERPROFILE%\.m2\wrapper\dists"
exit /b 0

:try_maven_drive
for /d %%R in ("%~1:\apache-maven-*-bin") do call :find_maven_under "%%~fR"
exit /b 0

:find_maven_under
for /f "usebackq delims=" %%M in (`dir /s /b "%~1\mvn.cmd" 2^>nul`) do (
  set "MVN_CMD=%%~fM"
  set "PATH=%%~dpM;%PATH%"
  exit /b 0
)
exit /b 0

:ensure_docker
where.exe docker.exe >nul 2>nul
if errorlevel 1 (
  if exist "C:\Program Files\Docker\Docker\resources\bin\docker.exe" (
    set "PATH=C:\Program Files\Docker\Docker\resources\bin;%PATH%"
  ) else (
    echo [ERROR] Docker not found. Install Docker Desktop first.
    exit /b 1
  )
)
docker info >nul 2>nul
if errorlevel 1 (
  echo [START] Docker Desktop not running, starting it...
  if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath 'C:\Program Files\Docker\Docker\Docker Desktop.exe' -WindowStyle Hidden" >nul 2>nul
    for /l %%I in (1,1,90) do (
      docker info >nul 2>nul || (call :sleep 2)
      if not errorlevel 1 goto docker_ready
    )
    echo [ERROR] Docker Desktop did not become ready.
    exit /b 1
  ) else (
    echo [ERROR] Docker Desktop not installed.
    exit /b 1
  )
)
goto docker_ready
:docker_ready
echo [OK] Docker is ready.
exit /b 0

:ensure_mysql
docker inspect "%MYSQL_CONTAINER%" >nul 2>nul
if errorlevel 1 (
  echo [START] Creating Docker MySQL on 127.0.0.1:%MYSQL_PORT%...
  docker run -d --name %MYSQL_CONTAINER% ^
    -e MYSQL_ROOT_PASSWORD=%MYSQL_ROOT_PASSWORD% ^
    -e MYSQL_DATABASE=%MYSQL_DATABASE% ^
    -p 127.0.0.1:%MYSQL_PORT%:3306 ^
    -v chaotu_mysql_data:/var/lib/mysql ^
    %MYSQL_IMAGE% --character-set-server=utf8mb4 --collation-server=utf8mb4_general_ci >nul
  if errorlevel 1 (
    echo [PULL] Pulling %MYSQL_IMAGE%...
    docker pull %MYSQL_IMAGE% >nul 2>nul
    docker run -d --name %MYSQL_CONTAINER% ^
      -e MYSQL_ROOT_PASSWORD=%MYSQL_ROOT_PASSWORD% ^
      -e MYSQL_DATABASE=%MYSQL_DATABASE% ^
      -p 127.0.0.1:%MYSQL_PORT%:3306 ^
      -v chaotu_mysql_data:/var/lib/mysql ^
      %MYSQL_IMAGE% --character-set-server=utf8mb4 --collation-server=utf8mb4_general_ci >nul
    if errorlevel 1 (
      echo [ERROR] Failed to create MySQL container.
      exit /b 1
    )
  )
) else (
  docker inspect -f "{{.State.Running}}" "%MYSQL_CONTAINER%" 2>nul | findstr /I "true" >nul
  if errorlevel 1 (
    echo [START] Starting existing MySQL container...
    docker start %MYSQL_CONTAINER% >nul
  ) else (
    echo [OK] MySQL container already running.
  )
)
echo [WAIT] MySQL warming up...
for /l %%I in (1,1,60) do (
  docker exec %MYSQL_CONTAINER% mysqladmin ping -uroot -p%MYSQL_ROOT_PASSWORD% --silent >nul 2>nul
  if not errorlevel 1 goto mysql_ready
  call :sleep 2
)
echo [ERROR] MySQL did not become ready.
exit /b 1
:mysql_ready
echo [OK] MySQL ready on 127.0.0.1:%MYSQL_PORT%.
REM Import schema if tables not present
docker exec -i %MYSQL_CONTAINER% mysql -uroot -p%MYSQL_ROOT_PASSWORD% -e "USE chemical; SHOW TABLES;" 2>nul | findstr /R "." >nul
if errorlevel 1 (
  echo [DB] Importing schema...
  type "%ROOT%\deploy\mysql\init.sql" | docker exec -i %MYSQL_CONTAINER% mysql -uroot -p%MYSQL_ROOT_PASSWORD% chemical
  if errorlevel 1 (
    echo [WARN] init.sql import had errors, continuing anyway.
  ) else (
    echo [OK] Database schema initialized.
  )
) else (
  echo [OK] Schema already present, skip import.
)
exit /b 0

:start_uvicorn
set "UV_PORT=%~1"
set "UV_TITLE=%~2"
set "UV_APP=%~3"
call :is_listening "%UV_PORT%"
if not errorlevel 1 (
  echo [SKIP] %UV_TITLE% port %UV_PORT% in use
  exit /b 0
)
echo [START] %UV_TITLE% on %UV_PORT%
set "RF=%ROOT%\.codex-runlogs\run-%UV_PORT%.bat"
(
  echo @echo off
  echo set "ALGORITHM_REQUIRE_AUTH=false"
  echo set "ALGORITHM_API_KEY=%ALGORITHM_API_KEY%"
  echo set "ALGORITHM_CORS_ORIGINS=%CORS_ALLOWED_ORIGINS%"
  echo cd /d "%ROOT%"
  echo "%UV_CMD%" run --python "%PYTHON_CMD%" uvicorn %UV_APP% --host 127.0.0.1 --port %UV_PORT% 1^>^>"%ROOT%\logs\run-%UV_PORT%.log" 2^>^>"%ROOT%\logs\run-%UV_PORT%.err.log"
) > "%RF%"
start "" /b "%ComSpec%" /d /c call "%RF%" >nul 2>nul
exit /b 0

:start_service
set "SV_PORT=%~1"
set "SV_TITLE=%~2"
set "SV_DIR=%~3"
set "SV_EXE=%~4"
set "SV_ARGS=%~5"
call :is_listening "%SV_PORT%"
if not errorlevel 1 (
  echo [SKIP] %SV_TITLE% port %SV_PORT% in use
  exit /b 0
)
echo [START] %SV_TITLE% on %SV_PORT%
set "RF=%ROOT%\.codex-runlogs\run-%SV_PORT%.bat"
(
  echo @echo off
  echo set "SPRING_PROFILES_ACTIVE=local"
  echo set "SPRING_DATASOURCE_URL=%SPRING_DATASOURCE_URL%"
  echo set "SPRING_DATASOURCE_USERNAME=%SPRING_DATASOURCE_USERNAME%"
  echo set "SPRING_DATASOURCE_PASSWORD=%SPRING_DATASOURCE_PASSWORD%"
  echo set "JWT_SECRET=%JWT_SECRET%"
  echo set "ANALYSIS_SERVICE_URL=%ANALYSIS_SERVICE_URL%"
  echo set "CORS_ALLOWED_ORIGINS=%CORS_ALLOWED_ORIGINS%"
  echo set "VITE_SERVE=http://127.0.0.1:%BACKEND_PORT%"
  echo set "VITE_ALGORITHM_SERVE=http://127.0.0.1:%ALGORITHM_PORT%"
  echo set "ALGORITHM_REQUIRE_AUTH=false"
  echo set "SERVER_PORT=%BACKEND_PORT%"
  echo cd /d "%SV_DIR%"
  echo "%SV_EXE%" %SV_ARGS% 1^>^>"%ROOT%\logs\run-%SV_PORT%.log" 2^>^>"%ROOT%\logs\run-%SV_PORT%.err.log"
) > "%RF%"
start "" /b "%ComSpec%" /d /c call "%RF%" >nul 2>nul
exit /b 0

:wait_port
set "WP_PORT=%~1"
set "WP_NAME=%~2"
for /l %%I in (1,1,60) do (
  call :is_listening "%WP_PORT%"
  if not errorlevel 1 (
    echo [OK] %WP_NAME% ready on %WP_PORT%
    exit /b 0
  )
  call :sleep 2
)
echo [WARN] %WP_NAME% port %WP_PORT% not ready yet (check logs\run-%WP_PORT%.log).
exit /b 0

:is_listening
netstat -ano -p tcp | findstr /R /C:":%~1 .*LISTENING" >nul 2>nul
exit /b %ERRORLEVEL%

:sleep
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds %~1" >nul 2>nul
exit /b 0
