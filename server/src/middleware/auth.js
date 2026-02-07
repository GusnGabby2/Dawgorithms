import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.auth_token;

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.userId).select(
      "_id firstName lastName email school emailVerifiedAt createdAt"
    );

    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Not authenticated" });
  }
}