@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Chemical Park Monitor Startup

set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"
set "STARTUP_CHECK_ONLY="
set "STARTUP_NO_PAUSE="
call :parse_args %*

set "MYSQL_CONTAINER=chemical-mysql"
set "MYSQL_LEGACY_CONTAINER=chemical-local-mysql"
set "MYSQL_IMAGE=mysql:8.0"
set "MYSQL_PORT=3307"
set "MYSQL_DATABASE=chemical"
set "ALGORITHM_PORT=8000"
set "YOLO_PORT=8001"
set "BACKEND_PORT=8081"
set "FRONTEND_PORT=5173"
set "SUPERMAP_PORT=8190"

call :ensure_dirs
call :ensure_local_env
call :load_local_env "%ROOT%\.env.local"

set "SPRING_PROFILES_ACTIVE=local"
if not defined DB_USERNAME set "DB_USERNAME=root"
if not defined ALGORITHM_REQUIRE_AUTH set "ALGORITHM_REQUIRE_AUTH=true"
if not defined DB_PASSWORD if defined SPRING_DATASOURCE_PASSWORD set "DB_PASSWORD=%SPRING_DATASOURCE_PASSWORD%"
if not defined DB_PASSWORD if defined MYSQL_ROOT_PASSWORD set "DB_PASSWORD=%MYSQL_ROOT_PASSWORD%"
if not defined MYSQL_ROOT_PASSWORD if defined DB_PASSWORD set "MYSQL_ROOT_PASSWORD=%DB_PASSWORD%"
if not defined STARTUP_CHECK_ONLY call :require_runtime_secrets
if errorlevel 1 goto fail
set "SPRING_DATASOURCE_USERNAME=%DB_USERNAME%"
set "SPRING_DATASOURCE_PASSWORD=%DB_PASSWORD%"
set "SPRING_DATASOURCE_URL=jdbc:mysql://127.0.0.1:%MYSQL_PORT%/%MYSQL_DATABASE%?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true"
if not defined MYSQL_APP_PASSWORD set "MYSQL_APP_PASSWORD=%DB_PASSWORD%"
if /I not "%ALGORITHM_REQUIRE_AUTH%"=="true" echo [WARN] Algorithm API auth is disabled for this 127.0.0.1 session only.
if not defined ANALYSIS_SERVICE_URL set "ANALYSIS_SERVICE_URL=http://127.0.0.1:%YOLO_PORT%/api/analysis/person"
if not defined CORS_ALLOWED_ORIGINS set "CORS_ALLOWED_ORIGINS=http://localhost:%FRONTEND_PORT%,http://127.0.0.1:%FRONTEND_PORT%"
if not defined SUPERMAP_DASHBOARD_URL set "SUPERMAP_DASHBOARD_URL=http://127.0.0.1:8190/iportal/"

call :resolve_tools

echo.
echo ==========================================
echo  Chemical Park Monitor Startup
echo ==========================================
echo Project:  %ROOT%
echo Database: 127.0.0.1:%MYSQL_PORT% / %MYSQL_DATABASE% ^(Docker %MYSQL_CONTAINER%^)
echo Algorithm auth: %ALGORITHM_REQUIRE_AUTH%
echo.

call :require_file "%ROOT%\frontend\package.json" "frontend package.json"
if errorlevel 1 goto fail
call :require_file "%ROOT%\backend\pom.xml" "backend pom.xml"
if errorlevel 1 goto fail
call :require_file "%ROOT%\algorithm\api_server.py" "algorithm api_server.py"
if errorlevel 1 goto fail
call :require_file "%ROOT%\algorithm\polo.py" "algorithm polo.py"
if errorlevel 1 goto fail
call :require_file "%ROOT%\algorithm\service_config.py" "algorithm service_config.py"
if errorlevel 1 goto fail

call :command_exists "%NODE_CMD%" "Node.js"
if errorlevel 1 goto fail
call :command_exists "%NPM_CMD%" "npm"
if errorlevel 1 goto fail
call :check_node_version
if errorlevel 1 goto fail
call :command_exists "%PYTHON_CMD%" "Python"
if errorlevel 1 goto fail
call :command_exists "%UV_CMD%" "uv"
if errorlevel 1 goto fail
call :command_exists "%MVN_CMD%" "Maven"
if errorlevel 1 goto fail
call :command_exists "%DOCKER_CMD%" "Docker"
if errorlevel 1 goto fail

