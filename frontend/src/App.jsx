import React from "react";
import { Routes, Route } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import QuizPage from "./pages/QuizPage";
import ThankYou from "./pages/ThankYou";

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/thank-you" element={<ThankYou />} />
      </Route>
    </Routes>
  );
}
