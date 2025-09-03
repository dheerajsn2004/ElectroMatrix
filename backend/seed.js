import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Team from "./models/Team.js";
import { connectDB } from "./config/db.js";

dotenv.config();

async function addTeam(username, rawPassword) {
  const exists = await Team.findOne({ username });
  if (exists) {
    console.log(`⚠️  ${username} already exists`);
    return;
  }
  const hash = await bcrypt.hash(rawPassword, 10);
  await Team.create({ username, password: hash });
  console.log(`✅ Added team: ${username}`);
}

(async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    await addTeam("team1", "secret123");
    await addTeam("team2", "pass456");
    await mongoose.disconnect();
    console.log("🌱 Seeding done");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
