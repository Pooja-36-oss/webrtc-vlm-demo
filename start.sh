@echo off
setlocal

REM Default mode = wasm
if "%MODE%"=="" set MODE=wasm

echo 🚀 Starting demo in %MODE% mode...

docker-compose up --build

endlocal
