@echo off
title Acadexa Startup
echo ========================================
echo   Starting Acadexa (Full Stack)
echo ========================================
echo.

REM Check if we're in the right folder
if not exist "server\package.json" (
    echo ERROR: Run this from /d/Acadexa (the folder containing server/ and client/)
    pause
    exit /b 1
)

REM 1. MongoDB
echo [1/4] Checking MongoDB...
mongosh --quiet --eval "db.runCommand({ping:1})" >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting MongoDB...
    start "" "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "D:\Acadexa\server\.data\db" --logpath "D:\Acadexa\server\.data\mongod.log" --fork
    timeout /t 5 >nul
    echo MongoDB started.
) else (
    echo MongoDB is already running.
)

REM 2. Seed database
echo [2/4] Seeding database...
cd /d/Acadexa/server
node utils/seed.js
if %errorlevel% neq 0 (
    echo ERROR: Seeding failed. Make sure MongoDB is running.
    pause
    exit /b 1
)

REM 3. Backend server in new window
echo [3/4] Starting backend server...
start "Acadexa Backend" cmd /k "cd /d/Acadexa/server && npm start"

REM 4. Frontend in new window
echo [4/4] Starting frontend...
start "Acadexa Frontend" cmd /k "cd /d/Acadexa/client && npm run dev"

echo.
echo ========================================
echo   Acadexa is starting
echo ========================================
echo   Backend : http://localhost:4000
echo   Frontend: http://localhost:5173
echo.
echo   Admin login: yuglakhani99@gmail.com / #yug7979..
echo.
echo   Two new windows opened: Backend and Frontend.
echo   Close those windows to stop the servers.
echo.
pause
