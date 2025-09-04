import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import Question from "./models/Question.js";
import SectionQuestion from "./models/SectionQuestion.js";
import SectionMeta from "./models/SectionMeta.js";

dotenv.config();

// Placeholder tile images
const img = (s, c) => `https://placehold.co/300x300?text=S${s}-C${c+1}`;
// Placeholder composite images — replace with your real joined image URLs later
const composite = (s) => `https://placehold.co/900x600?text=Section+${s}+Composite`;

const cellData = [];
for (let s = 1; s <= 3; s++) {
  for (let c = 0; c < 6; c++) {
    cellData.push({
      section: s,
      cell: c,
      prompt: `Section ${s} – Question for cell ${c + 1}`,
      answer: `ans${s}${c + 1}`,
      imageUrl: img(s, c)
    });
  }
}

const sectionQs = [];
for (let s = 1; s <= 3; s++) {
  for (let i = 0; i < 3; i++) {
    sectionQs.push({
      section: s,
      idx: i,
      prompt: `Section ${s} – Composite Q${i + 1} (based on the revealed image)`,
      answer: `meta${s}${i + 1}`
    });
  }
}

const metas = [
  { section: 1, compositeImageUrl: composite(1) },
  { section: 2, compositeImageUrl: composite(2) },
  { section: 3, compositeImageUrl: composite(3) }
];

(async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    await Promise.all([
      Question.deleteMany({}),
      SectionQuestion.deleteMany({}),
      SectionMeta.deleteMany({})
    ]);

    await Question.insertMany(cellData);
    await SectionQuestion.insertMany(sectionQs);
    await SectionMeta.insertMany(metas);

    console.log("✅ Seeded cell questions, section questions, and composite images");
    await mongoose.disconnect();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
