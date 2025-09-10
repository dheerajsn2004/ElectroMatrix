import React from "react";
export default function AttemptUnsuccessful() {
  return (
    <section
      className="page-shell text-center relative min-h-screen flex items-center justify-center"
      style={{
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="mx-auto max-w-md p-6 sm:p-8">
        {/* Title */}
       <h1
          className="kelly-slab-regular flicker-unsuccessful
            text-center
            leading-tight
            tracking-wide
            sm:tracking-wider
            text-[clamp(2rem,6vw,4rem)] sm:text-[clamp(2.5rem,5vw,5rem)]"
          style={{
            color: "#FF6E5F", // Softer, warm red
            textShadow: "0 0 8px rgba(255,110,95,0.5)",
          }}
        >
          Neovatra's Verdict
        </h1>

        {/* Quote */}
        <p
          className="fade-in-delayed mt-4 text-base sm:text-lg leading-relaxed drop-shadow-[0_0_6px_rgba(255,140,120,0.5)] text-center"
          style={{ color: "#FFA08C" }}
        >
          The ElectroMatrix remains sealed, and Novatra still waits in the dark…
        </p>

        {/* Blurb */}
        <p
          className="fade-in-delayed mt-4 text-sm sm:text-base leading-relaxed drop-shadow-[0_0_6px_rgba(255,180,160,0.5)] text-center"
          style={{ color: "#FFB49A" }}
        >
          You may not have restored the city this time, yet every step you took brought you closer to understanding its grids.  
          <br /><br />
          The city will await revivers again. Perhaps next time, it will be you who brings Novatra back to light.
        </p>
      </div>
    </section>
  );
}
