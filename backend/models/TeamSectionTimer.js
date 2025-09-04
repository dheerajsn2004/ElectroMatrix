import mongoose from "mongoose";

const teamSectionTimerSchema = new mongoose.Schema({
  team:    { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
  section: { type: Number, required: true, min: 1, max: 3 },
  startedAt: { type: Date, required: true, default: Date.now },
  durationSec: { type: Number, required: true, default: 20 * 60 }, // 20 minutes
}, { timestamps: true });

teamSectionTimerSchema.index({ team: 1, section: 1 }, { unique: true });

export default mongoose.model("TeamSectionTimer", teamSectionTimerSchema);
