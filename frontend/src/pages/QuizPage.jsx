import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";

function QuestionModal({ open, onClose, prompt, attemptsLeft, solved, errorMsg, onSubmit, loading }) {
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    setAnswer("");
  }, [open, prompt]);

  if (!open) return null;

  const disabled = solved || attemptsLeft <= 0;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg bg-gray-900 rounded-2xl p-6 border border-gray-700 text-white">
        <h3 className="text-xl font-semibold mb-2">Question</h3>
        <p className="text-gray-200 mb-4">{prompt}</p>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Attempts left: {attemptsLeft}</span>
          {solved && <span className="text-emerald-400 font-medium">Solved ✓</span>}
        </div>

        <input
          value={answer}
          onChange={(e) => {
            // clear error as they type
            if (errorMsg) errorMsg = "";
            setAnswer(e.target.value);
          }}
          placeholder="Type your answer…"
          className={`w-full p-3 rounded-lg bg-gray-800 border focus:outline-none focus:ring-2 
            ${errorMsg ? "border-red-500 focus:ring-red-500" : "border-gray-700 focus:ring-cyan-500"}`}
          disabled={disabled}
        />

        {/* Inline error message in the box */}
        {errorMsg && (
          <p className="mt-2 text-sm text-red-400">
            {errorMsg}
          </p>
        )}

        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-800"
            disabled={loading}
          >
            Close
          </button>
          <button
            onClick={() => onSubmit(answer)}
            className={`px-4 py-2 rounded-lg ${
              disabled ? "bg-gray-700 cursor-not-allowed" : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90"
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

export default function QuizPage() {
  const navigate = useNavigate();
  const team = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("team") || "null"); } catch { return null; }
  }, []);
  useEffect(() => { if (!team) navigate("/login"); }, [team, navigate]);

  const [section, setSection] = useState(1);
  const [sections, setSections] = useState([]);
  const [loadingGrid, setLoadingGrid] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [currentCell, setCurrentCell] = useState(null);
  const [question, setQuestion] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [solved, setSolved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadSections = async () => {
    setLoadingGrid(true);
    try {
      const { data } = await api.get("/quiz/sections");
      setSections(data.sections || []);
    } finally {
      setLoadingGrid(false);
    }
  };

  useEffect(() => { loadSections(); }, []);

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
      if (data.solved) setErrorMsg(""); // solved means no error
    } catch {
      setQuestion("Question unavailable.");
    }
  };

  const submitAnswer = async (answer) => {
    if (!answer?.trim()) {
      setErrorMsg("Please enter an answer.");
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    try {
      const { data } = await api.post("/quiz/answer", { section, cell: currentCell, answer });
      setAttemptsLeft(data.attemptsLeft);
      if (data.correct) {
        setSolved(true);
        setModalOpen(false); // close on correct
      } else {
        setSolved(false);
        setErrorMsg(`Incorrect. Attempts left: ${data.attemptsLeft}`);
      }
      await loadSections(); // refresh grid states
    } catch (e) {
      const msg = e?.response?.data?.error || "Error submitting answer";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const current = sections.find((s) => s.id === section) || {
    cells: Array.from({ length: 6 }, (_, i) => ({ cell: i, answered: false, attemptsLeft: 5 }))
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="max-w-4xl mx-auto p-6">
        <header className="flex items-center justify-between py-6">
          <h1 className="text-2xl font-bold text-cyan-400">ElectroMatrix – Quiz</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">Team: {team?.username || "—"}</span>
            <button
              onClick={() => { localStorage.removeItem("team"); navigate("/login"); }}
              className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Section Tabs */}
        <div className="flex gap-3 mb-6">
          {[1,2,3].map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`px-4 py-2 rounded-lg border ${section===s ? "bg-cyan-600 border-cyan-500" : "bg-gray-800 border-gray-700 hover:bg-gray-700"}`}
            >
              Section {s}
            </button>
          ))}
        </div>

        {/* 2×3 Grid */}
        <div className="flex items-center justify-center">
          <div className="grid grid-cols-3 gap-4 w-full max-w-md">
            {loadingGrid ? (
              <div className="col-span-3 text-center text-gray-300 py-10">Loading…</div>
            ) : (
              current.cells.map(({ cell, answered, attemptsLeft: al }) => (
                <button
                  key={cell}
                  onClick={() => openCell(cell)}
                  className={`aspect-square rounded-2xl flex items-center justify-center text-2xl font-bold border relative
                    ${answered ? "bg-emerald-600/80 border-emerald-400" : "bg-gray-800 border-gray-700 hover:bg-gray-700"}`}
                >
                  {cell + 1}
                  {!answered && (
                    <span className="absolute bottom-2 right-2 text-xs text-gray-300">
                      {al ?? "—"}/5
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
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
    </div>
  );
}
