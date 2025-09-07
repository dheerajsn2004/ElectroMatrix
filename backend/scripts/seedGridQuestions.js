// backend/scripts/seedGridQuestions.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import GridQuestion from "../models/GridQuestion.js";

dotenv.config();

const data = [
  // 1
  {
    prompt:
      "What is the key difference between an energy signal and a power signal based on the definitions?",
    type: "mcq",
    options: [
      { key: "a", label: "An energy signal has finite energy and zero average power, while a power signal has infinite energy and finite average power." },
      { key: "b", label: "An energy signal has zero energy and finite average power, while a power signal has finite energy and infinite average power." },
      { key: "c", label: "Both signals have finite energy, but only a power signal has finite power." },
      { key: "d", label: "Both signals have infinite energy, but only an energy signal has zero power." },
    ],
    correctAnswer: "a",
  },

  // 2
  {
    prompt:
      "Determine whether it is periodic and find the fundamental time period. x(t) = cos²(2πt)",
    type: "text",
    correctAnswer: "periodic; 0.5",
  },

  // 3
  {
    prompt: "Determine whether it is periodic and find the fundamental time period. x[n] = cos(2n)",
    type: "text",
    correctAnswer: "nonperiodic",
  },

  // 4
  {
    prompt:
      "Categorize x(t) as energy or power signal and find the energy/time-averaged power for x(t) = { t, 0≤t≤1 ; 2−t, 1≤t≤2 }.",
    type: "text",
    correctAnswer: "energy; 2/3",
  },

  // 5 (with image)
  {
    prompt:
      "Given the triangular pulse x(t) (see image), which expression represents the shown signal?",
    type: "mcq",
    imageUrl: "/images/q5.png",
    options: [
      { key: "a", label: "x(3t + 2)" },
      { key: "b", label: "x(t - 2/3)" },
      { key: "c", label: "x(2 − 3t)" },
      { key: "d", label: "x(t/3 − 2)" },
    ],
    correctAnswer: "a",
  },

  // 6 (with image)
  {
    prompt:
      "Given the triangular pulse x(t) (see image), which expression represents the shown signal?",
    type: "mcq",
    imageUrl: "/images/q6.png",
    options: [
      { key: "a", label: "x(t − 2)" },
      { key: "b", label: "x(t/2 − 2)" },
      { key: "c", label: "x(2t − 4)" },
      { key: "d", label: "x(2t − 1/2)" },
    ],
    correctAnswer: "c",
  },

  // 7
  {
    prompt: "How can the ramp function r(t) be derived from the unit step function u(t)?",
    type: "mcq",
    options: [
      { key: "a", label: "Differentiation" },
      { key: "b", label: "Logarithmic" },
      { key: "c", label: "Exponential" },
      { key: "d", label: "Integration" },
    ],
    correctAnswer: "d",
  },

  // 8
  {
    prompt:
      "System y[n] = (1/3)(x[n+1]+x[n]+x[n−1]). Which properties hold?",
    type: "mcq",
    options: [
      { key: "a", label: "Causal and stable" },
      { key: "b", label: "Non-causal and stable" },
      { key: "c", label: "Causal and unstable" },
      { key: "d", label: "Non-causal and unstable" },
    ],
    correctAnswer: "b",
  },

  // 9
  {
    prompt:
      "System y[n] = x[n] + 2. Which properties hold?",
    type: "mcq",
    options: [
      { key: "a", label: "Linear and memoryless" },
      { key: "b", label: "Linear and has memory" },
      { key: "c", label: "Non-linear and has memory" },
      { key: "d", label: "Non-linear and memoryless" },
    ],
    correctAnswer: "d",
  },

  // 10
  {
    prompt:
      "System y[n] = n x[n]. Which properties hold?",
    type: "mcq",
    options: [
      { key: "a", label: "Memoryless and time-variant" },
      { key: "b", label: "Memoryless and time-invariant" },
      { key: "c", label: "Has memory and time-variant" },
      { key: "d", label: "Has memory and time-invariant" },
    ],
    correctAnswer: "a",
  },

  // 11
  {
    prompt:
      "Why is a system with y(t) = x²(t) considered non-invertible?",
    type: "mcq",
    options: [
      { key: "a", label: "Because it is a non-linear system" },
      { key: "b", label: "Because it has memory" },
      { key: "c", label: "Because distinct inputs can give same output" },
      { key: "d", label: "Because the output signal can be zero" },
    ],
    correctAnswer: "c",
  },

  // 12
  {
    prompt:
      "What is the fundamental period N of x[n] = sin((2π/7) n) ?",
    type: "text",
    correctAnswer: "7",
  },

  // 13
  {
    prompt:
      "For x(t)=3t² + sin(t), the value of its odd component at t=π is",
    type: "text",
    correctAnswer: "0",
  },

  // 14
  {
    prompt:
      "Total energy of the discrete-time signal x[n] = δ[n−2] is",
    type: "text",
    correctAnswer: "1",
  },
];

function norm(s) {
  return String(s || "").trim().toLowerCase();
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  // idempotent seed: upsert by normalized prompt
  for (const q of data) {
    await GridQuestion.findOneAndUpdate(
      { prompt: q.prompt },
      q,
      { new: true, upsert: true }
    );
  }
  console.log("✅ Seeded grid question pool:", await GridQuestion.countDocuments());
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
