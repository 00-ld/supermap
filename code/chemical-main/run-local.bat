@echo off
chcp 65001 >nul
setlocal EnableExtensions DisableDelayedExpansion
title Chemical Park - Local Run

REM ============================================================
REM  Pure local one-click startup (no deploy, no interactive prompt)
REM  - MySQL: Docker container chemical-local-mysql @ 127.0.0.1:3307
REM  - Algorithm / YOLO / Java backend / frontend dev server all bind 127.0.0.1
REM  - Algorithm auth disabled locally, no API key needed for frontend
REM  - Reads .env.local (must exist)
REM ============================================================

set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"

set "MYSQL_IMAGE=mysql:8.0"
set "MYSQL_PORT=3307"
set "NATIVE_MYSQL_PORT=3306"
set "MYSQL_DATABASE=chemical"
REM Reuse existing healthy container if present, else create chemical-local-mysql
set "MYSQL_CONTAINER=chemical-local-mysql"
set "USE_NATIVE_MYSQL=false"
docker inspect chemical-mysql >nul 2>nul
if not errorlevel 1 set "MYSQL_CONTAINER=chemical-mysql"
set "ALGORITHM_PORT=8000"
set "YOLO_PORT=8001"
set "BACKEND_PORT=8081"
set "FRONTEND_PORT=5173"

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

if /I "%~1"=="--check" goto check_only

if not exist "%ROOT%\logs" mkdir "%ROOT%\logs" >nul 2>nul
if not exist "%ROOT%\.codex-runlogs" mkdir "%ROOT%\.codex-runlogs" >nul 2>nul

echo.
echo ==========================================
echo  Chemical Park - Local Run
echo ==========================================
echo Project:  %ROOT%
echo DB:       native MySQL preferred, Docker fallback / %MYSQL_DATABASE%
echo Auth:     algorithm auth OFF (local only)
echo.

REM 1. Docker MySQL
call :ensure_docker
if errorlevel 1 goto fail
call :ensure_mysql
if errorlevel 1 goto fail

REM Prepare Python deps (includes torch for diffusion model + yolo extra)
echo [DEPS] Ensuring Python deps (uv sync --extra yolo)...
cd /d "%ROOT%"
uv sync --extra yolo >nul 2>nul
if errorlevel 1 (
  echo [WARN] uv sync had issues, algorithm service may fail to start.
)
cd /d "%ROOT%"

REM Prepare frontend deps if node_modules missing
if not exist "%ROOT%\frontend\node_modules" (
  echo [DEPS] Installing frontend deps ^(npm install^)...
  cd /d "%ROOT%\frontend"
  call npm install --no-audit --no-fund >nul 2>nul
  cd /d "%ROOT%"
)

REM 2. Algorithm service (FastAPI diffusion / source tracing)
call :start_uvicorn "%ALGORITHM_PORT%" "Algorithm API" "algorithm.api_server:app"

REM 3. YOLO person detection (optional, skipped if no weights)
if exist "%ROOT%\models\yolo11m.pt" (
  call :start_uvicorn "%YOLO_PORT%" "YOLO Person API" "algorithm.polo:app"
) else (
  echo [SKIP] YOLO Person API skipped (models\yolo11m.pt not found, optional)
)

REM 4. Java backend
call :start_service "%BACKEND_PORT%" "Java Backend" "%ROOT%\backend" "mvn.cmd" "spring-boot:run -Dspring-boot.run.jvmArguments=-Dspring.profiles.active=local"

REM 5. Frontend dev server
call :start_service "%FRONTEND_PORT%" "Frontend Dev" "%ROOT%\frontend" "npm.cmd" "run dev -- --host 127.0.0.1 --port %FRONTEND_PORT%"

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

:check_only
echo [CHECK] Read-only local service verification. No process will be started or stopped.
call :check_any_mysql
if errorlevel 1 exit /b 1
call :check_required_port "%ALGORITHM_PORT%" "Algorithm"
if errorlevel 1 exit /b 1
call :check_required_port "%BACKEND_PORT%" "Backend"
if errorlevel 1 exit /b 1
call :check_required_port "%FRONTEND_PORT%" "Frontend"
if errorlevel 1 exit /b 1
call :check_required_port "8090" "SuperMap iServer"
if errorlevel 1 exit /b 1
curl.exe -fsS --max-time 8 "http://127.0.0.1:%ALGORITHM_PORT%/api/health" >nul 2>nul
if errorlevel 1 exit /b 1
curl.exe -fsS --max-time 8 "http://127.0.0.1:%FRONTEND_PORT%/api/auth/login" >nul 2>nul
if errorlevel 1 echo [INFO] Login endpoint rejected the empty GET as expected; proxy route is reachable.
echo [OK] Core local services are listening. iServer was checked only, not restarted.
exit /b 0

