// backend/seedQuestions.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import Question from "./models/Question.js";

dotenv.config();

const data = [];
for (let section = 1; section <= 3; section++) {
  for (let cell = 0; cell < 6; cell++) {
    data.push({
      section,
      cell,
      prompt: `Section ${section} – Question for cell ${cell + 1}`,
      answer: `ans${section}${cell + 1}` // simple placeholder answer
    });
  }
}

(async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    await Question.deleteMany({});
    await Question.insertMany(data);
    console.log("✅ Seeded questions");
    await mongoose.disconnect();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
