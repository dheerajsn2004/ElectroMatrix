// backend/models/SectionQuestion.js
import mongoose from "mongoose";

const sectionQuestionSchema = new mongoose.Schema({
  section: { type: Number, required: true, min: 1, max: 3 },
  idx:     { type: Number, required: true, min: 0, max: 2 }, // three per section: 0..2
  prompt:  { type: String, required: true },
  answer:  { type: String, required: true }
}, { timestamps: true });

sectionQuestionSchema.index({ section: 1, idx: 1 }, { unique: true });

export default mongoose.model("SectionQuestion", sectionQuestionSchema);
