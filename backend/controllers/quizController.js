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

// Scoring rules
const GRID_POINTS_CORRECT = 2;          // grid tile question correct
const GRID_PENALTY_WRONG_MCQ = 1;       // penalty per wrong attempt (MCQ only)
const SECTION_POINTS_CORRECT = 5;       // section meta-question (single)

// Old helper, keep for MCQ key/label matching
const normalize = (s = "") => String(s).trim().toLowerCase();

/* -------------------- Robust text answer helpers (NEW) -------------------- */
// Normalizes user/free-text answers: case-insensitive, trims, unifies separators.
function normalizeAnswer(answer) {
  if (answer === null || answer === undefined) return "";
  return String(answer)
    .toLowerCase()
    .replace(/\s+/g, " ")   // collapse multiple spaces
    .replace(/[,;|]+/g, ",")// unify popular separators to comma
    .trim();
}

// Compares user vs correct answer.
// If correct answer contains commas, treat both sides as unordered sets of parts.
function compareAnswers(userAns, correctAns) {
  const u = normalizeAnswer(userAns);
  const c = normalizeAnswer(correctAns);

  if (c.includes(",")) {
    const userParts = u.split(",").map(s => s.trim()).filter(Boolean);
    const correctParts = c.split(",").map(s => s.trim()).filter(Boolean);
    if (userParts.length !== correctParts.length) return false;

    // unordered exact match on normalized parts
    const userSet = new Set(userParts);
    for (const p of correctParts) {
      if (!userSet.has(p)) return false;
    }
    return true;
  }

  // single token/phrase exact match after normalization
  return u === c;
}

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
    durationSec: 20 * 60,
  });
}

function computeRemainingSeconds(timerDoc) {
  if (!timerDoc) return null;
  if (timerDoc.stoppedAt) return null;
  const elapsed = Math.floor((Date.now() - new Date(timerDoc.startedAt).getTime()) / 1000);
  return Math.max(0, timerDoc.durationSec - elapsed);
}

// A section is completed when its single meta-question is solved
async function sectionCompleted(teamId, section) {
  const solved = await TeamSectionResponse.countDocuments({ team: teamId, section, isCorrect: true });
  return solved >= 1;
}

// Is a section completed OR expired (timer over)?
async function sectionCompletedOrExpired(teamId, section) {
  if (await sectionCompleted(teamId, section)) return true;

  const timer = await TeamSectionTimer.findOne({ team: teamId, section });
  if (!timer) return false;

  if (timer.stoppedAt) return true;

  const remaining = computeRemainingSeconds(timer);
  return remaining === 0;
}

// Unlock next section when previous is completed OR expired
async function computeUnlockedSection(teamId) {
  let unlocked = 1;
  if (await sectionCompletedOrExpired(teamId, 1)) unlocked = 2;
  if (await sectionCompletedOrExpired(teamId, 2)) unlocked = 3;
  return unlocked;
}

/* -------------------- Run timing helpers (NEW) -------------------- */

// Ensure runStartedAt is set the first time the team hits the quiz.
async function ensureRunStarted(teamId) {
  const t = await Team.findById(teamId).select("runStartedAt").lean();
  if (!t?.runStartedAt) {
    await Team.findByIdAndUpdate(teamId, { runStartedAt: new Date() });
  }
}

// Have they SOLVED all three section questions?
async function allSectionsCompleted(teamId) {
  const [s1, s2, s3] = await Promise.all([
    sectionCompleted(teamId, 1),
    sectionCompleted(teamId, 2),
    sectionCompleted(teamId, 3),
  ]);
  return s1 && s2 && s3;
}

// If all sections are completed and finish not yet recorded, write final time.
async function finalizeRunIfDone(teamId) {
  const team = await Team.findById(teamId).select("runStartedAt runFinishedAt").lean();
  if (!team) return;

  if (team.runFinishedAt) return;              // already finalized
  if (!team.runStartedAt) return;              // no start yet

  const done = await allSectionsCompleted(teamId);
  if (!done) return;

  const now = new Date();
  const total = Math.max(0, Math.floor((now - new Date(team.runStartedAt)) / 1000));
  await Team.findByIdAndUpdate(teamId, {
    runFinishedAt: now,
    runTotalTimeSec: total,
  });
}

