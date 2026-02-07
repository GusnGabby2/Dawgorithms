import mongoose from "mongoose";

const EventRSVPSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    status: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

EventRSVPSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export default mongoose.model("EventRSVP", EventRSVPSchema);
