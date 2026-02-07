import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import { connectDb } from "./src/config/db.js";

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDb(process.env.MONGODB_URI);
  console.log("MongoDB connected");

  app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Server failed:", err);
  process.exit(1);
});
