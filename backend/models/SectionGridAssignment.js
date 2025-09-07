// backend/models/SectionGridAssignment.js
import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
    section: { type: Number, required: true }, // 1..3
    cell: { type: Number, required: true },    // 0..5
    question: { type: mongoose.Schema.Types.ObjectId, ref: "GridQuestion", required: true },
  },
  { timestamps: true }
);

assignmentSchema.index({ team: 1, section: 1, cell: 1 }, { unique: true });
export default mongoose.model("SectionGridAssignment", assignmentSchema);
