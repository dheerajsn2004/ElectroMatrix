import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";

/* --------------------- small helpers --------------------- */
function shallowEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!shallowEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (typeof a === "object" && typeof b === "object") {
    const ak = Object.keys(a), bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    for (const k of ak) {
      if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
      if (!shallowEqual(a[k], b[k])) return false;
    }
    return true;
  }
  return false;
}

function assetUrl(path) {
  if (!path) return "";
  if (/^(https?:|data:)/i.test(path)) return path;
  const base = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/* ---------------- Modal (single grid cell question) ---------------- */
function QuestionModal({
  open,
  onClose,
  prompt,
  type,
  options,
  imageUrl,
  attemptsLeft,
  maxAttempts,   // NEW
  solved,
  errorMsg,
  onSubmit,
  loading,
}) {
  const [answerText, setAnswerText] = useState("");
  const [selected, setSelected] = useState("");

  useEffect(() => {
    setAnswerText("");
    setSelected("");
  }, [open, prompt, type]);

  if (!open) return null;
  const disabled = solved || attemptsLeft <= 0;

  const handleSubmit = () => {
    if (type === "mcq") {
      if (!selected) return;
      onSubmit(selected);
    } else {
      if (!answerText.trim()) return;
      onSubmit(answerText);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div
        className="w-full max-w-2xl bg-gray-900 rounded-2xl border border-gray-700 text-white shadow-xl flex flex-col"
        style={{ maxHeight: "85vh" }}
        onCopy={(e) => e.preventDefault()} /* extra guard */
      >
        {/* Header */}
        <div className="px-5 sm:px-6 pt-5 pb-3 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-semibold">Question</h3>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-gray-600 hover:bg-gray-800 text-sm"
            disabled={loading}
          >
            Close
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 px-5 sm:px-6 py-4 overflow-y-auto">
          <p className="no-select text-gray-200 mb-4 text-sm sm:text-base whitespace-pre-wrap">
            {prompt}
          </p>

          {imageUrl ? (
            <div className="mb-4">
              <img
                src={assetUrl(imageUrl)}
                alt="Question reference"
                className="w-full max-h-80 object-contain rounded-lg border border-gray-700"
                draggable={false}
                loading="eager"
                decoding="sync"
              />
            </div>
          ) : null}

          <div className="flex items-center justify-between mb-3 text-xs sm:text-sm">
            <span className="text-gray-400">
              Attempts left: {attemptsLeft}{typeof maxAttempts === "number" ? ` / ${maxAttempts}` : ""}
            </span>
            {solved && <span className="text-emerald-400 font-medium">Solved ✓</span>}
          </div>

          {type === "mcq" ? (
            <div className="space-y-2">
              {(options || []).map((o) => (
                <label
                  key={o.key}
                  className={`no-select flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                    selected === o.key
                      ? "border-teal-500 bg-teal-500/10"
                      : "border-gray-700 hover:bg-gray-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="mcq"
                    className="accent-teal-500"
                    checked={selected === o.key}
                    onChange={() => setSelected(o.key)}
                    disabled={disabled || loading}
                  />
                  <span className="no-select text-sm sm:text-base">
                    <span className="text-gray-300 font-semibold mr-2">{o.key.toUpperCase()}.</span>
                    <span className="text-gray-200">{o.label}</span>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <input
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your answer…"
              className={`w-full p-3 rounded-lg bg-gray-800 border focus:outline-none focus:ring-2
                ${errorMsg ? "border-red-500 focus:ring-red-500" : "border-gray-700 focus:ring-teal-500"}`}
              disabled={disabled || loading}
            />
          )}

          {errorMsg && <p className="mt-2 text-sm text-red-400">{errorMsg}</p>}
        </div>

        {/* Footer stays pinned */}
        <div className="px-5 sm:px-6 py-4 border-t border-gray-800 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-800"
            disabled={loading}
          >
            Close
          </button>
          <button
            onClick={handleSubmit}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg ${
              disabled
                ? "bg-gray-700 cursor-not-allowed"
                : "bg-gradient-to-r from-teal-500 to-green-600 hover:opacity-90"
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

/* ------------- Section meta-question card (stacked) ------------- */
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
      onSubmit();
    } catch (e) {
      const msg = e?.response?.data?.error;
      if (msg === "Time over") setErr("Time over");
      else if (msg === "No attempts left") setErr("No attempts left");
      else setErr("");
      onSubmit();
    } finally {
      setSubmitting(false);
      setAnswer("");
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-5" onCopy={(e)=>e.preventDefault()}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold">Q{q.idx + 1}</h4>
        <div className="text-xs text-gray-300">
          Attempts left: {q.attemptsLeft}{typeof q.maxAttempts === "number" ? ` / ${q.maxAttempts}` : ""}
          {q.solved && <span className="ml-2 text-emerald-400">Solved ✓</span>}
          {disabledByTime && <span className="ml-2 text-red-400">Time over</span>}
        </div>
      </div>
      <p className="no-select text-gray-200 mb-3 text-sm sm:text-base">{q.prompt}</p>

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

/* ------------------------------- Page ------------------------------ */
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
  const [initialLoaded, setInitialLoaded] = useState(false);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [currentCell, setCurrentCell] = useState(null);
  const [question, setQuestion] = useState("");
  const [qType, setQType] = useState("text");   // ✅ fixed
  const [qOptions, setQOptions] = useState([]);
  const [qImage, setQImage] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [qMaxAttempts, setQMaxAttempts] = useState(5); // NEW
  const [solved, setSolved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // section challenge state (+ timer)
  const [bonusLocked, setBonusLocked] = useState(true);
  const [bonusQs, setBonusQs] = useState([]);
  const [remaining, setRemaining] = useState(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => { localStorage.setItem("activeSection", String(section)); }, [section]);

  const loadSections = async () => {
    const { data } = await api.get("/quiz/sections");

    setUnlockedSection((prev) =>
      prev === (data.unlockedSection || 1) ? prev : (data.unlockedSection || 1)
    );

    if ((data.unlockedSection || 1) > section) {
      setSection(data.unlockedSection || section);
    }

    setSections((prev) => {
      const next = data.sections || [];
      return shallowEqual(prev, next) ? prev : next;
    });

    if (!initialLoaded) setInitialLoaded(true);

    return data;
  };

  useEffect(() => { loadSections(); }, []);

  const refreshBonus = async (sec) => {
    try {
      const { data } = await api.get("/quiz/section-questions", { params: { section: sec } });
      setBonusLocked(!!data.locked);
      setBonusQs(data.questions || []);
      setRemaining(typeof data.remainingSeconds === "number" ? data.remainingSeconds : null);
      setExpired(!!data.expired);

      const allSolved = (data.questions || []).every((q) => q.solved);

      // If Section 3 single question solved, go to Thank You
      if (allSolved && sec === 3) {
        navigate("/thank-you");
        return;
      }

      if (data.expired || allSolved) {
        const loaded = await loadSections();
        if (loaded?.unlockedSection && loaded.unlockedSection > sec) {
          setSection(loaded.unlockedSection);
        }
      }
    } catch { /* ignore */ }
  };

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

  useEffect(() => {
    if (bonusLocked || remaining == null || expired) return;
    const id = setInterval(() => {
      setRemaining((prev) => (typeof prev === "number" && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [bonusLocked, remaining, expired]);

  useEffect(() => {
    if (bonusLocked || expired) return;
    const id = setInterval(() => refreshBonus(section), 5000);
    return () => clearInterval(id);
  }, [bonusLocked, expired, section]);

  const openCell = async (cell) => {
    setCurrentCell(cell);
    setModalOpen(true);
    setQuestion("");
    setQType("text");
    setQOptions([]);
    setQImage("");
    setAttemptsLeft(5);
    setQMaxAttempts(5);
    setSolved(false);
    setErrorMsg("");
    try {
      const { data } = await api.get("/quiz/question", { params: { section, cell } });
      setQuestion(data.prompt);
      setQType(data.type || "text");
      setQOptions(Array.isArray(data.options) ? data.options : []);
      setQImage(data.imageUrl || "");
      setAttemptsLeft(data.attemptsLeft);
      setQMaxAttempts(typeof data.maxAttempts === "number" ? data.maxAttempts : (data.type === "mcq" ? 4 : 5));
      setSolved(!!data.solved);
    } catch {
      setQuestion("Question unavailable.");
    }
  };

  const submitAnswer = async (answer) => {
    if (!answer?.toString().trim()) { setErrorMsg("Please enter an answer."); return; }
    setSubmitting(true);
    setErrorMsg("");
    try {
      const { data } = await api.post("/quiz/answer", { section, cell: currentCell, answer });
      setAttemptsLeft(data.attemptsLeft);
      if (typeof data.maxAttempts === "number") setQMaxAttempts(data.maxAttempts);
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
      const msg = e?.response?.data?.error || "";
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
    cells: Array.from({ length: 6 }, (_, i) => ({ cell: i, imageUrl: "", attemptsLeft: 5, maxAttempts: 5 })),
    compositeImageUrl: "",
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

        {/* Grid / Composite */}
        <div className="flex items-center justify-center">
          <div className="relative w-full max-w-md">
            <div className="grid grid-cols-3 grid-rows-2 gap-0 rounded-2xl overflow-hidden ring-1 ring-gray-700/60">
              {!initialLoaded ? (
                <div className="col-span-3 text-center text-gray-300 py-10">Loading…</div>
              ) : allRevealed ? (
                <img
                  src={assetUrl(current.compositeImageUrl)}
                  alt={`Section ${section} Composite`}
                  className="col-span-3 row-span-2 w-full h-full object-cover block"
                  draggable={false}
                  loading="eager"
                  decoding="sync"
                />
              ) : (
                current.cells.map(({ cell, attemptsLeft: al, maxAttempts: mx, imageUrl }) => (
                  <button
                    key={cell}
                    onClick={() => openCell(cell)}
                    className="relative aspect-square p-0 m-0 border border-gray-700"
                  >
                    {imageUrl ? (
                      <img
                        src={assetUrl(imageUrl)}
                        alt={`S${section} C${cell + 1}`}
                        className="absolute inset-0 w-full h-full object-cover block"
                        draggable={false}
                        loading="eager"
                        decoding="sync"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-gray-300">
                        {al}{typeof mx === "number" ? `/${mx}` : ""}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>

            {allRevealed && (
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-gray-700/60" />
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
                  onSubmit={() => refreshBonus(section)}
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
          type={qType}
          options={qOptions}
          imageUrl={qImage}
          attemptsLeft={attemptsLeft}
          maxAttempts={qMaxAttempts}
          solved={solved}
          errorMsg={errorMsg}
          onSubmit={submitAnswer}
          loading={submitting}
        />
      </div>
    </section>
  );
}