if defined STARTUP_CHECK_ONLY (
  echo [OK] startup.bat dependency and entry check passed.
  exit /b 0
)

call :stop_project_services
call :ensure_mysql
if errorlevel 1 goto fail
call :init_database
if errorlevel 1 goto fail

call :start_uvicorn_service "%ALGORITHM_PORT%" "Algorithm API" "algorithm.api_server:app"
call :start_uvicorn_service "%YOLO_PORT%" "YOLO Person API" "algorithm.polo:app"
call :start_service "%BACKEND_PORT%" "Java Backend" "%ROOT%\backend" "%MVN_CMD%" "spring-boot:run"
call :start_service "%FRONTEND_PORT%" "Frontend Dev Server" "%ROOT%\frontend" "%NPM_CMD%" "run dev -- --host 127.0.0.1 --port %FRONTEND_PORT%"
call :start_supermap_bridge

echo.
echo [WAIT] Checking service readiness...
call :wait_port "%ALGORITHM_PORT%" "Algorithm API"
call :wait_port "%YOLO_PORT%" "YOLO Person API"
call :wait_port "%BACKEND_PORT%" "Java Backend"
call :wait_port "%FRONTEND_PORT%" "Frontend Dev Server"
call :wait_port "%SUPERMAP_PORT%" "SuperMap iPortal Bridge"
call :check_url "http://127.0.0.1:%ALGORITHM_PORT%/api/health" "Algorithm health"
call :check_url "http://127.0.0.1:%BACKEND_PORT%/healthz" "Backend health"

echo.
echo ==========================================
echo  Startup finished
echo ==========================================
echo Frontend:  http://127.0.0.1:%FRONTEND_PORT%/index.html
echo Backend:   http://127.0.0.1:%BACKEND_PORT%/api
echo Algorithm: http://127.0.0.1:%ALGORITHM_PORT%/api/health
echo YOLO:      http://127.0.0.1:%YOLO_PORT%/docs
echo SuperMap:  "%SUPERMAP_DASHBOARD_URL%"
echo Login:     register a local user, then promote a trusted user to admin explicitly
echo Logs:      %ROOT%\logs\startup-*.log
echo.
if not defined STARTUP_NO_PAUSE pause
exit /b 0

:fail
echo.
echo [FAILED] Startup cannot continue.
echo Check logs under: %ROOT%\logs
if not defined STARTUP_NO_PAUSE pause
exit /b 1

:ensure_dirs
if not exist "%ROOT%\logs" mkdir "%ROOT%\logs" >nul 2>nul
if not exist "%ROOT%\.codex-runlogs" mkdir "%ROOT%\.codex-runlogs" >nul 2>nul
exit /b 0

:parse_args
if "%~1"=="" exit /b 0
if /I "%~1"=="--check" set "STARTUP_CHECK_ONLY=1"
if /I "%~1"=="--no-pause" set "STARTUP_NO_PAUSE=1"
shift
goto parse_args

:ensure_local_env
if exist "%ROOT%\.env.local" exit /b 0
(
  echo # Local-only development template. This file is gitignored.
  echo # Fill secret values before running startup.bat without --check.
  echo DB_USERNAME=root
  echo DB_PASSWORD=
  echo MYSQL_ROOT_PASSWORD=
  echo MYSQL_APP_PASSWORD=
  echo MYSQL_DATABASE=chemical
  echo JWT_SECRET=
  echo ALGORITHM_REQUIRE_AUTH=true
  echo ALGORITHM_API_KEY=
  echo SUPERMAP_START_DESKTOP=false
) > "%ROOT%\.env.local"
echo [OK] Created local development env template: %ROOT%\.env.local
exit /b 0

:load_local_env
if not exist "%~1" exit /b 0
for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%~1") do (
  if not "%%~A"=="" if not defined %%~A set "%%~A=%%~B"
)
if defined MYSQL_DATABASE set "MYSQL_DATABASE=%MYSQL_DATABASE%"
exit /b 0

