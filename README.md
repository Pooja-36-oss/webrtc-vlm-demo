# WebRTC Video & Metrics Demo – Day 2 & 3

## Overview

This project demonstrates a **WebRTC-based video stream** with **ONNX object detection**, metrics collection (FPS & latency), and automated download.  
It also includes scripts for Docker deployment and benchmarking.

---

## Features

- Real-time object detection using `ssd_mobilenet_v1_coco` ONNX model.
- Overlay bounding boxes with labels on video.
- Metrics collection:
  - `capture_ts` – frame capture timestamp
  - `recv_ts` – frame receive timestamp (for server-client)
  - `inference_ts` – model inference timestamp
  - Latency & FPS calculation
- Download metrics as `metrics.json` via button or **D** key.
- Configurable for front/back camera on mobile devices.
- Dockerized deployment for easy setup.
- Scripts for benchmarking and start-up.

---

## Setup

### Requirements

- Node.js >= 18
- npm
- Docker & docker-compose (optional for containerized setup)

### Clone Repo

```bash
git clone git@github.com:Pooja-36-oss/webrtc-vlm-demo.git
cd webrtc-vlm-demo


Day 2 – Metrics Collection

Run server locally:

npm install
npm start


Open the phone stream in browser:

Ensure front or back camera is selected.

Allow camera permissions.

Metrics collection:

Metrics collected per frame:

{
  "frame_id": "string_or_int",
  "capture_ts": 1690000000000,
  "recv_ts": 1690000000100,
  "inference_ts": 1690000000120,
  "detections": [
    {
      "label": "person",
      "score": 0.93,
      "xmin": 0.12,
      "ymin": 0.08,
      "xmax": 0.34,
      "ymax": 0.67
    }
  ]
}


Coordinates normalized [0..1].

Overlay aligns with frame using frame_id & capture_ts.

Download metrics:

Click Download Metrics button OR press D key.

Saves metrics as metrics.json.

Day 3 – Scripts & Docs

Start server with scripts:

# Linux/Mac
./start.sh

# Windows
start.bat


Docker deployment:

docker-compose up --build


Benchmarking scripts:

# Run CPU/GPU benchmark
./bench/run_bench.sh

# Windows batch
bench\run_bench.bat
