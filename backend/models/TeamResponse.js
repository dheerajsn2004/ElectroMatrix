// backend/models/TeamResponse.js
import mongoose from "mongoose";

const teamResponseSchema = new mongoose.Schema({
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
  section: { type: Number, required: true, min: 1, max: 3 },
  cell: { type: Number, required: true, min: 0, max: 5 },
  answerGiven: { type: String, default: "" },
  isCorrect: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },         // ✅ attempt count
  answeredAt: { type: Date }
}, { timestamps: true });

teamResponseSchema.index({ team: 1, section: 1, cell: 1 }, { unique: true });

export default mongoose.model("TeamResponse", teamResponseSchema);
