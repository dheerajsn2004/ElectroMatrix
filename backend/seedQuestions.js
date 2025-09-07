// backend/seedQuestions.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import SectionQuestion from "./models/SectionQuestion.js";
import SectionMeta from "./models/SectionMeta.js";

dotenv.config();

/**
 * We now seed EXACTLY ONE meta-question per section (idx = 0).
 * Answers are your provided values.
 *
 * Section 1: equivalent resistance (rounded to 1 decimal) => 1.5
 * Section 2: Vx, iA, iB => "54,3,-5.4"  (comma-separated as a single string)
 * Section 3: power supplied by the voltage source (watts) => 0
 */
const sectionQs = [
  {
    section: 1,
    idx: 0,
    prompt:
      "Find equivalent resistance between A and B terminals (in ohms) (answer should be rounded to 1 decimal place)",
    answer: "1.5",
  },
  {
    section: 2,
    idx: 0,
    prompt:
      "For the single node pair circuit of Fig.1, find Vx, iA and iB. (Format: Vx,iA,iB)",
    answer: "54,3,-5.4",
  },
  {
    section: 3,
    idx: 0,
    prompt:
      "In the circuit shown, what is the power supplied by the voltage source? (in watts)",
    answer: "0",
  },
];

// Make sure composites point to your real images served by Express
const metas = [
  { section: 1, compositeImageUrl: "/images/section1.png" },
  { section: 2, compositeImageUrl: "/images/section2.png" },
  { section: 3, compositeImageUrl: "/images/section3.png" },
];

(async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    // Replace existing to keep it deterministic
    await Promise.all([
      SectionQuestion.deleteMany({}),
      SectionMeta.deleteMany({}),
    ]);

    await SectionQuestion.insertMany(sectionQs);
    await SectionMeta.insertMany(metas);

    console.log("✅ Seeded ONE section question per section and composite image URLs");
    await mongoose.disconnect();
  } catch (e) {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  }
})();
