import mongoose from "mongoose";

const ClubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("Club", ClubSchema);