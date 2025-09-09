import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import "./RootLayout.css";

export default function RootLayout() {
  const { pathname } = useLocation();
  const [loginSelected, setLoginSelected] = useState(false);
  const [loginBlink, setLoginBlink] = useState(false);

  const handleLoginClick = () => {
    if (!loginSelected) {
      // Trigger blink animation
      setLoginBlink(true);
      setTimeout(() => {
        setLoginBlink(false);
        setLoginSelected(true); // keep it lit after blinking
      }, 1500); // duration of blink animation
    }
  };

  // ✅ Conditional background for thank-you page
  const backgroundImage =
    pathname === "/thank-you"
      ? "url('/images/Success.png')" // replace with your actual bg image
      : "url('/images/darkbg.png')";

  // ✅ Conditional overlay opacity
  const overlayClass =
    pathname === "/thank-you" ? "bg-black/40" : "bg-black/60";

  return (
    <main className="min-h-screen relative overflow-hidden text-white font-mono">
      {/* background */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage }}
      />
      <div className={`absolute inset-0 ${overlayClass} pointer-events-none`} />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* header */}
        <header className="px-4 sm:px-6 md:px-10 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.6)]" />
            <img
              src="/images/nisb-logo.png"
              alt="NISB"
              className="h-8 sm:h-9 md:h-10 w-auto object-contain select-none"
              draggable={false}
            />
            <span
              className="text-sm sm:text-base tracking-wider text-gray-300"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              ElectroMatrix
            </span>
          </Link>
        </header>

        {/* page body */}
        <div className="flex-1 px-4 sm:px-6 md:px-10 mt-4 sm:mt-0">
          <Outlet />
        </div>

        {/* footer */}
        <footer className="px-4 sm:px-6 md:px-10 py-6 text-center text-xs sm:text-sm text-gray-500">
          © {new Date().getFullYear()} ElectroMatrix · NISB
        </footer>
      </div>
    </main>
  );
}
