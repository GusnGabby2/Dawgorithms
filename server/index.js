import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

const PORT = process.env.PORT || 4000;

// Health endpoint (proves server runs)
app.get("/api/health", (req, res) => {
  res.json({ ok: true, server: "express", time: new Date().toISOString() });
});

// Start server first, then try DB (so dev isn't blocked)
app.listen(PORT, () => {
  console.log(`Express running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Try connecting to Mongo, but don’t crash if missing/bad
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.log("No MONGODB_URI found. Skipping MongoDB connection for now.");
} else {
  mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB connection failed (ok for now):", err.message));
}
