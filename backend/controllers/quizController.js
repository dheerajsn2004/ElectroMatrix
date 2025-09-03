// backend/controllers/quizController.js
import Question from "../models/Question.js";
import TeamResponse from "../models/TeamResponse.js";
import Team from "../models/Team.js";

const MAX_ATTEMPTS = 5;

function normalize(str = "") {
  return String(str).trim().toLowerCase();
}

// GET /api/quiz/sections
export async function getSections(req, res) {
  const teamId = req.team._id;

  const responses = await TeamResponse.find({ team: teamId }).lean();
  const status = new Map(responses.map(r => [`${r.section}:${r.cell}`, r]));

  const sections = [1,2,3].map(sec => {
    const cells = Array.from({ length: 6 }, (_, i) => {
      const r = status.get(`${sec}:${i}`);
      return {
        cell: i,
        answered: !!r?.isCorrect,
        attempts: r?.attempts || 0,
        attemptsLeft: Math.max(0, MAX_ATTEMPTS - (r?.attempts || 0))
      };
    });
    return { id: sec, cells };
  });

  // also include team points so UI can show it
  const team = await Team.findById(teamId).lean();
  res.json({ sections, points: team?.points || 0 });
}

// GET /api/quiz/question?section=1&cell=0
export async function getQuestion(req, res) {
  const section = Number(req.query.section);
  const cell = Number(req.query.cell);
  if (![1,2,3].includes(section) || !(cell >= 0 && cell <= 5)) {
    return res.status(400).json({ error: "Invalid section/cell" });
  }

  const q = await Question.findOne({ section, cell }).lean();
  if (!q) return res.status(404).json({ error: "Question not found" });

  const r = await TeamResponse.findOne({ team: req.team._id, section, cell }).lean();
  const attempts = r?.attempts || 0;
  const solved = !!r?.isCorrect;

  res.json({
    section,
    cell,
    prompt: q.prompt,                // never expose the correct answer
    attempts,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempts),
    solved
  });
}

// POST /api/quiz/answer  { section, cell, answer }
export async function submitAnswer(req, res) {
  const teamId = req.team._id;
  const { section, cell, answer } = req.body;

  const sec = Number(section);
  const cel = Number(cell);
  if (![1,2,3].includes(sec) || !(cel >= 0 && cel <= 5) || !answer) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const q = await Question.findOne({ section: sec, cell: cel });
  if (!q) return res.status(404).json({ error: "Question not found" });

  let tr = await TeamResponse.findOne({ team: teamId, section: sec, cell: cel });

  // Already solved → no further attempts, no extra points
  if (tr?.isCorrect) {
    const team = await Team.findById(teamId).lean();
    return res.json({
      correct: true,
      alreadySolved: true,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - (tr.attempts || 0)),
      points: team?.points || 0
    });
  }

  // Attempts exhausted?
  const currentAttempts = tr?.attempts || 0;
  if (currentAttempts >= MAX_ATTEMPTS) {
    const team = await Team.findById(teamId).lean();
    return res.status(403).json({
      error: "No attempts left",
      attemptsLeft: 0,
      points: team?.points || 0
    });
  }

  // Count this attempt
  const attempts = currentAttempts + 1;
  const isCorrect = normalize(answer) === normalize(q.answer);

  // Upsert response
  tr = await TeamResponse.findOneAndUpdate(
    { team: teamId, section: sec, cell: cel },
    { answerGiven: answer, isCorrect, attempts, answeredAt: new Date() },
    { new: true, upsert: true }
  );

  // Award points once (5 points) when becomes correct
  let updatedPoints = null;
  if (isCorrect) {
    const t = await Team.findByIdAndUpdate(
      teamId,
      { $inc: { points: 5 } },
      { new: true, projection: { points: 1 } }
    ).lean();
    updatedPoints = t.points;
  } else {
    const t = await Team.findById(teamId, { points: 1 }).lean();
    updatedPoints = t?.points || 0;
  }

  return res.json({
    correct: isCorrect,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempts),
    points: updatedPoints,
    section: sec,
    cell: cel
  });
}
