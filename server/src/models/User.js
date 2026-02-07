import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    school: { type: String, required: true, trim: true },

    passwordHash: { type: String, required: true },

    emailVerifiedAt: { type: Date, default: null }
  },
  { timestamps: true }
);


export default mongoose.model("User", UserSchema);