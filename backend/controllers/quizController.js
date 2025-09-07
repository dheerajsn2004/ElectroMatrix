// backend/controllers/quizController.js
import GridQuestion from "../models/GridQuestion.js";
import SectionGridAssignment from "../models/SectionGridAssignment.js";
import TeamResponse from "../models/TeamResponse.js";
import Team from "../models/Team.js";
import SectionQuestion from "../models/SectionQuestion.js";
import TeamSectionResponse from "../models/TeamSectionResponse.js";
import SectionMeta from "../models/SectionMeta.js";
import TeamSectionTimer from "../models/TeamSectionTimer.js";

const MAX_ATTEMPTS = 5;
const POINTS_PER_CORRECT = 5;
const normalize = (s = "") => String(s).trim().toLowerCase();

/* ------------------------------------------------------------------ */
/*                              HELPERS                                */
/* ------------------------------------------------------------------ */

// A cell is "completed" if solved OR attempts exhausted
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

  const unlocked = await teamCompletedAllCells(teamId, section);
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
  if (timerDoc.stoppedAt) return null; // null = stopped/completed (finished early because solved all 3)
  const elapsed = Math.floor((Date.now() - new Date(timerDoc.startedAt).getTime()) / 1000);
  return Math.max(0, timerDoc.durationSec - elapsed);
}

// Completed if all 3 meta-questions are solved
async function sectionCompleted(teamId, section) {
  const solved = await TeamSectionResponse.countDocuments({ team: teamId, section, isCorrect: true });
  return solved >= 3;
}

// Completed OR Timer Expired (or stopped)
async function sectionCompletedOrExpired(teamId, section) {
  if (await sectionCompleted(teamId, section)) return true;

  const timer = await TeamSectionTimer.findOne({ team: teamId, section });
  if (!timer) return false; // grid may not be fully revealed yet

  if (timer.stoppedAt) return true;

  const remaining = computeRemainingSeconds(timer);
  return remaining === 0;
}

// Unlock next section when previous is completed OR expired
async function computeUnlockedSection(teamId) {
  let unlocked = 1;                 // Section 1 always unlocked to start
  if (await sectionCompletedOrExpired(teamId, 1)) unlocked = 2;
  if (await sectionCompletedOrExpired(teamId, 2)) unlocked = 3;
  return unlocked;
}

/* ------------------------------------------------------------------ */
/*                      ASSIGNMENT / GRID UTILITIES                    */
/* ------------------------------------------------------------------ */

async function ensureAssignmentsForTeamSection(teamId, section) {
  const existing = await SectionGridAssignment.find({ team: teamId, section }).lean();
  if (existing.length === 6) return existing;

  // pick 6 questions from the pool (shuffle to randomize)
  const pool = await GridQuestion.find({}).lean();
  if (pool.length < 6) throw new Error("Not enough grid questions seeded.");

  // Fisher–Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const chosen = pool.slice(0, 6);

  // upsert assignments for cells 0..5
  const ops = chosen.map((q, idx) =>
    SectionGridAssignment.findOneAndUpdate(
      { team: teamId, section, cell: idx },
      { question: q._id },
      { new: true, upsert: true }
    )
  );
  return await Promise.all(ops);
}

/* ------------------------------------------------------------------ */
/*                           GRID SECTION API                          */
/* ------------------------------------------------------------------ */

export async function getSections(req, res) {
  const teamId = req.team._id;

  // ensure assignments exist per section (creates once per team/section)
  const [a1, a2, a3] = await Promise.all([
    ensureAssignmentsForTeamSection(teamId, 1),
    ensureAssignmentsForTeamSection(teamId, 2),
    ensureAssignmentsForTeamSection(teamId, 3),
  ]);

  // helper to map assignments -> {cell, imageUrl}
  const mapAssignments = async (assns) => {
    const ids = assns.map((a) => a.question);
    const qs = await GridQuestion.find({ _id: { $in: ids } }, { imageUrl: 1 }).lean();
    const qMap = new Map(qs.map((q) => [String(q._id), q]));
    return assns.map((a) => {
      const q = qMap.get(String(a.question));
      return { cell: a.cell, imageUrl: q?.imageUrl || "" };
    });
  };

  const [cells1, cells2, cells3] = await Promise.all([
    mapAssignments(a1),
    mapAssignments(a2),
    mapAssignments(a3),
  ]);

  // overlay attempts/solved to decide reveal
  const responses = await TeamResponse.find({ team: teamId }).lean();
  const rMap = new Map(responses.map((r) => [`${r.section}:${r.cell}`, r]));

  const bakeSection = (secId, baseCells) =>
    baseCells.map(({ cell, imageUrl }) => {
      const r = rMap.get(`${secId}:${cell}`);
      const solved = !!r?.isCorrect;
      const attempts = r?.attempts || 0;
      const attemptsLeft = Math.max(0, MAX_ATTEMPTS - attempts);
      const shouldShowImage = solved || attemptsLeft === 0;
      return {
        cell,
        answered: solved,
        attemptsLeft,
        imageUrl: shouldShowImage ? imageUrl : "",
      };
    });

  const sections = [
    { id: 1, cells: bakeSection(1, cells1.sort((a,b)=>a.cell-b.cell)) },
    { id: 2, cells: bakeSection(2, cells2.sort((a,b)=>a.cell-b.cell)) },
    { id: 3, cells: bakeSection(3, cells3.sort((a,b)=>a.cell-b.cell)) },
  ];

  const unlockedSection = await computeUnlockedSection(teamId);
  res.json({ sections, unlockedSection });
}

