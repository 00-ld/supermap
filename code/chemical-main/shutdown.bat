@echo off
setlocal EnableExtensions
title Chemical Park Monitor Shutdown

set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"
set "MYSQL_CONTAINERS=chemical-mysql chemical-local-mysql"
set "PORTS=8000 8001 8081 5173 8190"
set "DOCKER_CMD=docker.exe"
if exist "C:\Program Files\Docker\Docker\resources\bin\docker.exe" set "DOCKER_CMD=C:\Program Files\Docker\Docker\resources\bin\docker.exe"

echo.
echo ==========================================
echo  Chemical Park Monitor Shutdown
echo ==========================================

for %%P in (%PORTS%) do call :stop_port %%P

call :stop_project_processes

for %%C in (%MYSQL_CONTAINERS%) do call :stop_container %%C

echo.
echo [CHECK] Current project ports:
for %%P in (%PORTS%) do call :show_port %%P
netstat -ano -p tcp | findstr /R /C:":3307 .*LISTENING" >nul 2>nul
if "%ERRORLEVEL%"=="0" (echo   MySQL 3307: LISTENING) else (echo   MySQL 3307: stopped)

echo.
echo ==========================================
echo  Shutdown finished
echo ==========================================
exit /b 0

:stop_port
for /f "tokens=5" %%K in ('netstat -ano -p tcp ^| findstr /R /C:":%~1 .*LISTENING"') do (
  if not "%%K"=="0" (
    echo [STOP] Port %~1 PID %%K
    taskkill /PID %%K /T /F >nul 2>nul
  )
)
exit /b 0

:show_port
netstat -ano -p tcp | findstr /R /C:":%~1 .*LISTENING" >nul 2>nul
if "%ERRORLEVEL%"=="0" (echo   Port %~1: LISTENING) else (echo   Port %~1: stopped)
exit /b 0

:stop_project_processes
set "PROJECT_ROOT=%ROOT%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$root=$env:PROJECT_ROOT; $patterns=@($root + '\.codex-runlogs\start-', $root + '\frontend\node_modules', $root + '\algorithm', $root + '\backend', 'supermap_iportal_bridge.py', 'uvicorn api_server:app', 'uvicorn polo:app', 'spring-boot:run'); Get-CimInstance Win32_Process | Where-Object { $cmd=$_.CommandLine; if (-not $cmd) { return $false }; foreach ($p in $patterns) { if ($cmd.Contains($p)) { return $true } }; return $false } | ForEach-Object { Write-Host ('[STOP] Project process PID ' + $_.ProcessId); Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" 2>nul
exit /b 0

:stop_container
"%DOCKER_CMD%" stop "%~1" >nul 2>nul
if not errorlevel 1 (
  echo [STOP] Docker MySQL container %~1
) else (
  echo [SKIP] Docker MySQL container %~1 is not running.
)
exit /b 0
