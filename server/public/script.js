const remoteVideo = document.getElementById("remoteVideo");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

// --- Socket.IO + WebRTC ---
const socket = io();
const pc = new RTCPeerConnection({
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
});
const pendingCandidates = [];

// ICE candidates
pc.onicecandidate = e => {
  if (e.candidate) socket.emit("signal", { candidate: e.candidate });
};

// When remote stream arrives
pc.ontrack = e => {
  remoteVideo.srcObject = e.streams[0];
  remoteVideo.onloadedmetadata = () => {
    remoteVideo.play().catch(console.error);
    resizeCanvas();
  };
};

// --- Signaling ---
socket.on("signal", async data => {
  try {
    if (data.sdp?.type === "offer") {
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("signal", { sdp: answer });

      while (pendingCandidates.length) {
        await pc.addIceCandidate(new RTCIceCandidate(pendingCandidates.shift()));
      }
    } else if (data.candidate) {
      if (!pc.remoteDescription) pendingCandidates.push(data.candidate);
      else await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  } catch (err) {
    console.error("Laptop signaling error:", err);
  }
});

// --- ONNX Model ---
let session;
async function initModel() {
  session = await ort.InferenceSession.create(
    "/models/ssd_mobilenet_v1_coco_2018_01_28.onnx",
    { executionProviders: ["wasm"] }
  );
  console.log("✅ ONNX model loaded");
}

// --- Resize overlay canvas to match video ---
function resizeCanvas() {
  canvas.width = remoteVideo.videoWidth;
  canvas.height = remoteVideo.videoHeight;
}

// --- Preprocess image for ONNX (uint8, NHWC) ---
function preprocess(imageData) {
  const { data, width, height } = imageData;
  const uint8Data = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    uint8Data[i * 3]     = data[i * 4];     // R
    uint8Data[i * 3 + 1] = data[i * 4 + 1]; // G
    uint8Data[i * 3 + 2] = data[i * 4 + 2]; // B
  }
  return new ort.Tensor("uint8", uint8Data, [1, height, width, 3]);
}

// --- COCO Classes ---
const COCO_CLASSES = {
  1:"person",2:"bicycle",3:"car",4:"motorcycle",5:"airplane",6:"bus",7:"train",
  8:"truck",9:"boat",10:"traffic light",11:"fire hydrant",13:"stop sign",
  14:"parking meter",15:"bench",16:"bird",17:"cat",18:"dog",19:"horse",
  20:"sheep",21:"cow",22:"elephant",23:"bear",24:"zebra",25:"giraffe",
  27:"backpack",28:"umbrella",31:"handbag",32:"tie",33:"suitcase",34:"frisbee",
  35:"skis",36:"snowboard",37:"sports ball",38:"kite",39:"baseball bat",
  40:"baseball glove",41:"skateboard",42:"surfboard",43:"tennis racket",
  44:"bottle",46:"wine glass",47:"cup",48:"fork",49:"knife",50:"spoon",
  51:"bowl",52:"banana",53:"apple",54:"sandwich",55:"orange",56:"broccoli",
  57:"carrot",58:"hot dog",59:"pizza",60:"donut",61:"cake",62:"chair",
  63:"couch",64:"potted plant",65:"bed",67:"dining table",70:"toilet",
  72:"tv",73:"laptop",74:"mouse",75:"remote",76:"keyboard",77:"cell phone",
  78:"microwave",79:"oven",80:"toaster",81:"sink",82:"refrigerator",84:"book",
  85:"clock",86:"vase",87:"scissors",88:"teddy bear",89:"hair drier",90:"toothbrush"
};

// --- Metrics collection ---
const metrics = [];
let last_ts = performance.now();
let frameCounter = 0;

// --- Run detection ---
async function runDetection() {
  if (!session || remoteVideo.readyState < 2) {
    requestAnimationFrame(runDetection);
    return;
  }

  const capture_ts = performance.now();

  // Draw current video frame to offscreen canvas
  const offscreen = document.createElement("canvas");
  offscreen.width = 320;
  offscreen.height = 240;
  const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
  offCtx.drawImage(remoteVideo, 0, 0, 320, 240);
  const imageData = offCtx.getImageData(0, 0, 320, 240);
  const inputTensor = preprocess(imageData);

  try {
    const feeds = {};
    feeds[session.inputNames[0]] = inputTensor;
    const results = await session.run(feeds);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const boxes = results["detection_boxes:0"]?.data || [];
    const scores = results["detection_scores:0"]?.data || [];
    const labels = results["detection_classes:0"]?.data || [];
    const numDetections = results["num_detections:0"]?.data[0] || 0;

    const detections = [];

    for (let i = 0; i < numDetections; i++) {
      if (scores[i] > 0.5) {
        const [ymin, xmin, ymax, xmax] = boxes.slice(i * 4, (i + 1) * 4);
        const labelName = COCO_CLASSES[labels[i]] || `Class ${labels[i]}`;
        detections.push({ xmin, ymin, xmax, ymax, score: scores[i], label: labelName });

        // Draw bounding box
        ctx.strokeStyle = "lime";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          xmin * canvas.width,
          ymin * canvas.height,
          (xmax - xmin) * canvas.width,
          (ymax - ymin) * canvas.height
        );

        // Draw label
        ctx.fillStyle = "red";
        ctx.font = "14px Arial";
        ctx.fillText(
          `${labelName} (${(scores[i]*100).toFixed(1)}%)`,
          xmin * canvas.width,
          ymin * canvas.height - 5
        );
      }
    }

    const inference_ts = performance.now();
    const latency = inference_ts - capture_ts;
    const fps = 1000 / (capture_ts - last_ts);
    last_ts = capture_ts;

    // JSON per frame for UX/API contract
    const frameMessage = {
      frame_id: frameCounter++,
      capture_ts,
      recv_ts: Date.now(),
      inference_ts,
      detections
    };

    console.log(frameMessage);
    metrics.push(frameMessage);

  } catch (err) {
    console.error("Inference error:", err);
  }

  requestAnimationFrame(runDetection);
}

// --- Metrics download ---
function downloadMetrics() {
  const blob = new Blob([JSON.stringify(metrics, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "metrics.json";
  a.click();
  URL.revokeObjectURL(url);
}

// --- Add download button ---
const downloadBtn = document.createElement("button");
downloadBtn.id = "downloadMetricsBtn";
downloadBtn.textContent = "Download Metrics";
downloadBtn.style.position = "absolute";
downloadBtn.style.top = "10px";
downloadBtn.style.left = "10px";
downloadBtn.style.zIndex = 1000;
downloadBtn.style.padding = "8px 12px";
downloadBtn.style.fontSize = "14px";
document.body.appendChild(downloadBtn);
downloadBtn.addEventListener("click", downloadMetrics);

// --- Keypress 'd' for download ---
window.addEventListener("keydown", (e) => {
  if (e.key === "d" || e.key === "D") downloadMetrics();
});

// --- Init ---
initModel().then(runDetection);
window.addEventListener("resize", resizeCanvas);
