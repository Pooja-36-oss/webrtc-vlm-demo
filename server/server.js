const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve frontend files
app.use(express.static(__dirname + "/public"));

// WebRTC signaling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("signal", (data) => {
    socket.broadcast.emit("signal", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Listen on all interfaces
const PORT = 3000;
server.listen(3000, "0.0.0.0", () => {
  console.log("Server running on http://192.168.81.117:3000");
});

