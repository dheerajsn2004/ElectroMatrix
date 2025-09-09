import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function ThankYou() {
  const navigate = useNavigate();

  return (
    <section
      className="page-shell text-center relative"
      style={{
        backgroundImage: `url('/Success.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="mx-auto max-w-4xl p-8">
        {/* Title */}
        <h1
          className="
            kelly-slab-regular
            text-center
            leading-tight
            tracking-[0.05em] sm:tracking-[0.1em] md:tracking-[0.15em]
            text-[clamp(2.5rem,7vw,4.5rem)] sm:text-[clamp(3rem,6vw,5.5rem)] md:text-[clamp(3.5rem,5vw,6rem)]
            white-revival
          "
        >
          Thank You!
        </h1>

        {/* Quote */}
        <p className="fade-in-delayed mt-6 text-xl sm:text-2xl text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.7)] tracking-wide">
          “Circuits don’t just carry current — they carry curiosity.”
        </p>

        {/* Blurb */}
        <p className="fade-in-delayed mt-6 max-w-3xl mx-auto text-base sm:text-lg text-gray-200 leading-8 drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]">
          You cracked the grids, revealed the circuits, and conquered the challenge.  
          Thanks for being a part of{" "}
          <span className="text-teal-300 drop-shadow-[0_0_12px_rgba(45,212,191,0.7)]">
            ElectroMatrix
          </span>{" "}
          by{" "}
          <span className="text-teal-300 drop-shadow-[0_0_12px_rgba(45,212,191,0.7)]">
            NISB
          </span>
          . See you at the next spark!
        </p>
      </div>
    </section>
  );
}