:require_runtime_secrets
set "KNOWN_WEAK_PASSWORD=123"
set "KNOWN_WEAK_PASSWORD=%KNOWN_WEAK_PASSWORD%456"
if not defined DB_PASSWORD if not defined MYSQL_ROOT_PASSWORD call :prompt_db_password
if not defined DB_PASSWORD if defined MYSQL_ROOT_PASSWORD set "DB_PASSWORD=%MYSQL_ROOT_PASSWORD%"
if not defined MYSQL_ROOT_PASSWORD if defined DB_PASSWORD set "MYSQL_ROOT_PASSWORD=%DB_PASSWORD%"
if not defined DB_PASSWORD (
  echo [ERROR] DB_PASSWORD or MYSQL_ROOT_PASSWORD is required. Put it in .env.local or enter it when prompted.
  exit /b 1
)
if /I "%DB_PASSWORD%"=="%KNOWN_WEAK_PASSWORD%" (
  echo [ERROR] Refusing a known weak DB_PASSWORD. Use a local-only strong password.
  exit /b 1
)
if /I "%MYSQL_ROOT_PASSWORD%"=="%KNOWN_WEAK_PASSWORD%" (
  echo [ERROR] Refusing a known weak MYSQL_ROOT_PASSWORD. Use a local-only strong password.
  exit /b 1
)
if not defined JWT_SECRET call :prompt_jwt_secret
if not defined JWT_SECRET (
  echo [ERROR] JWT_SECRET is required. Store a local-only random value in .env.local.
  exit /b 1
)
if /I "%ALGORITHM_REQUIRE_AUTH%"=="true" (
  if not defined ALGORITHM_API_KEY call :prompt_algorithm_key
  if not defined ALGORITHM_API_KEY (
    echo [ERROR] ALGORITHM_REQUIRE_AUTH=true requires ALGORITHM_API_KEY.
    exit /b 1
  )
  if /I "%ALGORITHM_API_KEY%"=="replace_with_random_algorithm_key" (
    echo [ERROR] Replace the placeholder ALGORITHM_API_KEY with a random local-only value.
    exit /b 1
  )
)
exit /b 0

:prompt_db_password
echo [INPUT] Enter local MySQL root password. Input is not saved by this script.
set /p "DB_PASSWORD=DB_PASSWORD: "
exit /b 0

:prompt_jwt_secret
echo [INPUT] Enter local JWT secret. Input is not saved by this script.
set /p "JWT_SECRET=JWT_SECRET: "
exit /b 0

:prompt_algorithm_key
echo [INPUT] Enter local Algorithm API key. Input is not saved by this script.
set /p "ALGORITHM_API_KEY=ALGORITHM_API_KEY: "
exit /b 0

:resolve_tools
if not defined NODE_CMD set "NODE_CMD=node.exe"
if not defined NPM_CMD set "NPM_CMD=npm.cmd"
set "PYTHON_CMD=python.exe"
set "UV_CMD=uv.exe"
set "MVN_CMD=mvn.cmd"
set "DOCKER_CMD=docker.exe"
if defined NODE_HOME if exist "%NODE_HOME%\node.exe" (
  set "NODE_CMD=%NODE_HOME%\node.exe"
  if exist "%NODE_HOME%\npm.cmd" set "NPM_CMD=%NODE_HOME%\npm.cmd"
  set "PATH=%NODE_HOME%;%PATH%"
)
if "%NODE_CMD%"=="node.exe" (
  where.exe node.exe >nul 2>nul
  if errorlevel 1 if exist "C:\Program Files\nodejs\node.exe" (
  set "NODE_CMD=C:\Program Files\nodejs\node.exe"
  set "NPM_CMD=C:\Program Files\nodejs\npm.cmd"
  set "PATH=C:\Program Files\nodejs;%PATH%"
  )
)
if defined MAVEN_HOME if exist "%MAVEN_HOME%\bin\mvn.cmd" set "MVN_CMD=%MAVEN_HOME%\bin\mvn.cmd"
if "%MVN_CMD%"=="mvn.cmd" if defined M2_HOME if exist "%M2_HOME%\bin\mvn.cmd" set "MVN_CMD=%M2_HOME%\bin\mvn.cmd"
if "%MVN_CMD%"=="mvn.cmd" call :resolve_maven
if exist "%ROOT%\.venv\Scripts\python.exe" (
  set "PYTHON_CMD=%ROOT%\.venv\Scripts\python.exe"
) else if exist "%USERPROFILE%\AppData\Local\Microsoft\WindowsApps\python.exe" (
  set "PYTHON_CMD=%USERPROFILE%\AppData\Local\Microsoft\WindowsApps\python.exe"
)
if exist "%USERPROFILE%\.local\bin\uv.exe" (
  set "UV_CMD=%USERPROFILE%\.local\bin\uv.exe"
) else if exist "%USERPROFILE%\AppData\Roaming\Python\Python312\Scripts\uv.exe" (
  set "UV_CMD=%USERPROFILE%\AppData\Roaming\Python\Python312\Scripts\uv.exe"
)
if exist "C:\Program Files\Docker\Docker\resources\bin\docker.exe" set "DOCKER_CMD=C:\Program Files\Docker\Docker\resources\bin\docker.exe"
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

