@echo off
echo Starting SMC Hoarding Management System...

:: Terminal 1: Backend
start "Backend Server" cmd /k "npx tsx server.ts"

:: Terminal 2: Frontend
start "Frontend Server" cmd /k "npx vite"

:: Wait 3 seconds and open Browser automatically
timeout /t 3
start http://localhost:5173

exit