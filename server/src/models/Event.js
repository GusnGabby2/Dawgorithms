import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    clubId: { type: mongoose.Schema.Types.ObjectId, ref: "Club", required: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    location: { type: String, default: "" },

    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },

    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

EventSchema.index({ clubId: 1, startAt: 1 });

export default mongoose.model("Event", EventSchema);
