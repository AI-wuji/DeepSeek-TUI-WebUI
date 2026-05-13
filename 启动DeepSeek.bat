@echo off
title 无极-DeepSeek-WebUI
echo.
echo ============================================
echo   无极-DeepSeek-WebUI
echo    Model: deepseek-v4-pro
echo ============================================
echo.

cd /d C:\wuji-projects\??�޼�DeepSeek-TUI-WebUI

echo [1/3] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [X] Node.js not found!
    pause
    exit /b 1
)
echo [OK] Node.js ready

echo.
echo [2/3] Freeing port 18080...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":18080.*LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo [OK] Port 18080 free

echo.
echo [3/3] Starting server...
start http://127.0.0.1:18080
node server.js
pause
