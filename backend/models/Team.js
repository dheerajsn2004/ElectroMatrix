// backend/models/Team.js
import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash
    points:   { type: Number, default: 0 }      // ✅ total score
  },
  { timestamps: true }
);

export default mongoose.model("Team", teamSchema);
