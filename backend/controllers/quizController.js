// backend/controllers/quizController.js
import Question from "../models/Question.js";
import TeamResponse from "../models/TeamResponse.js";
import Team from "../models/Team.js";
import SectionQuestion from "../models/SectionQuestion.js";
import TeamSectionResponse from "../models/TeamSectionResponse.js";
import SectionMeta from "../models/SectionMeta.js";
import TeamSectionTimer from "../models/TeamSectionTimer.js";

const MAX_ATTEMPTS = 5;
const POINTS_PER_CORRECT = 5;
const normalize = (s = "") => String(s).trim().toLowerCase();

// ---------- helpers ----------
async function teamSolvedAllCells(teamId, section) {
  const solvedCount = await TeamResponse.countDocuments({ team: teamId, section, isCorrect: true });
  return solvedCount >= 6;
}

async function ensureSectionTimer(teamId, section) {
  // create timer only once, at the moment the section gets fully decoded
  const existing = await TeamSectionTimer.findOne({ team: teamId, section });
  if (existing) return existing;

  const unlocked = await teamSolvedAllCells(teamId, section);
  if (!unlocked) return null;

  const timer = await TeamSectionTimer.create({
    team: teamId,
    section,
    startedAt: new Date(),
    durationSec: 20 * 60,
  });
  return timer;
}

function computeRemainingSeconds(timerDoc) {
  if (!timerDoc) return null;
  const elapsed = Math.floor((Date.now() - new Date(timerDoc.startedAt).getTime()) / 1000);
  const remaining = Math.max(0, timerDoc.durationSec - elapsed);
  return remaining;
}

// ---------- GRID SECTION ----------
export async function getSections(req, res) {
  const teamId = req.team._id;

  const questions = await Question.find({}, { section: 1, cell: 1, imageUrl: 1 }).lean();
  const qMap = new Map(questions.map(q => [`${q.section}:${q.cell}`, q.imageUrl || ""]));

  const responses = await TeamResponse.find({ team: teamId }).lean();
  const rMap = new Map(responses.map(r => [`${r.section}:${r.cell}`, r]));

  const sections = [1,2,3].map(sec => {
    const cells = Array.from({ length: 6 }, (_, i) => {
      const r = rMap.get(`${sec}:${i}`);
      const solved = !!r?.isCorrect;
      const attempts = r?.attempts || 0;
      return {
        cell: i,
        answered: solved,
        attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempts),
        imageUrl: solved ? (qMap.get(`${sec}:${i}`) || "") : ""
      };
    });
    return { id: sec, cells };
  });

  res.json({ sections });
}

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
    prompt: q.prompt,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempts),
    solved
  });
}

export async function submitAnswer(req, res) {
  const teamId = req.team._id;
  const section = Number(req.body.section);
  const cell = Number(req.body.cell);
  const answer = req.body.answer;

  if (![1,2,3].includes(section) || !(cell >= 0 && cell <= 5) || !answer) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const q = await Question.findOne({ section, cell });
  if (!q) return res.status(404).json({ error: "Question not found" });

  let tr = await TeamResponse.findOne({ team: teamId, section, cell });

  if (tr?.isCorrect) {
    return res.json({
      correct: true,
      alreadySolved: true,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - (tr.attempts || 0)),
      imageUrl: q.imageUrl || ""
    });
  }

  const currentAttempts = tr?.attempts || 0;
  if (currentAttempts >= MAX_ATTEMPTS) {
    return res.status(403).json({ error: "No attempts left", attemptsLeft: 0 });
  }

  const attempts = currentAttempts + 1;
  const isCorrect = normalize(answer) === normalize(q.answer);

  tr = await TeamResponse.findOneAndUpdate(
    { team: teamId, section, cell },
    { answerGiven: answer, isCorrect, attempts, answeredAt: new Date() },
    { new: true, upsert: true }
  );

  if (isCorrect) {
    await Team.findByIdAndUpdate(teamId, { $inc: { points: POINTS_PER_CORRECT } }, { new: false });

    // if this made all 6 cells correct, start a timer (only once)
    const unlocked = await teamSolvedAllCells(teamId, section);
    if (unlocked) {
      await ensureSectionTimer(teamId, section);
    }
  }

  return res.json({
    correct: isCorrect,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempts),
    imageUrl: isCorrect ? (q.imageUrl || "") : ""
  });
}

// ---------- SECTION CHALLENGE (3 Qs after all 6 cells solved) ----------
export async function getSectionQuestions(req, res) {
  const teamId = req.team._id;
  const section = Number(req.query.section);
  if (![1,2,3].includes(section)) return res.status(400).json({ error: "Invalid section" });

  const unlocked = await teamSolvedAllCells(teamId, section);
  if (!unlocked) {
    return res.json({ locked: true, questions: [], compositeImageUrl: "", remainingSeconds: null, expired: false });
  }

  // Create timer if missing, then compute remaining time
  const timer = await ensureSectionTimer(teamId, section);
  const remainingSeconds = computeRemainingSeconds(timer);
  const expired = remainingSeconds === 0;

  const [qs, rs, meta] = await Promise.all([
    SectionQuestion.find({ section }).sort({ idx: 1 }).lean(),
    TeamSectionResponse.find({ team: teamId, section }).lean(),
    SectionMeta.findOne({ section }).lean()
  ]);

  const rMap = new Map(rs.map(r => [r.idx, r]));
  const questions = qs.map(q => {
    const r = rMap.get(q.idx);
    const attempts = r?.attempts || 0;
    return {
      idx: q.idx,
      prompt: q.prompt,
      solved: !!r?.isCorrect,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempts)
    };
  });

  res.json({
    locked: false,
    questions,
    compositeImageUrl: meta?.compositeImageUrl || "",
    remainingSeconds,
    expired
  });
}

export async function submitSectionAnswer(req, res) {
  const teamId = req.team._id;
  const section = Number(req.body.section);
  const idx = Number(req.body.idx);
  const answer = req.body.answer;

  if (![1,2,3].includes(section) || !(idx >= 0 && idx <= 2) || !answer) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  // timer must exist and not be expired
  const timer = await ensureSectionTimer(teamId, section);
  if (!timer) return res.status(403).json({ error: "Section challenge locked" });
  const remainingSeconds = computeRemainingSeconds(timer);
  if (remainingSeconds === 0) {
    return res.status(403).json({ error: "Time over", remainingSeconds: 0, expired: true });
  }

  const q = await SectionQuestion.findOne({ section, idx });
  if (!q) return res.status(404).json({ error: "Question not found" });

  let tr = await TeamSectionResponse.findOne({ team: teamId, section, idx });

  if (tr?.isCorrect) {
    return res.json({
      correct: true,
      alreadySolved: true,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - (tr.attempts || 0)),
      remainingSeconds
    });
  }

  const currentAttempts = tr?.attempts || 0;
  if (currentAttempts >= MAX_ATTEMPTS) {
    return res.status(403).json({ error: "No attempts left", attemptsLeft: 0, remainingSeconds });
  }

  const attempts = currentAttempts + 1;
  const isCorrect = normalize(answer) === normalize(q.answer);

  tr = await TeamSectionResponse.findOneAndUpdate(
    { team: teamId, section, idx },
    { answerGiven: answer, isCorrect, attempts, answeredAt: new Date() },
    { new: true, upsert: true }
  );

  // award points only if still within time
  if (isCorrect) {
    await Team.findByIdAndUpdate(teamId, { $inc: { points: POINTS_PER_CORRECT } }, { new: false });
  }

  return res.json({
    correct: isCorrect,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempts),
    remainingSeconds
  });
}
