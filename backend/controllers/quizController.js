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

// ✅ NEW: consider a cell "completed" if solved OR attempts exhausted
async function teamCompletedAllCells(teamId, section) {
  const docs = await TeamResponse.find(
    { team: teamId, section },
    { attempts: 1, isCorrect: 1 }
  ).lean();

  let completed = 0;
  for (const d of docs) {
    if (d.isCorrect || (d.attempts || 0) >= MAX_ATTEMPTS) completed++;
  }
  return completed >= 6;
}

async function ensureSectionTimer(teamId, section) {
  let existing = await TeamSectionTimer.findOne({ team: teamId, section });
  if (existing) return existing;

  const unlocked = await teamCompletedAllCells(teamId, section); // ✅ CHANGED
  if (!unlocked) return null;

  return await TeamSectionTimer.create({
    team: teamId,
    section,
    startedAt: new Date(),
    durationSec: 20 * 60, // 20 minutes
  });
}

function computeRemainingSeconds(timerDoc) {
  if (!timerDoc) return null;
  if (timerDoc.stoppedAt) return null; // null = stopped/completed
  const elapsed = Math.floor((Date.now() - new Date(timerDoc.startedAt).getTime()) / 1000);
  return Math.max(0, timerDoc.durationSec - elapsed);
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
      const attemptsLeft = Math.max(0, MAX_ATTEMPTS - attempts);
      const shouldShowImage = solved || attemptsLeft === 0;
      return {
        cell: i,
        answered: solved,
        attemptsLeft,
        imageUrl: shouldShowImage ? (qMap.get(`${sec}:${i}`) || "") : ""
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

  // already solved → keep returning image
  if (tr?.isCorrect) {
    return res.json({
      correct: true,
      alreadySolved: true,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - (tr.attempts || 0)),
      imageUrl: q.imageUrl || ""
    });
  }

  const currentAttempts = tr?.attempts || 0;

  // already exhausted → still return image
  if (currentAttempts >= MAX_ATTEMPTS) {
    return res.status(403).json({
      error: "No attempts left",
      attemptsLeft: 0,
      imageUrl: q.imageUrl || ""
    });
  }

  const attempts = currentAttempts + 1;
  const isCorrect = normalize(answer) === normalize(q.answer);

  tr = await TeamResponse.findOneAndUpdate(
    { team: teamId, section, cell },
    { answerGiven: answer, isCorrect, attempts, answeredAt: new Date() },
    { new: true, upsert: true }
  );

  if (isCorrect) {
    await Team.findByIdAndUpdate(teamId, { $inc: { points: POINTS_PER_CORRECT } });
  }

  // ✅ NEW: if grid is fully revealed (solved or exhausted), start timer
  const completed = await teamCompletedAllCells(teamId, section);
  if (completed) {
    await ensureSectionTimer(teamId, section);
  }

  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - attempts);
  const revealImage = isCorrect || attemptsLeft === 0;

  return res.json({
    correct: isCorrect,
    attemptsLeft,
    imageUrl: revealImage ? (q.imageUrl || "") : ""
  });
}

// ---------- SECTION CHALLENGE ----------
export async function getSectionQuestions(req, res) {
  const teamId = req.team._id;
  const section = Number(req.query.section);
  if (![1,2,3].includes(section)) {
    return res.status(400).json({ error: "Invalid section" });
  }

  // ✅ UNLOCK when all tiles are revealed
  const unlocked = await teamCompletedAllCells(teamId, section);
  if (!unlocked) {
    return res.json({
      locked: true,
      questions: [],
      compositeImageUrl: "",
      remainingSeconds: null,
      expired: false
    });
  }

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

  const timer = await ensureSectionTimer(teamId, section);
  if (!timer) return res.status(403).json({ error: "Section challenge locked" });

  const remainingSeconds = computeRemainingSeconds(timer);
  if (remainingSeconds === 0) {
    return res.status(403).json({ error: "Time over", remainingSeconds: 0, expired: true });
  }

  const q = await SectionQuestion.findOne({ section, idx });
  if (!q) return res.status(404).json({ error: "Question not found" });

  let tr = await TeamSectionResponse.findOne({ team: teamId, section, idx });

  const currentAttempts = tr?.attempts || 0;
  if (tr?.isCorrect) {
    return res.json({
      correct: true,
      alreadySolved: true,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - currentAttempts),
      remainingSeconds
    });
  }
  if (currentAttempts >= MAX_ATTEMPTS) {
    return res.status(403).json({
      error: "No attempts left",
      attemptsLeft: 0,
      remainingSeconds
    });
  }

  const attempts = currentAttempts + 1;
  const isCorrect = normalize(answer) === normalize(q.answer);

  tr = await TeamSectionResponse.findOneAndUpdate(
    { team: teamId, section, idx },
    { answerGiven: answer, isCorrect, attempts, answeredAt: new Date() },
    { new: true, upsert: true }
  );

  if (isCorrect) {
    await Team.findByIdAndUpdate(teamId, { $inc: { points: POINTS_PER_CORRECT } });

    // ✅ Stop timer if all 3 meta-questions solved
    const solvedCount = await TeamSectionResponse.countDocuments({ team: teamId, section, isCorrect: true });
    if (solvedCount >= 3) {
      await TeamSectionTimer.findOneAndUpdate(
        { team: teamId, section },
        { stoppedAt: new Date() }
      );
    }
  }

  return res.json({
    correct: isCorrect,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempts),
    remainingSeconds: computeRemainingSeconds(timer)
  });
}
