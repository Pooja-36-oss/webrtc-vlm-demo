#!/bin/bash
set -e

DURATION=30
MODE="wasm"

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --duration) DURATION="$2"; shift ;;
    --mode) MODE="$2"; shift ;;
  esac
  shift
done

echo "🚀 Running benchmark for $DURATION seconds in mode=$MODE"

# Export mode for frontend/server
export MODE=$MODE

# Start containers
docker-compose up --build -d

# Give server time to start
sleep 5

echo "👉 Open http://localhost:3000 on laptop browser and scan QR with phone."
echo "👉 The browser will auto-download metrics.json after ~${DURATION}s."
