import { Router } from "express";
import Club from "../models/Club.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = Router();

// POST /api/clubs
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "name is required" });
    }

    const club = await Club.create({ name, description: description ?? "" });
    res.status(201).json(club);
  })
);

// GET /api/clubs
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const clubs = await Club.find().sort({ createdAt: -1 });
    res.json(clubs);
  })
);

export default router;