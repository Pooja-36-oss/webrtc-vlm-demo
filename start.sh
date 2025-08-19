#!/bin/bash
set -e

MODE=${MODE:-wasm}

echo "Starting demo in $MODE mode..."

if [ "$MODE" == "wasm" ]; then
  docker-compose up --build frontend
elif [ "$MODE" == "server" ]; then
  docker-compose up --build
else
  echo "Unknown mode: $MODE"
  exit 1
fi
 
