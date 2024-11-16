import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { v1Routes } from "./routes/v1/index.js";
import { setupSocket } from "./socket/index.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  },
});

app.use(cors());
// Start of Selection
app.use(express.json({ limit: "10mb" })); // This middleware parses incoming JSON requests and sets the limit to 1MB

// API versioning
app.use("/api/v1", v1Routes);

// Socket.IO setup
setupSocket(io);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 2100;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
