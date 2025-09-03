import bcrypt from "bcryptjs";
import Team from "../models/Team.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400);
    throw new Error("Username and password are required");
  }

  const team = await Team.findOne({ username });
  if (!team) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const ok = await bcrypt.compare(password, team.password);
  if (!ok) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  res.json({
    message: "Login successful ✅",
    team: { username: team.username }
  });
});
