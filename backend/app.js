const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
require("./Helpers/mongoDb");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const debug = require("debug")(process.env.DEBUG + "server");
const userRoutes = require("./routes/UserRoutes");
const path = require("path");
const feedRoutes = require("./routes/FeedRoutes");


const app = express();


const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  },
  transports: ['websocket', 'polling'], 
  pingTimeout: 60000, 
  pingInterval: 25000 
});

const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  socket.on('register', (userId) => {
    if (userId) {
      connectedUsers.set(userId.toString(), socket.id);
      console.log(`👤 User ${userId} registered with socket ${socket.id}`);
      console.log(`📊 Total connected users: ${connectedUsers.size}`);
      
      socket.emit('registered', { 
        success: true, 
        userId,
        message: 'Successfully registered for notifications' 
      });
    } else {
      console.log('⚠️ Registration attempted without userId');
    }
  });

  socket.on('disconnect', () => {
    for (let [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`👋 User ${userId} disconnected`);
        break;
      }
    }
    console.log('❌ Socket disconnected:', socket.id);
    console.log(`📊 Remaining connected users: ${connectedUsers.size}`);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  socket.on('ping', () => {
    socket.emit('pong');
  });
});

app.set('io', io);
app.set('connectedUsers', connectedUsers);

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", userRoutes);
app.use("/api/feeds", feedRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({ 
    message: "Server is running",
    connectedUsers: connectedUsers.size,
    socketIO: "enabled"
  });
});

app.get("/api/socket-status", (req, res) => {
  res.json({
    success: true,
    connectedUsers: connectedUsers.size,
    userIds: Array.from(connectedUsers.keys())
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  debug("Listening on " + PORT);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO enabled and ready`);
  console.log(`📡 WebSocket server: ws://0.0.0.0:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };