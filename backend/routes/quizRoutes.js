// backend/routes/quizRoutes.js
import { Router } from "express";
import { withTeam } from "../middleware/withTeam.js";
import { getSections, getQuestion, submitAnswer } from "../controllers/quizController.js";

const router = Router();

router.use(withTeam); // all routes require team header

router.get("/sections", getSections);
router.get("/question", getQuestion);
router.post("/answer", submitAnswer);

export default router;
