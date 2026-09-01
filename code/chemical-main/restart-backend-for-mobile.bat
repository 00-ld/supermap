@echo off
chcp 65001 >nul
setlocal EnableExtensions
title Chemical Park Backend - Restart for Mobile

REM ============================================================
REM  重启后端加载 TaskController（移动端 task 闭环所需）
REM  仅启 Java 后端，复用原生 MySQL@3306（不需要 Docker）
REM  关闭窗口即停止后端
REM ============================================================

set "BACKEND_DIR=%~dp0backend"
set "BACKEND_PORT=8081"
cd /d "%BACKEND_DIR%"

echo [1/3] 释放旧 8081 端口...
for /f "tokens=5" %%I in ('netstat -ano -p tcp ^| findstr /R /C:":%BACKEND_PORT% .*LISTENING"') do (
    if not "%%I"=="0" (
        echo   杀旧进程 PID=%%I
        taskkill /PID %%I /T /F >nul 2>nul
    )
)
timeout /t 2 /nobreak >nul

echo [2/3] 确认 MySQL@3306 可达...
mysql -h127.0.0.1 -P3306 -uroot -p123456 chemical -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo   [错误] MySQL@3306 连不上，请先启动原生 MySQL 服务
    pause
    exit /b 1
)
echo   MySQL OK

echo [3/3] 启动后端（加载 TaskController，加载完可关此窗口的后台）...
echo   访问: http://127.0.0.1:%BACKEND_PORT%/api
echo   移动端 baseUrl 已配 10.0.2.2:8081（模拟器）或 192.168.0.101:8081（真机）
echo.
mvn.cmd spring-boot:run -Dspring-boot.run.jvmArguments="-Dspring.profiles.active=local -Dspring.datasource.password=123456 -Xmx512m"

endlocal
