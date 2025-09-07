import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function ThankYou() {
  const navigate = useNavigate();

  return (
    <section className="h-screen page-shell text-center">
      <div className="mx-auto max-w-4xl">
        {/* Icon */}
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
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12l2.5 2.5L16 9" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-[40px] sm:text-6xl md:text-7xl font-extrabold tracking-wide leading-tight">
          <span className="text-teal-400 drop-shadow-[0_0_30px_rgba(45,212,191,0.35)]">Thank</span>
          <span className="text-green-400 drop-shadow-[0_0_30px_rgba(74,222,128,0.35)]"> You!</span>
        </h1>

        {/* Quote */}
        <p className="mt-6 text-xl sm:text-2xl text-gray-300/90 tracking-wide">
          “Circuits don’t just carry current — they carry curiosity.”
        </p>

        {/* Blurb */}
        <p className="mt-6 max-w-3xl mx-auto text-base sm:text-lg text-gray-400 leading-8">
          You cracked the grids, revealed the circuits, and conquered the challenge.
          Thanks for being a part of <span className="text-teal-300">ElectroMatrix</span> by
          <span className="text-teal-300"> NISB</span>. See you at the next spark!
        </p>

        {/* Actions */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              localStorage.removeItem("team");
              localStorage.removeItem("activeSection");
              navigate("/login");
            }}
            className="px-5 py-3 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700"
          >
            Logout
          </button>
          <Link to="/" className="btn-primary">
            Back to Home <span className="text-2xl leading-none">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
