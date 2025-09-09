// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Serve static images (for quiz prompts etc.)
app.use("/images", express.static(path.join(__dirname, "public/images")));

// ✅ Allow requests from your local frontend
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || ["https://electro-matrix.vercel.app"] }));

app.use(express.json());

// Base route
app.get("/", (_req, res) => res.send("ElectroMatrix API ✅ (My Render Clone)"));

// Routes
app.use("/api", authRoutes);
app.use("/api/quiz", quizRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

// Start server after DB connection
(async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(PORT, () =>
      console.log(`🚀 Server running at http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
})();

