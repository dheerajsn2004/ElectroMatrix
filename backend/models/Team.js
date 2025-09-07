// backend/models/Team.js
import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash
    points:   { type: Number, default: 0 },

    // Progression lock (1..3)
    unlockedSection: { type: Number, default: 1 },

    // ────────────────────────────────────────────────────────────────
    // Run timing fields:
    // We set runStartedAt the first time the team opens the quiz (getSections),
    // and we set runFinishedAt + runTotalTimeSec once ALL THREE sections
    // (their single meta-question each) are solved.
    // ────────────────────────────────────────────────────────────────
    runStartedAt:   { type: Date },           // when the team began the run
    runFinishedAt:  { type: Date },           // when they completed section 3 question
    runTotalTimeSec:{ type: Number },         // (runFinishedAt - runStartedAt) in seconds
  },
  { timestamps: true }
);

export default mongoose.model("Team", teamSchema);