:require_file
if exist "%~1" exit /b 0
echo [ERROR] Missing %~2: %~1
exit /b 1

:command_exists
if exist "%~1" (
  echo [OK] %~2 found: %~1
  exit /b 0
)
where.exe %~1 >nul 2>nul
if "%ERRORLEVEL%"=="0" (
  echo [OK] %~2 found.
  exit /b 0
)
echo [ERROR] %~2 was not found.
exit /b 1

:check_node_version
set "NODE_VERSION="
for /f "delims=" %%V in ('""%NODE_CMD%" -p "process.versions.node" 2^>nul"') do set "NODE_VERSION=%%V"
if not defined NODE_VERSION (
  echo [ERROR] Unable to read Node.js version from %NODE_CMD%.
  exit /b 1
)
set "NODE_MAJOR="
for /f "tokens=1 delims=." %%M in ("%NODE_VERSION%") do set "NODE_MAJOR=%%M"
if not defined NODE_MAJOR (
  echo [ERROR] Unable to parse Node.js version: %NODE_VERSION%.
  exit /b 1
)
if %NODE_MAJOR% LSS 20 (
  echo [ERROR] Unsupported Node.js %NODE_VERSION%. Use Node.js 20 through 24 for this Vite 5 frontend.
  exit /b 1
)
if %NODE_MAJOR% GEQ 25 (
  echo [ERROR] Unsupported Node.js %NODE_VERSION%. Use Node.js 20 through 24 for this Vite 5 frontend.
  exit /b 1
)
echo [OK] Node.js version supported: %NODE_VERSION%
exit /b 0

:stop_project_services
for %%P in (%ALGORITHM_PORT% %YOLO_PORT% %BACKEND_PORT% %FRONTEND_PORT% %SUPERMAP_PORT%) do call :stop_port %%P
exit /b 0

:stop_port
for /f "tokens=5" %%P in ('netstat -ano -p tcp ^| findstr /R /C:":%~1 .*LISTENING"') do (
  if not "%%P"=="0" (
    echo [STOP] Port %~1 PID %%P
    taskkill /PID %%P /T /F >nul 2>nul
  )
)
exit /b 0

:ensure_mysql
"%DOCKER_CMD%" info >nul 2>nul
if errorlevel 1 (
  call :start_docker_desktop
  if errorlevel 1 exit /b 1
)

call :adopt_mysql_container

call :container_running "%MYSQL_CONTAINER%"
if not errorlevel 1 (
  echo [OK] Docker MySQL is already running.
  call :wait_mysql
  exit /b %ERRORLEVEL%
)

call :container_exists "%MYSQL_CONTAINER%"
if not errorlevel 1 (
  echo [START] Starting existing Docker MySQL container...
  "%DOCKER_CMD%" start %MYSQL_CONTAINER% >nul
  call :wait_mysql
  exit /b %ERRORLEVEL%
)

echo [START] Creating Docker MySQL on 127.0.0.1:%MYSQL_PORT%...
"%DOCKER_CMD%" run -d --name %MYSQL_CONTAINER% ^
  -e MYSQL_ROOT_PASSWORD=%MYSQL_ROOT_PASSWORD% ^
  -e MYSQL_DATABASE=%MYSQL_DATABASE% ^
  -p 127.0.0.1:%MYSQL_PORT%:3306 ^
  -v chemical_local_mysql_data:/var/lib/mysql ^
  %MYSQL_IMAGE% --character-set-server=utf8mb4 --collation-server=utf8mb4_general_ci >nul
