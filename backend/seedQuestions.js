// backend/seedQuestions.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import SectionQuestion from "./models/SectionQuestion.js";
import SectionMeta from "./models/SectionMeta.js";

dotenv.config();

const sectionQs = [];
for (let s = 1; s <= 3; s++) {
  for (let i = 0; i < 3; i++) {
    sectionQs.push({
      section: s,
      idx: i,
      prompt: `Section ${s} – Composite Q${i + 1} (based on the revealed image)`,
      answer: `meta${s}${i + 1}`,
    });
  }
}
const metas = [
  { section: 1, compositeImageUrl: "https://placehold.co/900x600?text=Section+1+Composite" },
  { section: 2, compositeImageUrl: "https://placehold.co/900x600?text=Section+2+Composite" },
  { section: 3, compositeImageUrl: "https://placehold.co/900x600?text=Section+3+Composite" },
];

(async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    await Promise.all([
      SectionQuestion.deleteMany({}),
      SectionMeta.deleteMany({}),
    ]);
    await SectionQuestion.insertMany(sectionQs);
    await SectionMeta.insertMany(metas);
    console.log("✅ Seeded section questions and composite images");
    await mongoose.disconnect();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