export async function getQuestion(req, res) {
  const teamId = req.team._id;
  const section = Number(req.query.section);
  const cell = Number(req.query.cell);
  if (![1,2,3].includes(section) || !(cell >= 0 && cell <= 5)) {
    return res.status(400).json({ error: "Invalid section/cell" });
  }

  // get assignment → question
  const assign = await SectionGridAssignment.findOne({ team: teamId, section, cell }).lean();
  if (!assign) return res.status(404).json({ error: "Assignment not found" });

  const qDoc = await GridQuestion.findById(assign.question).lean();
  if (!qDoc) return res.status(404).json({ error: "Question not found" });

  const r = await TeamResponse.findOne({ team: teamId, section, cell }).lean();
  const attempts = r?.attempts || 0;
  const solved = !!r?.isCorrect;

  res.json({
    section,
    cell,
    prompt: qDoc.prompt,
    type: qDoc.type,                 // "mcq" | "text"
    options: qDoc.options || [],     // [{key,label}] for mcq
    imageUrl: qDoc.imageUrl || "",   // show inside modal if present
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

  const assign = await SectionGridAssignment.findOne({ team: teamId, section, cell }).lean();
  if (!assign) return res.status(404).json({ error: "Assignment not found" });

  const qDoc = await GridQuestion.findById(assign.question).lean();
  if (!qDoc) return res.status(404).json({ error: "Question not found" });

  let tr = await TeamResponse.findOne({ team: teamId, section, cell });

  // already solved → keep returning image
  if (tr?.isCorrect) {
    return res.json({
      correct: true,
      alreadySolved: true,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - (tr.attempts || 0)),
      imageUrl: qDoc.imageUrl || ""
    });
  }

  const currentAttempts = tr?.attempts || 0;

  // already exhausted → still return image
  if (currentAttempts >= MAX_ATTEMPTS) {
    return res.status(403).json({
      error: "No attempts left",
      attemptsLeft: 0,
      imageUrl: qDoc.imageUrl || ""
    });
  }

  // evaluate correctness
  const user = normalize(answer);
  let isCorrect = false;

  if (qDoc.type === "mcq") {
    // accept key (a/b/c/d) OR the full label
    const match = (qDoc.options || []).find(
      (o) => normalize(o.key) === user || normalize(o.label) === user
    );
    isCorrect = !!match && normalize(qDoc.correctAnswer) === normalize(match.key);
  } else {
    isCorrect = user === normalize(qDoc.correctAnswer);
  }

  const attempts = currentAttempts + 1;
  tr = await TeamResponse.findOneAndUpdate(
    { team: teamId, section, cell },
    { answerGiven: answer, isCorrect, attempts, answeredAt: new Date() },
    { new: true, upsert: true }
  );

  if (isCorrect) {
    await Team.findByIdAndUpdate(teamId, { $inc: { points: POINTS_PER_CORRECT } });
  }

  // if grid fully revealed (solved or exhausted), start timer
  const completed = await teamCompletedAllCells(teamId, section);
  if (completed) {
    await ensureSectionTimer(teamId, section);
  }

  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - attempts);
  const revealImage = isCorrect || attemptsLeft === 0;

  return res.json({
    correct: isCorrect,
    attemptsLeft,
    imageUrl: revealImage ? (qDoc.imageUrl || "") : ""
  });
}

/* ------------------------------------------------------------------ */
/*                        SECTION CHALLENGE API                        */
/* ------------------------------------------------------------------ */

export async function getSectionQuestions(req, res) {
  const teamId = req.team._id;
  const section = Number(req.query.section);
  if (![1,2,3].includes(section)) {
    return res.status(400).json({ error: "Invalid section" });
  }

  // UNLOCK when all tiles are revealed (solved OR exhausted)
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
  const expired = remainingSeconds === 0; // true when time over

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
    // time over -> cannot submit; but this section will unlock next via getSections()
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

    // Stop timer if all 3 meta-questions solved
    const solvedCount = await TeamSectionResponse.countDocuments({ team: teamId, section, isCorrect: true });
    if (solvedCount >= 3) {
      await TeamSectionTimer.findOneAndUpdate(
        { team: teamId, section },
        { stoppedAt: new Date() }
      );
    }
  }

  const nowRemaining = computeRemainingSeconds(timer);
  const completedNow = await sectionCompleted(teamId, section);

  return res.json({
    correct: isCorrect,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempts),
    remainingSeconds: nowRemaining,
    completed: completedNow
  });
}
