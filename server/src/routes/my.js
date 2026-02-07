import { Router } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

import Membership from "../models/Membership.js";
import EventRSVP from "../models/EventRSVP.js";

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

router.get(
  "/events",
  requireAuth,
  asyncHandler(async (req, res) => {
    const status = String(req.query.status ?? "yes");
    const upcoming = String(req.query.upcoming ?? "true") === "true";

    const allowed = new Set(["yes", "no", "maybe"]);
    if (!allowed.has(status)) {
      return res.status(400).json({ error: "status must be yes, no, or maybe" });
    }

    const rsvps = await EventRSVP.find({ userId: req.user._id, status })
      .populate({
        path: "eventId",
        populate: { path: "clubId", model: "Club" }
      })
      .sort({ updatedAt: -1 });

    const now = Date.now();

    const events = rsvps
      .map((r) => {
        const e = r.eventId;
        if (!e) return null;
        return { rsvpStatus: r.status, event: e };
      })
      .filter(Boolean)
      .filter((x) => {
        if (!upcoming) return true;
        return new Date(x.event.endAt).getTime() >= now;
      })
      .sort((a, b) => new Date(a.event.startAt) - new Date(b.event.startAt));

    res.json({ events });
  })
);

export default router;
