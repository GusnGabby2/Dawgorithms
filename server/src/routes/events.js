import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";

import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

import Membership from "../models/Membership.js";
import Event from "../models/Event.js";
import EventRSVP from "../models/EventRSVP.js";

const router = Router();

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date()
});

const rsvpSchema = z.object({
  status: z.enum(["yes", "no", "maybe"])
});

router.post(
  "/clubs/:clubId/events",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { clubId } = req.params;

    if (!mongoose.isValidObjectId(clubId)) {
      return res.status(400).json({ error: "Invalid club id" });
    }

    const membership = await Membership.findOne({ userId: req.user._id, clubId });
    if (!membership) return res.status(403).json({ error: "Not a member of this club" });
    if (membership.role !== "admin") return res.status(403).json({ error: "Admin only" });

    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    }

    if (parsed.data.endAt.getTime() <= parsed.data.startAt.getTime()) {
      return res.status(400).json({ error: "endAt must be after startAt" });
    }

    const event = await Event.create({
      clubId,
      title: parsed.data.title,
      description: parsed.data.description ?? "",
      location: parsed.data.location ?? "",
      startAt: parsed.data.startAt,
      endAt: parsed.data.endAt,
      createdByUserId: req.user._id
    });

    res.status(201).json({ event });
  })
);

router.get(
  "/clubs/:clubId/events",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { clubId } = req.params;

    if (!mongoose.isValidObjectId(clubId)) {
      return res.status(400).json({ error: "Invalid club id" });
    }

    const membership = await Membership.findOne({ userId: req.user._id, clubId });
    if (!membership) return res.status(403).json({ error: "Not a member of this club" });

    const events = await Event.find({ clubId }).sort({ startAt: 1 });

    const eventIds = events.map((e) => e._id);
    const myRsvps = await EventRSVP.find({
      eventId: { $in: eventIds },
      userId: req.user._id
    });

    const myMap = new Map(myRsvps.map((r) => [String(r.eventId), r.status]));

    res.json({
      events: events.map((e) => ({
        ...e.toObject(),
        myStatus: myMap.get(String(e._id)) ?? null
      }))
    });
  })
);

router.get(
  "/events/:eventId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({ error: "Invalid event id" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const membership = await Membership.findOne({ userId: req.user._id, clubId: event.clubId });
    if (!membership) return res.status(403).json({ error: "Not a member of this club" });

    const my = await EventRSVP.findOne({ eventId: event._id, userId: req.user._id });

    res.json({ event, myStatus: my?.status ?? null });
  })
);

router.get(
  "/events/:eventId/google",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({ error: "Invalid event id" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const membership = await Membership.findOne({ userId: req.user._id, clubId: event.clubId });
    if (!membership) return res.status(403).json({ error: "Not a member of this club" });

    const rsvp = await EventRSVP.findOne({ userId: req.user._id, eventId: event._id });
    if (!rsvp || rsvp.status !== "yes") {
      return res.status(403).json({ error: "Google Calendar link requires RSVP yes" });
    }

    const fmt = (d) =>
      new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: event.title,
      dates: `${fmt(event.startAt)}/${fmt(event.endAt)}`,
      details: event.description ?? "",
      location: event.location ?? ""
    });

    const url = `https://calendar.google.com/calendar/render?${params.toString()}`;
    res.json({ url });
  })
);

router.put(
  "/events/:eventId/rsvp",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({ error: "Invalid event id" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const membership = await Membership.findOne({ userId: req.user._id, clubId: event.clubId });
    if (!membership) return res.status(403).json({ error: "Not a member of this club" });

    const parsed = rsvpSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    }

    const rsvp = await EventRSVP.findOneAndUpdate(
      { eventId: event._id, userId: req.user._id },
      { $set: { status: parsed.data.status } },
      { new: true, upsert: true }
    );

    res.json({ ok: true, rsvp });
  })
);

export default router;
