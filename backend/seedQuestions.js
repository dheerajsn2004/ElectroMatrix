// backend/seedQuestions.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import SectionQuestion from "./models/SectionQuestion.js";
import SectionMeta from "./models/SectionMeta.js";

dotenv.config();

// 3 meta-questions per section
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

// point to real composite images served by Express
const metas = [
  { section: 1, compositeImageUrl: "/images/section1.png" },
  { section: 2, compositeImageUrl: "/images/section2.png" },
  { section: 3, compositeImageUrl: "/images/section3.png" },
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

    console.log("✅ Seeded section questions and composite images (/images/sectionN.png)");
    await mongoose.disconnect();
  } catch (e) {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  }
})();