/* -------------------- IMAGE URL HELPERS -------------------- */
// Full composite per section — prefer DB value; fallback to defaults
async function compositeImageUrl(section) {
  const meta = await SectionMeta.findOne({ section }).lean();
  if (meta?.compositeImageUrl) return meta.compositeImageUrl;
  if (section === 1) return "/images/section1.png";
  if (section === 2) return "/images/section2.png";
  if (section === 3) return "/images/section3.png";
  return "/images/section1.png";
}

// Tile image for a given section/cell (cell is 0..5 → file suffix 1..6)
function tileImageUrl(section, cell) {
  const idx = Number(cell) + 1; // 1..6
  return `/images/section${section}.${idx}.png`;
}

/* ------------------------------------------------------------------ */
/*                  ASSIGNMENT / POOL COMPOSITION LOGIC               */
/* ------------------------------------------------------------------ */

function pickN(arr, n, excludeIds = new Set()) {
  const filtered = arr.filter((x) => !excludeIds.has(String(x._id)));
  for (let i = filtered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // fixed swap
    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
  }
  return filtered.slice(0, Math.max(0, n));
}

// Prompt pools (kept outside to reuse in both paths)
const firstSetPrompts = [
  "What is the key difference between an energy signal and a power signal based on the definitions?",
  "Determine whether it is periodic and find the fundamental time period. x(t) = cos²(2πt)",
  "Determine whether it is periodic and find the fundamental time period. x[n] = cos(2n)",
  "Categorize x(t) as energy or power signal and find the energy/time-averaged power for x(t) = { t, 0≤t≤1 ; 2−t, 1≤t≤2 }.",
  "Given the triangular pulse x(t) (see image), which expression represents the shown signal?",
  "Given the triangular pulse x(t) (see image), which expression represents the shown signal?",
  "How can the ramp function r(t) be derived from the unit step function u(t)?",
  "System y[n] = (1/3)(x[n+1]+x[n]+x[n−1]). Which properties hold?",
  "System y[n] = x[n] + 2. Which properties hold?",
  "System y[n] = n x[n]. Which properties hold?",
  "Why is a system with y(t) = x²(t) considered non-invertible?",
  "What is the fundamental period N of x[n] = sin((2π/7) n) ?",
  "For x(t)=3t² + sin(t), the value of its odd component at t=π is",
  "Total energy of the discrete-time signal x[n] = δ[n−2] is",
];

const secondSetPrompts = [
  "The declaration  \nreg [7:0] my_memory [0:127];  \ndescribes a memory array. What is the total storage capacity of this memory in bits?",
  "A reg can be assigned a value inside an initial or always block. Which Verilog data type must be used for a signal on the left-hand side of a continuous assign statement?",
  "What is the primary functional difference between the fork-join block and the begin-end block in Verilog?",
  "Which Verilog procedural block is intended for statements that should execute only once at the beginning of a simulation?",
  "The 7-bit Gray code 1011010 is equivalent to the binary value",
];

const lastSetPrompts = [
  "In an inverting amplifier with Rf =100kΩ, Rin =10kΩ, the voltage gain is:",
  "The output of an op-amp integrator for a square wave input is:",
  "A Schmitt Trigger is primarily used for:",
  "A voltage follower has a voltage gain of approximately:",
  "An op-amp integrator has R=100kΩ and C=0.1μF. If the input is a 1 V DC step, the output after 1 ms will be:",
];

