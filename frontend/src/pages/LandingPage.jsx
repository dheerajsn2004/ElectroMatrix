import React from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <section className="page-shell text-center">
      <div className="mx-auto max-w-4xl">
      <h1
        className="
          kelly-slab-regular
          text-center
          leading-tight
          relative
          tracking-[0.15em] sm:tracking-[0.2em] md:tracking-[0.25em]
          text-[clamp(2rem,6vw,3rem)] sm:text-[clamp(2.5rem,5vw,4rem)] md:text-[clamp(3rem,4vw,5rem)]
        "
      >
        <span className="dying-neon">
          ElectroMatrix
        </span>
      </h1>
          
        <p className="mt-6 text-xl sm:text-3xl text-gray-300/90 tracking-wide">
          Crack the Grid, Unleash the Circuit
        </p>

        <p className="mt-6 max-w-3xl mx-auto text-base sm:text-lg text-gray-400 leading-8">
          Challenge your electronics knowledge across Analog, Digital, and advanced circuits.
          Solve puzzles, reveal circuits, and compete for the top spot.
        </p>

        <button onClick={() => navigate("/login")} className="btn-primary mt-10">
          Get Started <span className="text-2xl leading-none">→</span>
        </button>
      </div>
    </section>
  );
}
