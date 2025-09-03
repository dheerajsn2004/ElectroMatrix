// backend/middleware/withTeam.js
import Team from "../models/Team.js";

export async function withTeam(req, res, next) {
  const username = req.header("x-team-username");
  if (!username) return res.status(401).json({ error: "Team header missing" });
  const team = await Team.findOne({ username });
  if (!team) return res.status(401).json({ error: "Invalid team" });
  req.team = team;
  next();
}
