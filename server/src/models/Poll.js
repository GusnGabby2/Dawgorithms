import mongoose from "mongoose";

const PollSchema = new mongoose.Schema(
  {
    clubId: { type: mongoose.Schema.Types.ObjectId, ref: "Club", required: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    options: { type: [String], default: ["yes", "no", "maybe"] },

    closesAt: { type: Date, required: true },

    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

PollSchema.index({ clubId: 1, closesAt: -1 });

export default mongoose.model("Poll", PollSchema);