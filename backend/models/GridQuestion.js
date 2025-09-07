// backend/models/GridQuestion.js
import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    key: { type: String, enum: ["a", "b", "c", "d"], required: true },
    label: { type: String, required: true },
  },
  { _id: false }
);

const gridQuestionSchema = new mongoose.Schema(
  {
    // plain text for the prompt; may reference image via imageUrl
    prompt: { type: String, required: true },
    type: { type: String, enum: ["mcq", "text"], required: true },
    options: [optionSchema], // required for mcq
    correctAnswer: { type: String, required: true }, // "a"|"b"|"c"|"d" for mcq, plain text for text
    imageUrl: { type: String, default: "" }, // optional
  },
  { timestamps: true }
);

export default mongoose.model("GridQuestion", gridQuestionSchema);
