import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";

import Club from "../models/Club.js";
import Membership from "../models/Membership.js";
import Poll from "../models/Poll.js";
import PollResponse from "../models/PollResponse.js";

import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const availabilitySchema = z.object({
  availability: z.array(
    z.object({
      day: z.number().int().min(0).max(6),
      startMin: z.number().int().min(0).max(1440),
      endMin: z.number().int().min(0).max(1440)
    })
  )
});

const createPollSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  closesAt: z.coerce.date(),
  options: z.array(z.string().min(1)).min(2).optional()
});

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { name, description, imageUrl } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "name is required" });
    }

    if (imageUrl !== undefined && typeof imageUrl !== "string") {
      return res.status(400).json({ error: "imageUrl must be a string" });
    }

    const school = String(req.user.school ?? "").trim();

    const club = await Club.create({
      name,
      description: description ?? "",
      imageUrl: imageUrl ?? "",
      school,
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

router.get(
  "/explore",
  requireAuth,
  asyncHandler(async (req, res) => {
    const school = String(req.query.school ?? req.user.school ?? "").trim();
    const filter = school ? { school } : {};

    const clubs = await Club.find(filter).sort({ createdAt: -1 });
    const clubIds = clubs.map((c) => c._id);

    if (clubIds.length === 0) {
      return res.json({ clubs: [] });
    }

    const memberships = await Membership.find({
      userId: req.user._id,
      clubId: { $in: clubIds }
    }).select("clubId role");

    const counts = await Membership.aggregate([
      { $match: { clubId: { $in: clubIds } } },
      { $group: { _id: "$clubId", count: { $sum: 1 } } }
    ]);

    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
    const membershipMap = new Map(
      memberships.map((m) => [String(m.clubId), { role: m.role }])
    );

    res.json({
      clubs: clubs.map((club) => {
        const id = String(club._id);
        const membership = membershipMap.get(id);
        return {
          ...club.toObject(),
          memberCount: countMap.get(id) ?? 0,
          isMember: Boolean(membership),
          myRole: membership?.role ?? null
        };
      })
    });
  })
);

router.post(
  "/:clubId/join",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { clubId } = req.params;

    if (!mongoose.isValidObjectId(clubId)) {
      return res.status(400).json({ error: "Invalid club id" });
    }

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

router.get(
  "/:clubId/availability",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { clubId } = req.params;

    if (!mongoose.isValidObjectId(clubId)) {
      return res.status(400).json({ error: "Invalid club id" });
    }

    const membership = await Membership.findOne({ userId: req.user._id, clubId });
    if (!membership) {
      return res.status(404).json({ error: "Not a member of this club" });
    }

    res.json({ availability: membership.availability });
  })
);

router.put(
  "/:clubId/availability",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = availabilitySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: parsed.error.flatten()
      });
    }

    const { clubId } = req.params;

    if (!mongoose.isValidObjectId(clubId)) {
      return res.status(400).json({ error: "Invalid club id" });
    }

    const membership = await Membership.findOne({ userId: req.user._id, clubId });
    if (!membership) {
      return res.status(404).json({ error: "Not a member of this club" });
    }

    membership.availability = parsed.data.availability;
    await membership.save();

    res.json({ ok: true, availability: membership.availability });
  })
);

router.post(
  "/:clubId/polls",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { clubId } = req.params;

    if (!mongoose.isValidObjectId(clubId)) {
      return res.status(400).json({ error: "Invalid club id" });
    }

    const membership = await Membership.findOne({ userId: req.user._id, clubId });
    if (!membership) return res.status(403).json({ error: "Not a member of this club" });
    if (membership.role !== "admin") return res.status(403).json({ error: "Admin only" });

    const parsed = createPollSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: parsed.error.flatten()
      });
    }

    if (parsed.data.closesAt.getTime() <= Date.now()) {
      return res.status(400).json({ error: "closesAt must be in the future" });
    }

    const poll = await Poll.create({
      clubId,
      title: parsed.data.title,
      description: parsed.data.description ?? "",
      closesAt: parsed.data.closesAt,
      options: parsed.data.options ?? ["yes", "no", "maybe"],
      createdByUserId: req.user._id
    });

    res.status(201).json({ poll });
  })
);

router.get(
  "/:clubId/polls",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { clubId } = req.params;

    if (!mongoose.isValidObjectId(clubId)) {
      return res.status(400).json({ error: "Invalid club id" });
    }

    const membership = await Membership.findOne({ userId: req.user._id, clubId });
    if (!membership) return res.status(403).json({ error: "Not a member of this club" });

    const polls = await Poll.find({ clubId }).sort({ createdAt: -1 });

    const pollIds = polls.map((p) => p._id);
    const myResponses = await PollResponse.find({
      pollId: { $in: pollIds },
      userId: req.user._id
    });

    const myMap = new Map(myResponses.map((r) => [String(r.pollId), r.choice]));

    res.json({
      polls: polls.map((p) => ({
        ...p.toObject(),
        myChoice: myMap.get(String(p._id)) ?? null
      }))
    });
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const school = String(req.query.school ?? "").trim();
    const filter = school ? { school } : {};
    const clubs = await Club.find(filter).sort({ createdAt: -1 });
    res.json(clubs);
  })
);

export default router;
