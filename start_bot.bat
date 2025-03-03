@echo off
cd /d %~dp0

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js and try again.
    pause
    exit /b 1
)

:: Install dependencies only if node_modules is missing
if not exist node_modules (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Failed to install dependencies. Check for errors above.
        pause
        exit /b 1
    )
)

echo Starting MEV Bot...
start "" /min cmd /c "node src/mevbot.js ^& exit"

:: Wait 2 seconds to ensure the bot starts before opening the browser
timeout /t 2 /nobreak >nul

:: Open the web interface
start http://localhost:8080

exit
