import React from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <section className="page-shell text-center">
<div className="relative min-h-screen flex flex-col items-center justify-center text-center px-4">
  {/* ElectroMatrix heading (always centered at start) */}
  <h1
    className="
      kelly-slab-regular
      leading-tight
      tracking-[0.05em] sm:tracking-[0.1em] md:tracking-[0.15em]

      text-[clamp(3rem,7vw,6rem)] sm:text-[clamp(4rem,6vw,7rem)] md:text-[clamp(5rem,5vw,8rem)]
    "
  >
    <span className="dying-neon block">
      ElectroMatrix
    </span>
  </h1>

  {/* Rest of text (fades in after flicker) */}
  <div className="animate-fadeInDelayed mt-8 max-w-3xl">
   {/* Heroic Intro */}
    <p className="text-xl sm:text-2xl text-white tracking-wide text-center font-semibold kelly-slab-regular">
      So, you dared…
    </p>

    <p className="mt-2 text-lg sm:text-xl text-gray-200 font-semibold text-center leading-snug">
      Welcome! Neovatra has been waiting for its heroes.
    </p>

    {/* The Blackout */}
    <p className="mt-4 text-sm sm:text-base text-gray-400 leading-6 sm:leading-7">
      The ElectroMatrix, the city’s power backbone, has failed. Critical data is lost!  
      The blackout holds strong.
    </p>

    {/* Mission */}
    <p className="mt-3 text-sm sm:text-base text-gray-400 leading-6 sm:leading-7">
      Your mission is simple and brutal: dive into each grid, restore the correct information, and unlock the layer.  
      After each unlock, analyze the network and fully repair that layer.
    </p>

    <p className="mt-3 text-sm sm:text-base text-gray-400 leading-6 sm:leading-7">
      Three layers stand in your way!
    </p>

    {/* Call to Action */}
    <p className="mt-4 text-sm sm:text-base text-gray-100 font-medium leading-6 sm:leading-7">
      The city has placed its trust in you.  
      Revive it… if you can.
    </p>



    <button
      onClick={() => navigate("/login")}
      className="btn-primary px-5 py-3 mt-6 text-base sm:text-base"
    >
      Access Matrix 
    </button>
  </div>
</div>




    </section>
  );
}

