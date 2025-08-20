@echo off
set MODE=wasm
set DURATION=30

echo 🚀 Running benchmark for %DURATION% seconds in mode=%MODE%

REM Start docker-compose
docker-compose up --build -d

REM Wait for server startup
timeout /t 5 >nul

echo 👉 Open http://localhost:3000 on laptop browser and scan QR with phone.
echo 👉 The browser will auto-download metrics.json after ~%DURATION%s.

pause