:fail
echo.
echo [FAILED] Startup cannot continue.
exit /b 1

:ensure_docker
call :can_use_native_mysql
if not errorlevel 1 (
  set "USE_NATIVE_MYSQL=true"
  set "MYSQL_PORT=%NATIVE_MYSQL_PORT%"
  set "SPRING_DATASOURCE_URL=jdbc:mysql://127.0.0.1:%NATIVE_MYSQL_PORT%/%MYSQL_DATABASE%?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true"
  echo [OK] Using native MySQL on 127.0.0.1:%NATIVE_MYSQL_PORT%.
  exit /b 0
)
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
  call :can_use_native_mysql
  if not errorlevel 1 (
    set "USE_NATIVE_MYSQL=true"
    set "MYSQL_PORT=%NATIVE_MYSQL_PORT%"
    set "SPRING_DATASOURCE_URL=jdbc:mysql://127.0.0.1:%NATIVE_MYSQL_PORT%/%MYSQL_DATABASE%?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true"
    echo [OK] Docker unavailable; using native MySQL on 127.0.0.1:%NATIVE_MYSQL_PORT%.
    exit /b 0
  )
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
:docker_ready
echo [OK] Docker is ready.
exit /b 0

:ensure_mysql
if /I "%USE_NATIVE_MYSQL%"=="true" (
  call :ensure_native_mysql
  exit /b %ERRORLEVEL%
)
docker inspect "%MYSQL_CONTAINER%" >nul 2>nul
if errorlevel 1 (
  echo [START] Creating Docker MySQL on 127.0.0.1:%MYSQL_PORT%...
  docker run -d --name %MYSQL_CONTAINER% ^
    -e MYSQL_ROOT_PASSWORD=%MYSQL_ROOT_PASSWORD% ^
    -e MYSQL_DATABASE=%MYSQL_DATABASE% ^
    -p 127.0.0.1:%MYSQL_PORT%:3306 ^
    -v chemical_local_mysql_data:/var/lib/mysql ^
    %MYSQL_IMAGE% --character-set-server=utf8mb4 --collation-server=utf8mb4_general_ci >nul
  if errorlevel 1 (
    echo [PULL] Pulling %MYSQL_IMAGE%...
    docker pull %MYSQL_IMAGE% >nul 2>nul
    docker run -d --name %MYSQL_CONTAINER% ^
      -e MYSQL_ROOT_PASSWORD=%MYSQL_ROOT_PASSWORD% ^
      -e MYSQL_DATABASE=%MYSQL_DATABASE% ^
      -p 127.0.0.1:%MYSQL_PORT%:3306 ^
      -v chemical_local_mysql_data:/var/lib/mysql ^
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
  docker exec -i %MYSQL_CONTAINER% mysql -uroot -p%MYSQL_ROOT_PASSWORD% < "%ROOT%\deploy\mysql\init.sql"
  if errorlevel 1 (
    echo [WARN] init.sql import had errors, continuing anyway.
  ) else (
    echo [OK] Database schema initialized.
  )
) else (
  echo [OK] Schema already present, skip import.
)
exit /b 0

:can_use_native_mysql
where.exe mysql.exe >nul 2>nul
if errorlevel 1 (
  if exist "C:\Program Files\MySQL\MySQL Server 9.5\bin\mysql.exe" (
    set "PATH=C:\Program Files\MySQL\MySQL Server 9.5\bin;%PATH%"
  ) else (
    exit /b 1
  )
)
mysql.exe --host=127.0.0.1 --port=%NATIVE_MYSQL_PORT% --user=%DB_USERNAME% --password=%DB_PASSWORD% --protocol=tcp -e "SELECT 1" >nul 2>nul
if not errorlevel 1 exit /b 0
powershell -NoProfile -ExecutionPolicy Bypass -Command "$service = Get-Service | Where-Object { $_.Name -like 'MySQL*' } | Select-Object -First 1; if (-not $service) { exit 1 }; if ($service.Status -ne 'Running') { try { Start-Service -Name $service.Name -ErrorAction Stop } catch { exit 1 } }; exit 0" >nul 2>nul
if errorlevel 1 exit /b 1
mysql.exe --host=127.0.0.1 --port=%NATIVE_MYSQL_PORT% --user=%DB_USERNAME% --password=%DB_PASSWORD% --protocol=tcp -e "SELECT 1" >nul 2>nul
exit /b %ERRORLEVEL%

:ensure_native_mysql
echo [DB] Checking native MySQL database %MYSQL_DATABASE%...
mysql.exe --host=127.0.0.1 --port=%NATIVE_MYSQL_PORT% --user=%DB_USERNAME% --password=%DB_PASSWORD% --protocol=tcp -e "CREATE DATABASE IF NOT EXISTS `%MYSQL_DATABASE%` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;" >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Native MySQL is reachable but database initialization failed.
  exit /b 1
)
mysql.exe --host=127.0.0.1 --port=%NATIVE_MYSQL_PORT% --user=%DB_USERNAME% --password=%DB_PASSWORD% --protocol=tcp %MYSQL_DATABASE% -e "SHOW TABLES;" 2>nul | findstr /R "." >nul
if errorlevel 1 (
  echo [DB] Importing schema into native MySQL...
  mysql.exe --host=127.0.0.1 --port=%NATIVE_MYSQL_PORT% --user=%DB_USERNAME% --password=%DB_PASSWORD% --protocol=tcp < "%ROOT%\deploy\mysql\init.sql"
  if errorlevel 1 (
    echo [WARN] init.sql import had errors, continuing anyway.
  ) else (
    echo [OK] Database schema initialized.
  )
) else (
  echo [OK] Native MySQL schema already present, skip import.
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
  echo chcp 65001 ^>nul
  echo set "ALGORITHM_REQUIRE_AUTH=false"
  echo set "ALGORITHM_API_KEY=%ALGORITHM_API_KEY%"
  echo cd /d "%ROOT%"
  echo uv run --python python3.12.exe uvicorn %UV_APP% --host 127.0.0.1 --port %UV_PORT% 1^>^>"%ROOT%\logs\run-%UV_PORT%.log" 2^>^>"%ROOT%\logs\run-%UV_PORT%.err.log"
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
  echo chcp 65001 ^>nul
  echo set "SPRING_PROFILES_ACTIVE=local"
  echo set "SPRING_DATASOURCE_URL=%SPRING_DATASOURCE_URL%"
  echo set "SPRING_DATASOURCE_USERNAME=%SPRING_DATASOURCE_USERNAME%"
  echo set "SPRING_DATASOURCE_PASSWORD=%SPRING_DATASOURCE_PASSWORD%"
  echo set "JWT_SECRET=%JWT_SECRET%"
  echo set "ANALYSIS_SERVICE_URL=%ANALYSIS_SERVICE_URL%"
  echo set "CORS_ALLOWED_ORIGINS=%CORS_ALLOWED_ORIGINS%"
  echo set "ALGORITHM_REQUIRE_AUTH=false"
  echo cd /d "%SV_DIR%"
  echo call %SV_EXE% %SV_ARGS% 1^>^>"%ROOT%\logs\run-%SV_PORT%.log" 2^>^>"%ROOT%\logs\run-%SV_PORT%.err.log"
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

:check_any_mysql
call :is_listening "%NATIVE_MYSQL_PORT%"
if not errorlevel 1 (
  echo [OK] MySQL ready on %NATIVE_MYSQL_PORT%.
  exit /b 0
)
call :is_listening "%MYSQL_PORT%"
if not errorlevel 1 (
  echo [OK] MySQL ready on %MYSQL_PORT%.
  exit /b 0
)
echo [ERROR] MySQL is not listening on %NATIVE_MYSQL_PORT% or %MYSQL_PORT%.
exit /b 1

:check_required_port
call :is_listening "%~1"
if errorlevel 1 (
  echo [ERROR] %~2 is not listening on %~1.
  exit /b 1
)
echo [OK] %~2 ready on %~1.
exit /b 0

:sleep
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds %~1" >nul 2>nul
exit /b 0
