// frontend/src/pages/QuizPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";

// ---------- Modal (single grid cell question) ----------
function QuestionModal({ open, onClose, prompt, attemptsLeft, solved, errorMsg, onSubmit, loading }) {
  const [answer, setAnswer] = useState("");
  useEffect(() => { setAnswer(""); }, [open, prompt]);

  if (!open) return null;
  const disabled = solved || attemptsLeft <= 0;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg bg-gray-900 rounded-2xl p-5 sm:p-6 border border-gray-700 text-white">
        <h3 className="text-lg sm:text-xl font-semibold mb-2">Question</h3>
        <p className="text-gray-200 mb-4 text-sm sm:text-base">{prompt}</p>

        <div className="flex items-center justify-between mb-2 text-xs sm:text-sm">
          <span className="text-gray-400">Attempts left: {attemptsLeft}</span>
          {solved && <span className="text-emerald-400 font-medium">Solved ✓</span>}
        </div>

        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer…"
          className={`w-full p-3 rounded-lg bg-gray-800 border focus:outline-none focus:ring-2
            ${errorMsg ? "border-red-500 focus:ring-red-500" : "border-gray-700 focus:ring-teal-500"}`}
          disabled={disabled}
        />
        {errorMsg && <p className="mt-2 text-sm text-red-400">{errorMsg}</p>}

        <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-800"
            disabled={loading}
          >
            Close
          </button>
          <button
            onClick={() => onSubmit(answer)}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg ${
              disabled ? "bg-gray-700 cursor-not-allowed" : "bg-gradient-to-r from-teal-500 to-green-600 hover:opacity-90"
            }`}
            disabled={disabled || loading}
          >
            {loading ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Section meta-question card ----------
function SectionQuestionCard({ section, q, onSubmit, disabledByTime = false }) {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const disabled = disabledByTime || q.solved || q.attemptsLeft <= 0;

  const submit = async () => {
    if (disabled) return;
    if (!answer.trim()) { setErr("Please enter an answer."); return; }
    setSubmitting(true);
    setErr("");
    try {
      const { data } = await api.post("/quiz/section-answer", { section, idx: q.idx, answer });
      if (data.correct) {
        q.solved = true;
        q.attemptsLeft = data.attemptsLeft;
      } else {
        q.attemptsLeft = data.attemptsLeft;
        setErr(`Incorrect. Attempts left: ${data.attemptsLeft}`);
      }
      // 👇 pass completion state up so parent can unlock next section
      onSubmit(!!data.completed);
    } catch (e) {
      setErr(e?.response?.data?.error || "Error submitting");
    } finally {
      setSubmitting(false);
      setAnswer("");
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold">Q{q.idx + 1}</h4>
        <div className="text-xs text-gray-300">
          Attempts left: {q.attemptsLeft}
          {q.solved && <span className="ml-2 text-emerald-400">Solved ✓</span>}
          {disabledByTime && <span className="ml-2 text-red-400">Time over</span>}
        </div>
      </div>
      <p className="text-gray-200 mb-3 text-sm sm:text-base">{q.prompt}</p>

      <div className="flex flex-col md:flex-row gap-2">
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Answer"
          className={`w-full md:flex-1 p-3 rounded-lg bg-gray-800 border ${err ? "border-red-500" : "border-gray-700"}`}
          disabled={disabled}
        />
        <button
          onClick={submit}
          disabled={disabled || submitting}
          className={`w-full md:w-auto px-4 py-3 rounded-lg ${disabled ? "bg-gray-700 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-500"}`}
        >
          {submitting ? "Submitting…" : "Submit"}
        </button>
      </div>
      {err && <div className="mt-2 text-sm text-red-400">{err}</div>}
    </div>
  );
}

export default function QuizPage() {
  const navigate = useNavigate();
  const team = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("team") || "null"); } catch { return null; }
  }, []);
  useEffect(() => { if (!team) navigate("/login"); }, [team, navigate]);

  const [section, setSection] = useState(() => {
    const saved = Number(localStorage.getItem("activeSection"));
    return [1,2,3].includes(saved) ? saved : 1;
  });
  const [unlockedSection, setUnlockedSection] = useState(1);
  const [sections, setSections] = useState([]);
  const [loadingGrid, setLoadingGrid] = useState(true);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [currentCell, setCurrentCell] = useState(null);
  const [question, setQuestion] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [solved, setSolved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // section challenge state
  const [bonusLocked, setBonusLocked] = useState(true);
  const [bonusQs, setBonusQs] = useState([]);
  const [remaining, setRemaining] = useState(null);
  const [expired, setExpired] = useState(false);

  // persist active section
  useEffect(() => { localStorage.setItem("activeSection", String(section)); }, [section]);

  const loadSections = async () => {
    setLoadingGrid(true);
    try {
      const { data } = await api.get("/quiz/sections");
      setUnlockedSection(data.unlockedSection || 1);
      if (section > (data.unlockedSection || 1)) setSection(data.unlockedSection || 1);
      setSections(data.sections || []);
    } finally {
      setLoadingGrid(false);
    }
  };
  useEffect(() => { loadSections(); }, []);

  const refreshBonus = async (sec) => {
    try {
      const { data } = await api.get("/quiz/section-questions", { params: { section: sec } });
      setBonusLocked(!!data.locked);
      setBonusQs(data.questions || []);
      setRemaining(typeof data.remainingSeconds === "number" ? data.remainingSeconds : null);
      setExpired(!!data.expired);
    } catch {
      setBonusLocked(true);
      setBonusQs([]);
      setRemaining(null);
      setExpired(false);
    }
  };

  // when section changes or grid updates, check if unlocked for challenge
  useEffect(() => {
    const s = sections.find((x) => x.id === section);
    const allRevealed = s?.cells?.every((c) => Boolean(c.imageUrl)) || false;
    if (allRevealed) {
      refreshBonus(section);
    } else {
      setBonusLocked(true);
      setBonusQs([]);
      setRemaining(null);
      setExpired(false);
    }
  }, [section, sections]);

  // countdown (frontend cosmetic)
  useEffect(() => {
    if (bonusLocked || remaining == null || expired) return;
    const id = setInterval(() => {
      setRemaining((prev) => (typeof prev === "number" && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [bonusLocked, remaining, expired]);

  // resync with server
  useEffect(() => {
    if (bonusLocked || expired) return;
    const id = setInterval(() => refreshBonus(section), 15000);
    return () => clearInterval(id);
  }, [bonusLocked, expired, section]);

  const openCell = async (cell) => {
    setCurrentCell(cell);
    setModalOpen(true);
    setQuestion("");
    setAttemptsLeft(5);
    setSolved(false);
    setErrorMsg("");
    try {
      const { data } = await api.get("/quiz/question", { params: { section, cell } });
      setQuestion(data.prompt);
      setAttemptsLeft(data.attemptsLeft);
      setSolved(!!data.solved);
    } catch {
      setQuestion("Question unavailable.");
    }
  };

  const submitAnswer = async (answer) => {
    if (!answer?.trim()) { setErrorMsg("Please enter an answer."); return; }
    setSubmitting(true);
    setErrorMsg("");
    try {
      const { data } = await api.post("/quiz/answer", { section, cell: currentCell, answer });
      setAttemptsLeft(data.attemptsLeft);
      if (data.correct) {
        setSolved(true);
        setModalOpen(false);
        await loadSections();
      } else {
        setSolved(false);
        setErrorMsg(`Incorrect. Attempts left: ${data.attemptsLeft}`);
        if (data.attemptsLeft === 0) {
          await loadSections();
          setModalOpen(false);
        }
      }
    } catch (e) {
      const msg = e?.response?.data?.error || "Error submitting answer";
      setErrorMsg(msg);
      if (e?.response?.status === 403 && e?.response?.data?.attemptsLeft === 0) {
        await loadSections();
        setModalOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const current = sections.find((s) => s.id === section) || {
    cells: Array.from({ length: 6 }, (_, i) => ({ cell: i, answered: false, attemptsLeft: 5, imageUrl: "" }))
  };

  const allRevealed = current.cells.every((c) => Boolean(c.imageUrl));

  const fmt = (sec) => {
    if (sec == null) return "";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const switchSection = (s) => {
    if (s > unlockedSection) {
      alert("This section is locked. Complete the previous section first.");
      return;
    }
    setSection(s);
  };

  return (
    <section className="page-shell">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-teal-400">ElectroMatrix – Quiz</h1>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-sm text-gray-300 flex-1 sm:flex-none truncate">Team: {team?.username || "—"}</span>
            <button
              onClick={() => { localStorage.removeItem("team"); localStorage.removeItem("activeSection"); navigate("/login"); }}
              className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Section Tabs */}
        <div className="flex gap-2 sm:gap-3 mb-6 flex-wrap">
          {[1,2,3].map((s) => {
            const locked = s > unlockedSection;
            return (
              <button
                key={s}
                onClick={() => switchSection(s)}
                disabled={locked}
                className={`px-4 py-2 rounded-lg border text-sm sm:text-base ${
                  section===s
                    ? "bg-teal-500/30 border-teal-400 text-teal-200"
                    : locked
                      ? "bg-gray-800/60 border-gray-700/60 text-gray-500 cursor-not-allowed"
                      : "bg-gray-800 border-gray-700 hover:bg-gray-700"
                }`}
                title={locked ? "Locked: finish previous section" : ""}
              >
                Section {s}{locked ? " 🔒" : ""}
              </button>
            );
          })}
        </div>

        {/* Grid (no gap; remove only inner borders when complete) */}
        <div className="flex items-center justify-center">
          <div className="grid grid-cols-3 grid-rows-2 w-full max-w-md gap-0 rounded-2xl overflow-hidden ring-1 ring-gray-700/60">
            {loadingGrid ? (
              <div className="col-span-3 text-center text-gray-300 py-10">Loading…</div>
            ) : (
              current.cells.map(({ cell, attemptsLeft: al, imageUrl }) => {
                const row = Math.floor(cell / 3);
                const col = cell % 3;

                // default border
                let borderClasses = "border border-gray-700";

                // if all cells revealed → remove inner edges, keep outer frame
                if (allRevealed) {
                  borderClasses = "";
                  if (row === 0) borderClasses += " border-t";
                  if (row === 1) borderClasses += " border-b";
                  if (col === 0) borderClasses += " border-l";
                  if (col === 2) borderClasses += " border-r";
                  borderClasses += " border-gray-700";
                }

                return (
                  <button
                    key={cell}
                    onClick={() => !allRevealed && openCell(cell)}
                    className={`aspect-square p-0 m-0 ${borderClasses}`}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={`Section ${section} Cell ${cell+1}`}
                        className="w-full h-full object-cover block"
                      />
                    ) : (
                      <span className="text-gray-300">{al}/5</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Section Challenge */}
        <div className="mt-8 sm:mt-10">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-lg sm:text-xl font-semibold">Section {section} Challenge</h3>
            {!bonusLocked && (
              <div className={`text-sm px-3 py-1 rounded-lg border ${
                expired ? "border-red-500 text-red-400" :
                remaining === null ? "border-emerald-500 text-emerald-400" :
                "border-teal-500 text-teal-300"
              }`}>
                {expired ? "Time over" :
                 remaining === null ? "Completed" : `Time left: ${fmt(remaining)}`}
              </div>
            )}
          </div>

          {bonusLocked ? (
            <div className="text-gray-300 text-sm sm:text-base">Solve all 6 cells to unlock these questions.</div>
          ) : (
            <div className="space-y-4">
              {bonusQs.map((q) => (
                <SectionQuestionCard
                  key={q.idx}
                  section={section}
                  q={q}
                  onSubmit={(completed) => {
                    // refresh the section questions/timer
                    refreshBonus(section);
                    // if all 3 solved now → reload sections to unlock next tab immediately
                    if (completed) {
                      loadSections();
                    }
                  }}
                  disabledByTime={expired || (remaining !== null && remaining === 0)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        <QuestionModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          prompt={question}
          attemptsLeft={attemptsLeft}
          solved={solved}
          errorMsg={errorMsg}
          onSubmit={submitAnswer}
          loading={submitting}
        />
      </div>
    </section>
  );
}
