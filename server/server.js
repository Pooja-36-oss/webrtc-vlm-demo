const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const mode = process.env.MODE || "wasm";
console.log(`🚀 Starting WebRTC server in ${mode} mode...`);

// 🔹 Serve static frontend (index.html, script.js, style.css, etc.)
app.use(express.static(path.join(__dirname, "public")));

// 🔹 Serve ONNX models directly from project root /models
app.use("/models", express.static(path.join(__dirname, "../models")));

// --- WebRTC Signaling with Socket.IO ---
io.on("connection", socket => {
  console.log("🔌 Client connected");

  socket.on("signal", data => {
    // forward to all other peers
    socket.broadcast.emit("signal", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
  });
});

// --- Optional: server-side inference mode ---
if (mode === "server") {
  const ort = require("onnxruntime-node");
  const bodyParser = require("body-parser");
  app.use(bodyParser.json({ limit: "10mb" })); // allow base64 images

  let session;
  (async () => {
    console.log("📦 Loading ONNX model (server mode)...");
    session = await ort.InferenceSession.create(
      path.join(__dirname, "../models/ssd_mobilenet_v1_coco_2018_01_28.onnx")
    );
    console.log("✅ Model loaded in server mode");
  })();

  // REST API for inference
  app.post("/infer", async (req, res) => {
    if (!session) {
      return res.status(503).json({ error: "Model not loaded yet" });
    }

    try {
      // Expect base64-encoded image in request
      const { tensor } = req.body;

      // Run inference
      const feeds = {};
      feeds[session.inputNames[0]] = new ort.Tensor("float32", tensor.data, tensor.dims);
      const results = await session.run(feeds);

      res.json({
        boxes: results["detection_boxes"]?.data || [],
        scores: results["detection_scores"]?.data || [],
        labels: results["detection_classes"]?.data || []
      });
    } catch (err) {
      console.error("Inference error:", err);
      res.status(500).json({ error: err.message });
    }
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});
