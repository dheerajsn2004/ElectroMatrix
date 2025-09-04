// backend/routes/quizRoutes.js
import { Router } from "express";
import { withTeam } from "../middleware/withTeam.js";
import {
  getSections, getQuestion, submitAnswer,
  getSectionQuestions, submitSectionAnswer
} from "../controllers/quizController.js";

const router = Router();

router.use(withTeam); // all quiz routes require team header

// grid
router.get("/sections", getSections);
router.get("/question", getQuestion);
router.post("/answer", submitAnswer);

// section challenge (3 Qs after all cells solved)
router.get("/section-questions", getSectionQuestions);
router.post("/section-answer", submitSectionAnswer);

export default router;
