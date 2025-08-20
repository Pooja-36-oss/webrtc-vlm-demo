# WebRTC Video & Metrics Demo – Day 1, 2 & 3

## Overview

This project demonstrates a **WebRTC-based video stream** with real-time **ONNX object detection**, metrics collection, overlay visualization, and Docker deployment.  
It is designed to run on mobile and desktop browsers, supporting front/back cameras, and includes benchmarking scripts.

---

## Day 1 – WebRTC Video Demo

### Features

- Real-time video streaming from phone camera to laptop/browser.
- Front camera enabled by default (can switch to back camera with settings).
- Video overlay using `<canvas>` for visualization.
- Basic HTML/CSS/JS setup for demonstration.

### Setup

1. Clone repo:

```bash
git clone git@github.com:Pooja-36-oss/webrtc-vlm-demo.git
cd webrtc-vlm-demo

Install dependencies:

npm install


Start server:

npm start


Open in browser:

Laptop: http://localhost:3000

Phone: http://<laptop-ip>:3000/phone.html

Day 2 – Metrics Collection
Features

Object detection using ssd_mobilenet_v1_coco ONNX model.

Overlay bounding boxes with class labels on video.

Metrics collection per frame:

capture_ts – frame capture timestamp

recv_ts – frame receive timestamp (for server-client)

inference_ts – model inference timestamp

Latency & FPS calculation

Example Metrics JSON
{
  "frame_id": "1",
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


Coordinates normalized [0..1] for overlay alignment.

Metrics collected automatically per frame.

Download metrics via Download Metrics button or press D key.

Day 3 – Scripts, Docker & Docs
Scripts

Start server:

# Linux / Mac
./start.sh

# Windows
start.bat


Benchmarking:

# Linux/Mac
./bench/run_bench.sh

# Windows
bench\run_bench.bat

Docker Deployment
docker-compose up --build


Includes Dockerfile and docker-compose.yml for containerized setup.
