import mongoose from "mongoose";

const AvailabilityBlockSchema = new mongoose.Schema(
  {
    day: { type: Number, min: 0, max: 6, required: true },
    startMin: { type: Number, min: 0, max: 1440, required: true },
    endMin: { type: Number, min: 0, max: 1440, required: true }
  },
  { _id: false }
);

const MembershipSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    clubId: { type: mongoose.Schema.Types.ObjectId, ref: "Club", required: true },

    role: { type: String, enum: ["admin", "member"], default: "member" },

    availability: { type: [AvailabilityBlockSchema], default: [] }
  },
  { timestamps: true }
);

MembershipSchema.index({ userId: 1, clubId: 1 }, { unique: true });

export default mongoose.model("Membership", MembershipSchema);
