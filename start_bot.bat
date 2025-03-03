@echo off
start "" /min cmd /c "cd /d %~dp0 && node src/mevbot.js"
timeout /t 2 /nobreak >nul
start http://localhost:8080
exit
