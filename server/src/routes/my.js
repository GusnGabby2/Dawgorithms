import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import Membership from "../models/Membership.js";

const router = Router();

router.get(
  "/clubs",
  requireAuth,
  asyncHandler(async (req, res) => {
    const memberships = await Membership.find({ userId: req.user._id })
      .populate("clubId")
      .sort({ createdAt: -1 });

    const result = memberships.map((m) => ({
      role: m.role,
      availability: m.availability,
      club: m.clubId
    }));

    res.json(result);
  })
);

export default router;
