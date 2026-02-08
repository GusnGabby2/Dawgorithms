import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";

import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

import Poll from "../models/Poll.js";
import PollResponse from "../models/PollResponse.js";
import Membership from "../models/Membership.js";

const router = Router();

const respondSchema = z.object({
  choice: z.string().min(1)
});

async function computeRecommendations({ poll, yesChoice, step, limit }) {
  const yesResponses = await PollResponse.find({ pollId: poll._id, choice: yesChoice });
  const userIds = yesResponses.map((r) => r.userId);

  if (userIds.length === 0) {
    return {
      yesCount: 0,
      recommendations: [],
      note: "No YES responses yet"
    };
  }

  const memberships = await Membership.find({ clubId: poll.clubId, userId: { $in: userIds } });

  const slotsPerDay = 1440 / step;
  const counts = Array.from({ length: 7 }, () => Array(slotsPerDay).fill(0));

  for (const m of memberships) {
    for (const b of m.availability ?? []) {
      const day = b.day;
      if (day < 0 || day > 6) continue;

      const startIdx = Math.floor(b.startMin / step);
      const endIdx = Math.floor(b.endMin / step);

      for (let i = startIdx; i < endIdx; i++) {
        if (i >= 0 && i < slotsPerDay) counts[day][i] += 1;
      }
    }
  }

  const flat = [];
  for (let day = 0; day < 7; day++) {
    for (let i = 0; i < slotsPerDay; i++) {
      const count = counts[day][i];
      if (count > 0) {
        flat.push({
          day,
          startMin: i * step,
          endMin: (i + 1) * step,
          count
        });
      }
    }
  }

  flat.sort((a, b) => b.count - a.count || a.day - b.day || a.startMin - b.startMin);

  const merged = [];
  for (const slot of flat) {
    const last = merged[merged.length - 1];
    if (last && last.day === slot.day && last.count === slot.count && last.endMin === slot.startMin) {
      last.endMin = slot.endMin;
    } else {
      merged.push({ ...slot });
    }
  }

  return {
    yesCount: userIds.length,
    recommendations: merged.slice(0, limit),
    note: null
  };
}

router.get(
  "/:pollId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { pollId } = req.params;

    if (!mongoose.isValidObjectId(pollId)) {
      return res.status(400).json({ error: "Invalid poll id" });
    }

    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ error: "Poll not found" });

    const membership = await Membership.findOne({ userId: req.user._id, clubId: poll.clubId });
    if (!membership) return res.status(403).json({ error: "Not a member of this club" });

    const my = await PollResponse.findOne({ pollId: poll._id, userId: req.user._id });

    const countsAgg = await PollResponse.aggregate([
      { $match: { pollId: new mongoose.Types.ObjectId(pollId) } },
      { $group: { _id: "$choice", count: { $sum: 1 } } }
    ]);

    const counts = Object.fromEntries(countsAgg.map((x) => [x._id, x.count]));

    res.json({
      poll,
      myChoice: my?.choice ?? null,
      counts
    });
  })
);

router.put(
  "/:pollId/respond",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { pollId } = req.params;

    if (!mongoose.isValidObjectId(pollId)) {
      return res.status(400).json({ error: "Invalid poll id" });
    }

    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ error: "Poll not found" });

    const membership = await Membership.findOne({ userId: req.user._id, clubId: poll.clubId });
    if (!membership) return res.status(403).json({ error: "Not a member of this club" });

    if (Date.now() >= poll.closesAt.getTime()) {
      return res.status(403).json({ error: "Poll is closed" });
    }

    const parsed = respondSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    }

    const choice = parsed.data.choice.trim();

    if (!poll.options.includes(choice)) {
      return res.status(400).json({ error: "Choice must be one of poll.options" });
    }

    const response = await PollResponse.findOneAndUpdate(
      { pollId: poll._id, userId: req.user._id },
      { $set: { choice } },
      { new: true, upsert: true }
    );

    res.json({ ok: true, response });
  })
);

router.get(
  "/:pollId/recommendations",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { pollId } = req.params;

    if (!mongoose.isValidObjectId(pollId)) {
      return res.status(400).json({ error: "Invalid poll id" });
    }

    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ error: "Poll not found" });

    const membership = await Membership.findOne({ userId: req.user._id, clubId: poll.clubId });
    if (!membership) return res.status(403).json({ error: "Not a member of this club" });

    const step = Math.max(5, Math.min(120, Number(req.query.step ?? 30)));
    if (1440 % step !== 0) return res.status(400).json({ error: "step must divide 1440" });
    const limit = Math.max(1, Math.min(50, Number(req.query.limit ?? 10)));
    const yesChoice = String(req.query.choice ?? "yes");

    const result = await computeRecommendations({ poll, yesChoice, step, limit });

    res.json({
      pollId,
      step,
      yesCount: result.yesCount,
      recommendations: result.recommendations,
      note: result.note
    });
  })
);

export default router;
