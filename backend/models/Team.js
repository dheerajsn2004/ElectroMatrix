// backend/models/Team.js
import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash
    points:   { type: Number, default: 0 },
    unlockedSection: { type: Number, default: 1 } // ✅ progression lock (1..3)
  },
  { timestamps: true }
);

export default mongoose.model("Team", teamSchema);
