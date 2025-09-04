// backend/models/TeamSectionResponse.js
import mongoose from "mongoose";

const teamSectionResponseSchema = new mongoose.Schema({
  team:    { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
  section: { type: Number, required: true, min: 1, max: 3 },
  idx:     { type: Number, required: true, min: 0, max: 2 },
  answerGiven: { type: String, default: "" },
  isCorrect:   { type: Boolean, default: false },
  attempts:    { type: Number, default: 0 },
  answeredAt:  { type: Date }
}, { timestamps: true });

teamSectionResponseSchema.index({ team: 1, section: 1, idx: 1 }, { unique: true });

export default mongoose.model("TeamSectionResponse", teamSectionResponseSchema);