if errorlevel 1 (
  echo [WARN] First MySQL container creation failed. Pulling %MYSQL_IMAGE% and retrying...
  "%DOCKER_CMD%" pull %MYSQL_IMAGE%
  if errorlevel 1 (
    echo [ERROR] Failed to pull %MYSQL_IMAGE%.
    exit /b 1
  )
  "%DOCKER_CMD%" run -d --name %MYSQL_CONTAINER% ^
    -e MYSQL_ROOT_PASSWORD=%MYSQL_ROOT_PASSWORD% ^
    -e MYSQL_DATABASE=%MYSQL_DATABASE% ^
    -p 127.0.0.1:%MYSQL_PORT%:3306 ^
    -v chemical_local_mysql_data:/var/lib/mysql ^
    %MYSQL_IMAGE% --character-set-server=utf8mb4 --collation-server=utf8mb4_general_ci >nul
  if errorlevel 1 (
    echo [ERROR] Failed to create Docker MySQL container on port %MYSQL_PORT%.
    exit /b 1
  )
)
call :wait_mysql
exit /b %ERRORLEVEL%

:adopt_mysql_container
call :container_running "%MYSQL_CONTAINER%"
if not errorlevel 1 exit /b 0
if defined MYSQL_LEGACY_CONTAINER (
  call :container_running "%MYSQL_LEGACY_CONTAINER%"
  if not errorlevel 1 (
    set "MYSQL_CONTAINER=%MYSQL_LEGACY_CONTAINER%"
    exit /b 0
  )
  call :container_exists "%MYSQL_CONTAINER%"
  if not errorlevel 1 exit /b 0
  call :container_exists "%MYSQL_LEGACY_CONTAINER%"
  if not errorlevel 1 set "MYSQL_CONTAINER=%MYSQL_LEGACY_CONTAINER%"
)
exit /b 0

:container_running
set "CONTAINER_STATE="
for /f %%S in ('"%DOCKER_CMD%" inspect -f "{{.State.Running}}" "%~1" 2^>nul') do set "CONTAINER_STATE=%%S"
if /I "%CONTAINER_STATE%"=="true" exit /b 0
exit /b 1

:container_exists
"%DOCKER_CMD%" inspect "%~1" >nul 2>nul
exit /b %ERRORLEVEL%

:start_docker_desktop
if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
  echo [START] Docker Desktop is not running. Starting Docker Desktop...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath 'C:\Program Files\Docker\Docker\Docker Desktop.exe' -WindowStyle Hidden" >nul 2>nul
  for /l %%I in (1,1,90) do (
    "%DOCKER_CMD%" info >nul 2>nul
    if not errorlevel 1 (
      echo [OK] Docker Desktop is ready.
      exit /b 0
    )
    call :sleep_seconds 2
  )
  echo [ERROR] Docker Desktop did not become ready in time.
  exit /b 1
)
echo [ERROR] Docker Desktop is not running and Docker Desktop.exe was not found.
exit /b 1

:wait_mysql
for /l %%I in (1,1,60) do (
  "%DOCKER_CMD%" exec %MYSQL_CONTAINER% mysqladmin ping -uroot -p%MYSQL_ROOT_PASSWORD% --silent >nul 2>nul
  if not errorlevel 1 (
    echo [OK] MySQL is ready on 127.0.0.1:%MYSQL_PORT%.
    exit /b 0
  )
  call :sleep_seconds 2
)
echo [ERROR] MySQL did not become ready in time.
exit /b 1

:init_database
echo [DB] Importing schema and seed data...
"%DOCKER_CMD%" exec -i %MYSQL_CONTAINER% mysql -uroot -p%MYSQL_ROOT_PASSWORD% < "%ROOT%\deploy\mysql\init.sql"
if errorlevel 1 (
  echo [ERROR] Failed to import deploy\mysql\init.sql
  exit /b 1
)
echo [OK] Database schema is initialized. No default admin account was seeded.
exit /b 0

