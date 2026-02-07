import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import myRoutes from "./routes/my.js";
import clubsRoutes from "./routes/clubs.js";
import authRoutes from "./routes/auth.js";
import schoolsRoutes from "./routes/schools.js";
import { notFound, errorHandler } from "./middleware/error.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(cors({ origin: true, credentials: true }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, server: "express", time: new Date().toISOString() });
});

app.use("/api/clubs", clubsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/schools", schoolsRoutes);
app.use("/api/my", myRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;