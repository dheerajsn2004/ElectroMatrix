// backend/scripts/seedGridQuestions.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import GridQuestion from "../models/GridQuestion.js";
import SectionGridAssignment from "../models/SectionGridAssignment.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always load backend/.env regardless of where we are run from
dotenv.config({ path: path.join(__dirname, "..", ".env") });

function requireEnv(key) {
  const v = process.env[key];
  if (!v) {
    console.error(`❌ Missing required env ${key}. Expected in ${path.join(__dirname, "..", ".env")}`);
    process.exit(1);
  }
  return v;
}
const MONGO_URI = requireEnv("MONGO_URI");

/**
 * Clean dataset with MCQs having options ONLY in 'options' array,
 * NOT duplicated in 'prompt'.
 */
const data = [
  // ===== FIRST SET =====
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
  { prompt: "Determine whether it is periodic and find the fundamental time period. x(t) = cos²(2πt)", type: "text", correctAnswer: "periodic; 0.5" },
  { prompt: "Determine whether it is periodic and find the fundamental time period. x[n] = cos(2n)", type: "text", correctAnswer: "nonperiodic" },
  {
    prompt: "Categorize x(t) as energy or power signal and find the energy/time-averaged power for x(t) = { t, 0≤t≤1 ; 2−t, 1≤t≤2 }.",
    type: "text",
    correctAnswer: "energy; 2/3",
  },
  {
    prompt: "Given the triangular pulse x(t) (see image), which expression represents the shown signal?",
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
  {
    prompt: "Given the triangular pulse x(t) (see image), which expression represents the shown signal?",
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
  {
    prompt: "System y[n] = (1/3)(x[n+1]+x[n]+x[n−1]). Which properties hold?",
    type: "mcq",
    options: [
      { key: "a", label: "Causal and stable" },
      { key: "b", label: "Non-causal and stable" },
      { key: "c", label: "Causal and unstable" },
      { key: "d", label: "Non-causal and unstable" },
    ],
    correctAnswer: "b",
  },
  {
    prompt: "System y[n] = x[n] + 2. Which properties hold?",
    type: "mcq",
    options: [
      { key: "a", label: "Linear and memoryless" },
      { key: "b", label: "Linear and has memory" },
      { key: "c", label: "Non-linear and has memory" },
      { key: "d", label: "Non-linear and memoryless" },
    ],
    correctAnswer: "d",
  },
  {
    prompt: "System y[n] = n x[n]. Which properties hold?",
    type: "mcq",
    options: [
      { key: "a", label: "Memoryless and time-variant" },
      { key: "b", label: "Memoryless and time-invariant" },
      { key: "c", label: "Has memory and time-variant" },
      { key: "d", label: "Has memory and time-invariant" },
    ],
    correctAnswer: "a",
  },
  {
    prompt: "Why is a system with y(t) = x²(t) considered non-invertible?",
    type: "mcq",
    options: [
      { key: "a", label: "Because it is a non-linear system" },
      { key: "b", label: "Because it has memory" },
      { key: "c", label: "Because distinct inputs can give same output" },
      { key: "d", label: "Because the output signal can be zero" },
    ],
    correctAnswer: "c",
  },
  { prompt: "What is the fundamental period N of x[n] = sin((2π/7) n) ?", type: "text", correctAnswer: "7" },
  { prompt: "For x(t)=3t² + sin(t), the value of its odd component at t=π is", type: "text", correctAnswer: "0" },
  { prompt: "Total energy of the discrete-time signal x[n] = δ[n−2] is", type: "text", correctAnswer: "1" },

  // ===== SECOND SET: Verilog =====
  {
    prompt:
      "The declaration  \nreg [7:0] my_memory [0:127];  \ndescribes a memory array. What is the total storage capacity of this memory in bits?",
    type: "text",
    correctAnswer: "1024",
  },
  {
    prompt:
      "A reg can be assigned a value inside an initial or always block. Which Verilog data type must be used for a signal on the left-hand side of a continuous assign statement?",
    type: "mcq",
    options: [
      { key: "a", label: "integer" },
      { key: "b", label: "reg" },
      { key: "c", label: "wire" },
      { key: "d", label: "time" },
    ],
    correctAnswer: "c",
  },
  {
    prompt:
      "What is the primary functional difference between the fork-join block and the begin-end block in Verilog?",
    type: "mcq",
    options: [
      { key: "a", label: "fork-join executes statements sequentially, while begin-end executes them in parallel." },
      { key: "b", label: "fork-join can contain delays, while begin-end cannot." },
      { key: "c", label: "fork-join executes statements in parallel, while begin-end executes them sequentially." },
      { key: "d", label: "fork-join is used for functions, while begin-end is used for tasks." },
    ],
    correctAnswer: "c",
  },
  {
    prompt:
      "Which Verilog procedural block is intended for statements that should execute only once at the beginning of a simulation?",
    type: "mcq",
    options: [
      { key: "a", label: "always" },
      { key: "b", label: "function" },
      { key: "c", label: "initial" },
      { key: "d", label: "fork" },
    ],
    correctAnswer: "c",
  },
  { prompt: "The 7-bit Gray code 1011010 is equivalent to the binary value", type: "text", correctAnswer: "1101100" },

  // ===== LAST SET: Op-amp =====
  {
    prompt: "In an inverting amplifier with Rf =100kΩ, Rin =10kΩ, the voltage gain is:",
    type: "mcq",
    options: [
      { key: "a", label: "–0.1" },
      { key: "b", label: "–1" },
      { key: "c", label: "–10" },
      { key: "d", label: "–100" },
    ],
    correctAnswer: "c",
  },
  {
    prompt: "The output of an op-amp integrator for a square wave input is:",
    type: "mcq",
    options: [
      { key: "a", label: "Square wave" },
      { key: "b", label: "Triangular wave" },
      { key: "c", label: "Sine wave" },
      { key: "d", label: "Sawtooth wave" },
    ],
    correctAnswer: "b",
  },
  {
    prompt: "A Schmitt Trigger is primarily used for:",
    type: "mcq",
    options: [
      { key: "a", label: "Signal amplification" },
      { key: "b", label: "Removing noise from input signals" },
      { key: "c", label: "Frequency multiplication" },
      { key: "d", label: "Reducing gain of amplifier" },
    ],
    correctAnswer: "b",
  },
  {
    prompt: "A voltage follower has a voltage gain of approximately:",
    type: "mcq",
    options: [
      { key: "a", label: "0" },
      { key: "b", label: "0.5" },
      { key: "c", label: "1" },
      { key: "d", label: "Infinity" },
    ],
    correctAnswer: "c",
  },
  {
    prompt: "An op-amp integrator has R=100kΩ and C=0.1μF. If the input is a 1 V DC step, the output after 1 ms will be:",
    type: "mcq",
    options: [
      { key: "a", label: "–0.1 V" },
      { key: "b", label: "–1 V" },
      { key: "c", label: "–10 V" },
      { key: "d", label: "–100 V" },
    ],
    correctAnswer: "a",
  },
];

async function main() {
  console.log("🔌 Connecting to MongoDB…");
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });

  console.log("🧹 Clearing old GridQuestion and SectionGridAssignment collections…");
  await SectionGridAssignment.deleteMany({});
  await GridQuestion.deleteMany({});

  console.log("🌱 Inserting clean GridQuestion dataset…");
  await GridQuestion.insertMany(data);

  const total = await GridQuestion.countDocuments();
  console.log("✅ Seeded GridQuestion pool. Total questions:", total);

  await mongoose.disconnect();
  console.log("🔌 Disconnected");
}

main().catch((e) => {
  console.error("❌ Seeder failed:", e);
  process.exit(1);
});
