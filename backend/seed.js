// backend/seedTeams.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Team from "./models/Team.js";
import { connectDB } from "./config/db.js";

dotenv.config();

async function addTeam(username, rawPassword) {
  const exists = await Team.findOne({ username });
  if (exists) {
    console.log(`⚠️  ${username} already exists — skipping`);
    return;
  }
  const hash = await bcrypt.hash(rawPassword, 10);
  await Team.create({ username, password: hash });
  console.log(`✅ Added team: ${username} (password: ${rawPassword})`);
}

(async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    // Hard-coded teams
    await addTeam("team1", "secret123");
    await addTeam("team2", "pass456");
    await addTeam("team3", "team3pass");
    await addTeam("team4", "team4pass");
    await addTeam("team5", "team5pass");
    await addTeam("team6", "team6pass");
    await addTeam("team7", "team7pass");
    await addTeam("team8", "team8pass");
    await addTeam("team9", "team9pass");
    await addTeam("team10", "team10pass");
    await addTeam("team11", "team11pass");
    await addTeam("team12", "team12pass");
    await addTeam("team13", "team13pass");
    await addTeam("team14", "team14pass");
    await addTeam("team15", "team15pass");
    await addTeam("team16", "team16pass");
    await addTeam("team17", "team17pass");
    await addTeam("team18", "team18pass");
    await addTeam("team19", "team19pass");
    await addTeam("team20", "team20pass");

    const total = await Team.countDocuments();
    console.log(`📊 Total teams in DB: ${total}`);

    await mongoose.disconnect();
    console.log("🌱 Seeding done");
  } catch (err) {
    console.error("❌ Team seeding failed:", err);
    process.exit(1);
  }
})();
