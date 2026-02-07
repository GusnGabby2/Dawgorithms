import mongoose from "mongoose";

const PollResponseSchema = new mongoose.Schema(
  {
    pollId: { type: mongoose.Schema.Types.ObjectId, ref: "Poll", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    choice: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

PollResponseSchema.index({ pollId: 1, userId: 1 }, { unique: true });

export default mongoose.model("PollResponse", PollResponseSchema);
