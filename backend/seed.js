// backend/seedTeams.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Team from "./models/Team.js";
import { connectDB } from "./config/db.js";

dotenv.config();

/**
 * Unique lowercase passwords for each team (non-predictable but typeable)
 */
const TEAMS = [
  { username: "team1",  password: "alphafox12" },
  { username: "team2",  password: "zephyr88" },
  { username: "team3",  password: "orbitkey91" },
  { username: "team4",  password: "lumen42" },
  { username: "team5",  password: "nimbus73" },
  { username: "team6",  password: "ember19" },
  { username: "team7",  password: "quark57" },
  { username: "team8",  password: "terra84" },
  { username: "team9",  password: "vortex26" },
  { username: "team10", password: "asterix67" },
  { username: "team11", password: "cobalt93" },
  { username: "team12", password: "pyxis41" },
  { username: "team13", password: "zenith34" },
  { username: "team14", password: "argon58" },
  { username: "team15", password: "hydra62" },
  { username: "team16", password: "lyra77" },
  { username: "team17", password: "nova85" },
  { username: "team18", password: "sirius29" },
  { username: "team19", password: "orion53" },
  { username: "team20", password: "pulsar76" },
];

// Pass --reset to update existing teams' passwords
const RESET_EXISTING = process.argv.includes("--reset");

function mask(pw) {
  return pw.slice(0, 2) + "****" + pw.slice(-2);
}

async function addOrUpdateTeam(username, rawPassword) {
  const existing = await Team.findOne({ username }).lean();
  const hash = await bcrypt.hash(rawPassword, 10);

  if (!existing) {
    await Team.create({ username, password: hash });
    console.log(`🆕 created ${username} (password: ${rawPassword})`);
    return;
  }

  if (RESET_EXISTING) {
    await Team.updateOne({ username }, { $set: { password: hash } });
    console.log(`🔁 updated ${username} (new password: ${rawPassword})`);
  } else {
    console.log(`⏭️  ${username} exists — skipping (run with --reset to update password)`);
  }
}

(async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    for (const t of TEAMS) {
      // eslint-disable-next-line no-await-in-loop
      await addOrUpdateTeam(t.username, t.password);
    }

    const total = await Team.countDocuments();
    console.log(`📊 Total teams in DB: ${total}`);

    await mongoose.disconnect();
    console.log("✅ Done");
  } catch (err) {
    console.error("❌ Team seeding failed:", err);
    process.exit(1);
  }
})();
