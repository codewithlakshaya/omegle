const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  if (waitingUser) {
    socket.partner = waitingUser;
    waitingUser.partner = socket;

    socket.emit("connected");
    waitingUser.emit("connected");

    waitingUser = null;
  } else {
    waitingUser = socket;
  }

  socket.on("message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("message", msg);
    }
  });

  socket.on("next", () => {
    if (socket.partner) {
      socket.partner.emit("disconnected");
      socket.partner.partner = null;
    }
    socket.partner = null;

    if (waitingUser === socket) waitingUser = null;

    waitingUser = socket;
  });

  socket.on("disconnect", () => {
    if (socket.partner) {
      socket.partner.emit("disconnected");
      socket.partner.partner = null;
    }

    if (waitingUser === socket) waitingUser = null;
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
