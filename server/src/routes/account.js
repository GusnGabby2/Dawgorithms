import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";

import asyncHandler from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";

const router = Router();

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8)
});

router.put(
  "/password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    }

    const { oldPassword, newPassword } = parsed.data;

    if (oldPassword === newPassword) {
      return res.status(400).json({ error: "New password must be different" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const hashFromDb = user.passwordHash ?? user.password;
    if (!hashFromDb) {
      return res.status(500).json({
        error: "Server misconfigured",
        details: "User model missing passwordHash/password field"
      });
    }

    const ok = await bcrypt.compare(oldPassword, hashFromDb);
    if (!ok) return res.status(400).json({ error: "Old password is incorrect" });

    const rounds = Number(process.env.BCRYPT_ROUNDS ?? 10);
    const newHash = await bcrypt.hash(newPassword, rounds);

    if (user.passwordHash !== undefined) user.passwordHash = newHash;
    else user.password = newHash;

    await user.save();

    res.json({ ok: true });
  })
);

export default router;