:start_service
set "PORT=%~1"
set "TITLE=%~2"
set "DIR=%~3"
set "EXE=%~4"
set "ARGS=%~5"
call :is_port_listening "%PORT%"
if not errorlevel 1 (
  echo [SKIP] %TITLE% port %PORT% is already listening.
  exit /b 0
)
echo [START] %TITLE% on port %PORT%
set "RUN_FILE=%ROOT%\.codex-runlogs\start-%PORT%.bat"
set "LOG_FILE=%ROOT%\logs\startup-%PORT%.log"
set "ERR_FILE=%ROOT%\logs\startup-%PORT%.err.log"
(
  echo @echo off
  echo set "SPRING_PROFILES_ACTIVE=%SPRING_PROFILES_ACTIVE%"
  echo set "SPRING_DATASOURCE_URL=%SPRING_DATASOURCE_URL%"
  echo set "SPRING_DATASOURCE_USERNAME=%SPRING_DATASOURCE_USERNAME%"
  echo set "SPRING_DATASOURCE_PASSWORD=%SPRING_DATASOURCE_PASSWORD%"
  echo set "JWT_SECRET=%JWT_SECRET%"
  echo set "ANALYSIS_SERVICE_URL=%ANALYSIS_SERVICE_URL%"
  echo set "CORS_ALLOWED_ORIGINS=%CORS_ALLOWED_ORIGINS%"
  echo set "ALGORITHM_REQUIRE_AUTH=%ALGORITHM_REQUIRE_AUTH%"
  echo set "ALGORITHM_API_KEY=%ALGORITHM_API_KEY%"
  echo cd /d "%DIR%"
  echo "%EXE%" %ARGS% 1^>^>"%LOG_FILE%" 2^>^>"%ERR_FILE%"
) > "%RUN_FILE%"
call :start_hidden "%RUN_FILE%"
exit /b 0

:start_uvicorn_service
set "UVICORN_PORT=%~1"
set "UVICORN_TITLE=%~2"
set "UVICORN_APP=%~3"
call :start_service "%UVICORN_PORT%" "%UVICORN_TITLE%" "%ROOT%" "%UV_CMD%" "run --python %PYTHON_CMD% uvicorn %UVICORN_APP% --host 127.0.0.1 --port %UVICORN_PORT%"
exit /b %ERRORLEVEL%

:start_supermap_bridge
call :is_port_listening "%SUPERMAP_PORT%"
if not errorlevel 1 (
  echo [SKIP] SuperMap iPortal Bridge port %SUPERMAP_PORT% is already listening.
  exit /b 0
)
(
  echo import sys
  echo from http.server import BaseHTTPRequestHandler, HTTPServer
  echo port = int(sys.argv[1]^)
  echo frontend = int(sys.argv[2]^)
  echo target = f'http://127.0.0.1:{frontend}/index.html#/screen'
  echo class Handler(BaseHTTPRequestHandler^):
  echo     def do_GET(self^):
  echo         self.send_response(302^)
  echo         self.send_header('Location', target^)
  echo         self.send_header('Access-Control-Allow-Origin', '*'^)
  echo         self.end_headers(^)
  echo     def log_message(self, fmt, *args^):
  echo         return
  echo HTTPServer(('127.0.0.1', port^), Handler^).serve_forever(^)
) > "%ROOT%\.codex-runlogs\supermap_iportal_bridge.py"
call :start_service "%SUPERMAP_PORT%" "SuperMap iPortal Bridge" "%ROOT%" "%PYTHON_CMD%" ".codex-runlogs\supermap_iportal_bridge.py %SUPERMAP_PORT% %FRONTEND_PORT%"
exit /b %ERRORLEVEL%

:start_hidden
start "" /b "%ComSpec%" /d /c call "%~1" >nul 2>nul
exit /b %ERRORLEVEL%

:wait_port
set "CHECK_PORT=%~1"
set "CHECK_NAME=%~2"
for /l %%I in (1,1,45) do (
  call :is_port_listening "%CHECK_PORT%"
  if not errorlevel 1 (
    echo [OK] %CHECK_NAME% port %CHECK_PORT% is listening.
    exit /b 0
  )
  call :sleep_seconds 2
)
echo [ERROR] %CHECK_NAME% port %CHECK_PORT% did not become ready.
exit /b 1

:sleep_seconds
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds %~1" >nul 2>nul
exit /b 0

:check_url
curl.exe -fsS --max-time 8 "%~1" >nul 2>nul
if "%ERRORLEVEL%"=="0" (
  echo [OK] %~2 passed.
  exit /b 0
)
echo [ERROR] %~2 failed: %~1
exit /b 1

:is_port_listening
netstat -ano -p tcp | findstr /R /C:":%~1 .*LISTENING" >nul 2>nul
exit /b %ERRORLEVEL%
