import mongoose from "mongoose";

const ClubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    school: { type: String, default: "", trim: true }, // <--- add this
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

ClubSchema.index({ school: 1, createdAt: -1 });

export default mongoose.model("Club", ClubSchema);
