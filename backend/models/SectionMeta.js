import mongoose from "mongoose";

const sectionMetaSchema = new mongoose.Schema({
  section: { type: Number, required: true, unique: true, min: 1, max: 3 },
  compositeImageUrl: { type: String, required: true } // shown when all 6 cells solved
}, { timestamps: true });

export default mongoose.model("SectionMeta", sectionMetaSchema);
