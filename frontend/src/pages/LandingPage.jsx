import React from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <section className="page-shell text-center">
      <div className="mx-auto max-w-4xl">
        {/* icon */}
        <div className="mb-6 flex justify-center">
          <svg
            width="88"
            height="88"
            viewBox="0 0 24 24"
            className="block mx-auto text-teal-400 drop-shadow-[0_0_20px_rgba(45,212,191,0.35)]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <rect x="6.5" y="6.5" width="11" height="11" rx="2.5" />
            <rect x="9.5" y="9.5" width="5" height="5" rx="1.2" />
            <line x1="12" y1="2"  x2="12" y2="4"  />
            <line x1="12" y1="20" x2="12" y2="22" />
            <line x1="4"  y1="12" x2="2"  y2="12" />
            <line x1="22" y1="12" x2="20" y2="12" />
          </svg>
        </div>

        {/* title */}
        <h1 className="text-[40px] sm:text-6xl md:text-7xl font-extrabold tracking-wide leading-tight">
          <span className="text-teal-400 drop-shadow-[0_0_30px_rgba(45,212,191,0.35)]">Electro</span>
          <span className="text-green-400 drop-shadow-[0_0_30px_rgba(74,222,128,0.35)]">Matrix</span>
        </h1>

        <p className="mt-6 text-xl sm:text-3xl text-gray-300/90 tracking-wide">
          Crack the Grid, Unleash the Circuit
        </p>

        <p className="mt-6 max-w-3xl mx-auto text-base sm:text-lg text-gray-400 leading-8">
          Challenge your electronics knowledge across Analog, Digital, and advanced circuits.
          Solve puzzles, reveal circuits, and compete for the top spot.
        </p>

        <button onClick={() => navigate("https://electro-matrix.vercel.app/login")} className="btn-primary mt-10">
          Get Started <span className="text-2xl leading-none">→</span>
        </button>
      </div>
    </section>
  );
}
