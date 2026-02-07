import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === "production";

  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000 
  });
}

function clearAuthCookie(res) {
  const isProd = process.env.NODE_ENV === "production";

  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/"
  });
}

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

function publicUser(u) {
  return {
    id: u._id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    school: u.school,
    emailVerifiedAt: u.emailVerifiedAt,
    createdAt: u.createdAt
  };
}

const registerSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  school: z.string().min(1).max(120),
  password: z.string().min(8).max(200)
});

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    }

    const { firstName, lastName, email, school, password } = parsed.data;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      school,
      passwordHash,
      emailVerifiedAt: null
    });

    const token = signToken(user._id.toString());
    setAuthCookie(res, token);

    return res.status(201).json({ user: publicUser(user) });
  })
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const requireVerified = (process.env.REQUIRE_EMAIL_VERIFICATION || "false") === "true";
    if (requireVerified && !user.emailVerifiedAt) {
      return res.status(403).json({ error: "Email not verified" });
    }

    const token = signToken(user._id.toString());
    setAuthCookie(res, token);

    return res.json({ user: publicUser(user) });
  })
);

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    clearAuthCookie(res);
    return res.json({ ok: true });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    return res.json({ user: publicUser(req.user) });
  })
);

export default router;