// backend/models/Team.js
import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash
    points:   { type: Number, default: 0 },

    // Progression lock (1..3)
    unlockedSection: { type: Number, default: 1 },

    // Run timing fields:
    // We keep runStartedAt to scope data to the *current run* and
    // runFinishedAt to mark completion, but we do NOT store total time.
    runStartedAt:   { type: Date },  // when the team began the run
    runFinishedAt:  { type: Date },  // when they completed section 3 question
  },
  { timestamps: true }
);

export default mongoose.model("Team", teamSchema);
