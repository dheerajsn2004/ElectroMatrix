// backend/models/Question.js
import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  section: { type: Number, required: true, min: 1, max: 3 },
  cell: { type: Number, required: true, min: 0, max: 5 }, // 0..5 in a 2x3
  prompt: { type: String, required: true },
  answer: { type: String, required: true },               // correct answer
  imageUrl: { type: String, default: "" }                 // ✅ image shown when solved
}, { timestamps: true });

questionSchema.index({ section: 1, cell: 1 }, { unique: true });

export default mongoose.model("Question", questionSchema);
