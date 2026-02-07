import { Router } from "express";
import Club from "../models/Club.js";
import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import Membership from "../models/Membership.js";

const router = Router();

// CREATE club (logged-in user becomes admin)
router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "name is required" });
    }

    const club = await Club.create({
      name,
      description: description ?? "",
      createdByUserId: req.user._id
    });

    await Membership.create({
      userId: req.user._id,
      clubId: club._id,
      role: "admin",
      availability: []
    });

    res.status(201).json(club);
  })
);

// JOIN club (logged-in user becomes member if not already)
router.post(
  "/:clubId/join",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { clubId } = req.params;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ error: "Club not found" });

    const membership = await Membership.findOneAndUpdate(
      { userId: req.user._id, clubId },
      { $setOnInsert: { role: "member", availability: [] } },
      { new: true, upsert: true }
    );

    res.status(201).json({ membership });
  })
);

// LIST clubs
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const clubs = await Club.find().sort({ createdAt: -1 });
    res.json(clubs);
  })
);

export default router;
