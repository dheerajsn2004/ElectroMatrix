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
              text-gray-100
              drop-shadow-[0_0_10px_rgba(0,0,0,0.6)]
            "
          >
            Neovatra's Verdict
          </h1>

          {/* Victory Quote */}
          <p className="fade-in-delayed mt-6 text-lg sm:text-xl text-gray-100 drop-shadow-[0_0_12px_rgba(0,0,0,0.7)] tracking-wide text-center">
            “The blackout is over. The city stands because you dared.”
          </p>

          {/* Blurb */}
          <p className="fade-in-delayed mt-4 max-w-3xl mx-auto text-base sm:text-lg text-gray-100 leading-7 sm:leading-8 drop-shadow-[0_0_12px_rgba(0,0,0,0.6)] text-center">
            Layer by layer, the <span className="text-white font-semibold drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]">ElectroMatrix</span> has awakened. Signals have been restored, logic has been rebuilt, and circuits are alive!  
            <br /><br />
            The city is radiant again! Its skyline is blazing against the dark!  
            <br />
            And for that,<br></br> <span className="text-white/90 font-semibold text-lg sm:text-xl drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]">Neovatra thanks you.</span>
          </p>
      </div>
    </section>
  );
}