async function ensureAssignmentsForTeamSection(teamId, section) {
  const [existing, otherSectionAssigns] = await Promise.all([
    SectionGridAssignment.find({ team: teamId, section }).lean(),
    SectionGridAssignment.find({ team: teamId, section: { $ne: section } }).lean(),
  ]);

  // prevent duplicates across sections
  const usedInOtherSections = new Set(
    otherSectionAssigns.map((a) => String(a.question))
  );

  // If 6 exist, verify no duplicates & no dangling questions
  if (existing.length === 6) {
    const questionIds = existing.map((a) => a.question);
    const found = await GridQuestion.find({ _id: { $in: questionIds } }, { _id: 1 }).lean();
    const foundSet = new Set(found.map((d) => String(d._id)));

    const offenders = existing.filter(
      (a) => usedInOtherSections.has(String(a.question)) || !foundSet.has(String(a.question))
    );
    if (offenders.length === 0) return existing;

    // Build pools
    const [firstSet, secondSet, lastSet, wholePool] = await Promise.all([
      GridQuestion.find({ prompt: { $in: firstSetPrompts } }).lean(),
      GridQuestion.find({ prompt: { $in: secondSetPrompts } }).lean(),
      GridQuestion.find({ prompt: { $in: lastSetPrompts } }).lean(),
      GridQuestion.find({}).lean(),
    ]);

    const safeExistingIds = new Set(
      existing
        .filter((a) => !usedInOtherSections.has(String(a.question)) && foundSet.has(String(a.question)))
        .map((a) => String(a.question))
    );

    const exclude = new Set([...usedInOtherSections, ...safeExistingIds]);

    let candidates = pickN(wholePool, offenders.length, exclude);
    if (candidates.length < offenders.length) {
      candidates = [
        ...candidates,
        ...pickN(wholePool, offenders.length - candidates.length, new Set([...safeExistingIds])),
      ];
    }

    const updates = offenders.map((cellAssign, idx) => {
      const replacement = candidates[idx];
      if (!replacement) return null;
      return SectionGridAssignment.findOneAndUpdate(
        { team: teamId, section, cell: cellAssign.cell },
        { question: replacement._id },
        { new: true, upsert: true }
      );
    }).filter(Boolean);

    return await Promise.all(updates);
  }

  // Build new 6 with the required composition (3/2/1) and no cross-section duplicates
  const [firstSet, secondSet, lastSet, wholePool] = await Promise.all([
    GridQuestion.find({ prompt: { $in: firstSetPrompts } }).lean(),
    GridQuestion.find({ prompt: { $in: secondSetPrompts } }).lean(),
    GridQuestion.find({ prompt: { $in: lastSetPrompts } }).lean(),
    GridQuestion.find({}).lean(),
  ]);

  const chosenIds = new Set(usedInOtherSections);

  const takeFirst  = pickN(firstSet.length ? firstSet : wholePool, 3, chosenIds);
  for (const q of takeFirst) chosenIds.add(String(q._id));
  const takeSecond = pickN(secondSet.length ? secondSet : wholePool, 2, chosenIds);
  for (const q of takeSecond) chosenIds.add(String(q._id));
  const takeLast   = pickN(lastSet.length ? lastSet : wholePool, 1, chosenIds);
  for (const q of takeLast) chosenIds.add(String(q._id));

  let chosen = [...takeFirst, ...takeSecond, ...takeLast];

  if (chosen.length < 6) {
    const topUp = pickN(wholePool, 6 - chosen.length, new Set(chosen.map((q) => String(q._id))));
    chosen = [...chosen, ...topUp];
  }

  // shuffle and save
  for (let i = chosen.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
  }

  const ops = chosen.slice(0, 6).map((q, idx) =>
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

  // NEW: mark run start
  await ensureRunStarted(teamId);

  await Promise.all([
    ensureAssignmentsForTeamSection(teamId, 1),
    ensureAssignmentsForTeamSection(teamId, 2),
    ensureAssignmentsForTeamSection(teamId, 3),
  ]);

  const responses = await TeamResponse.find({ team: teamId }).lean();
  const rMap = new Map(responses.map((r) => [`${r.section}:${r.cell}`, r]));

  const buildSection = async (secId) => {
    const compUrl = await compositeImageUrl(secId);

    const cells = Array.from({ length: 6 }, (_, cell) => {
      const r = rMap.get(`${secId}:${cell}`);
      const solved = !!r?.isCorrect;
      const attempts = r?.attempts || 0;
      const attemptsLeft = Math.max(0, MAX_ATTEMPTS - attempts);
      const reveal = solved || attemptsLeft === 0;

      return {
        cell,
        answered: solved,
        attemptsLeft,
        imageUrl: reveal ? tileImageUrl(secId, cell) : "",
      };
    });

    return { id: secId, cells, compositeImageUrl: compUrl };
  };

  const [s1, s2, s3] = await Promise.all([buildSection(1), buildSection(2), buildSection(3)]);
  const unlockedSection = await computeUnlockedSection(teamId);

  // NEW: if all sections SOLVED, finalize total time
  await finalizeRunIfDone(teamId);

  res.json({ sections: [s1, s2, s3], unlockedSection });
}

export async function getQuestion(req, res) {
  const teamId = req.team._id;
  const section = Number(req.query.section);
  const cell = Number(req.query.cell);
  if (![1,2,3].includes(section) || !(cell >= 0 && cell <= 5)) {
    return res.status(400).json({ error: "Invalid section/cell" });
  }

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
    type: qDoc.type,
    options: qDoc.options || [],
    imageUrl: qDoc.imageUrl || "",
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

  if (tr?.isCorrect) {
    return res.json({
      correct: true,
      alreadySolved: true,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - (tr.attempts || 0)),
      imageUrl: tileImageUrl(section, cell)
    });
  }

  const currentAttempts = tr?.attempts || 0;

  if (currentAttempts >= MAX_ATTEMPTS) {
    return res.status(403).json({
      error: "No attempts left",
      attemptsLeft: 0,
      imageUrl: tileImageUrl(section, cell)
    });
  }

  const userNorm = normalize(answer);
  let isCorrect = false;

  if (qDoc.type === "mcq") {
    const match = (qDoc.options || []).find(
      (o) => normalize(o.key) === userNorm || normalize(o.label) === userNorm
    );
    isCorrect = !!match && normalize(qDoc.correctAnswer) === normalize(match.key);
  } else {
    // robust free-text check for grid questions
    isCorrect = compareAnswers(answer, qDoc.correctAnswer);
  }

  const attempts = currentAttempts + 1;
  tr = await TeamResponse.findOneAndUpdate(
    { team: teamId, section, cell },
    { answerGiven: answer, isCorrect, attempts, answeredAt: new Date() },
    { new: true, upsert: true }
  );

  // scoring
  if (isCorrect) {
    await Team.findByIdAndUpdate(teamId, { $inc: { points: GRID_POINTS_CORRECT } });
  } else if (qDoc.type === "mcq") {
    await Team.findByIdAndUpdate(teamId, { $inc: { points: -GRID_PENALTY_WRONG_MCQ } });
  }

  // unlock timer if grid fully revealed
  const completed = await teamCompletedAllCells(teamId, section);
  if (completed) {
    await ensureSectionTimer(teamId, section);
  }

  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - attempts);
  const revealImage = isCorrect || attemptsLeft === 0;

  return res.json({
    correct: isCorrect,
    attemptsLeft,
    imageUrl: revealImage ? tileImageUrl(section, cell) : ""
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

  if (expired && timer && !timer.stoppedAt) {
    await TeamSectionTimer.findOneAndUpdate(
      { _id: timer._id },
      { stoppedAt: new Date() }
    );
  }

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

  // NEW: if after fetching, all sections solved, finalize time.
  await finalizeRunIfDone(teamId);

  res.json({
    locked: false,
    questions,
    compositeImageUrl: meta?.compositeImageUrl || await compositeImageUrl(section),
    remainingSeconds,
    expired
  });
}

export async function submitSectionAnswer(req, res) {
  const teamId = req.team._id;
  const section = Number(req.body.section);
  const idx = Number(req.body.idx);
  const answer = req.body.answer;

  // Single question per section (idx MUST be 0)
  if (![1,2,3].includes(section) || idx !== 0 || !answer) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const timer = await ensureSectionTimer(teamId, section);
  if (!timer) return res.status(403).json({ error: "Section challenge locked" });

  const remainingSeconds = computeRemainingSeconds(timer);
  if (remainingSeconds === 0) {
    if (!timer.stoppedAt) {
      await TeamSectionTimer.findOneAndUpdate(
        { _id: timer._id },
        { stoppedAt: new Date() }
      );
    }
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
      remainingSeconds,
      completed: await sectionCompleted(teamId, section)
    });
  }
  if (currentAttempts >= MAX_ATTEMPTS) {
    return res.status(403).json({
      error: "No attempts left",
      attemptsLeft: 0,
      remainingSeconds,
      completed: await sectionCompleted(teamId, section)
    });
  }

  const attempts = currentAttempts + 1;
  // robust free-text comparison for section meta Q
  const isCorrect = compareAnswers(answer, q.answer);

  tr = await TeamSectionResponse.findOneAndUpdate(
    { team: teamId, section, idx },
    { answerGiven: answer, isCorrect, attempts, answeredAt: new Date() },
    { new: true, upsert: true }
  );

  if (isCorrect) {
    await Team.findByIdAndUpdate(teamId, { $inc: { points: SECTION_POINTS_CORRECT } });

    // Stop timer as soon as the ONLY section question is solved
    const solvedCount = await TeamSectionResponse.countDocuments({ team: teamId, section, isCorrect: true });
    if (solvedCount >= 1) {
      await TeamSectionTimer.findOneAndUpdate(
        { team: teamId, section },
        { stoppedAt: new Date() }
      );
    }

    // If this was section 3 (last), and now all sections solved → finalize total time
    if (section === 3) {
      await finalizeRunIfDone(teamId);
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
