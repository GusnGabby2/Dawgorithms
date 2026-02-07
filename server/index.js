import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();
app.use(express.json());

// If you use Next.js rewrites (recommended), you can keep CORS relaxed.
// If not using rewrites, set origin to http://localhost:3000
app.use(cors({ origin: true, credentials: true }));

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in server/.env");
}

await mongoose.connect(MONGODB_URI);
console.log("Connected to MongoDB");

// ----- Models (keep tiny for hackathon) -----
const ClubSchema = new mongoose.Schema(
  { name: { type: String, required: true }, description: String },
  { timestamps: true }
);
const Club = mongoose.model("Club", ClubSchema);

// ----- Routes -----
app.get("/health", (req, res) => res.json({ ok: true }));

app.get("/clubs", async (req, res) => {
  const clubs = await Club.find().sort({ createdAt: -1 });
  res.json(clubs);
});

app.post("/clubs", async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });

  const club = await Club.create({ name, description });
  res.status(201).json(club);
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
