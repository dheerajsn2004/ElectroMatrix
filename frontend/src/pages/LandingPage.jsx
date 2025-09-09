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
    <p className="text-xl sm:text-3xl text-gray-300/90 tracking-wide">
      🌑 The city is in darkness. The ElectroMatrix has gone silent.  
      And only you can bring it back.
    </p>

    <p className="mt-6 text-base sm:text-lg text-gray-400 leading-8">
      The grids are fractured. Signals are lost. Circuits are unstable.  
      Every puzzle you solve reignites the city’s heartbeat.  
      Step in, restore the layers, and awaken the ElectroMatrix.  
      The city is waiting. Its revival depends on you — are you ready to spark it to life?
    </p>

    <button onClick={() => navigate("/login")} className="btn-primary mt-10">
      Get Started <span className="text-2xl leading-none">→</span>
    </button>
  </div>
</div>




    </section>
  );
}
