import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in server/.env");
}

// ----- Models -----
const ClubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" }
  },
  { timestamps: true }
);

const Club = mongoose.model("Club", ClubSchema);

// ----- Routes -----
app.get("/api/health", (req, res) => {
  res.json({ ok: true, server: "express", time: new Date().toISOString() });
});

// Create a club
app.post("/api/clubs", async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "name is required" });
    }

    const club = await Club.create({
      name,
      description: description ?? ""
    });

    return res.status(201).json(club);
  } catch (err) {
    console.error("POST /api/clubs error:", err);
    return res.status(500).json({ error: "server error" });
  }
});

// List clubs
app.get("/api/clubs", async (req, res) => {
  try {
    const clubs = await Club.find().sort({ createdAt: -1 });
    return res.json(clubs);
  } catch (err) {
    console.error("GET /api/clubs error:", err);
    return res.status(500).json({ error: "server error" });
  }
});

// ----- Start server -----
async function start() {
  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected");

  app.listen(PORT, () => {
    console.log(`Express running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

start().catch((err) => {
  console.error("Server failed:", err);
  process.exit(1);
});
