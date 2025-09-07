// frontend/src/layouts/RootLayout.jsx
import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";

export default function RootLayout() {
  const { pathname } = useLocation();

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0e1113] text-white font-mono">
      {/* grid background + vignette */}
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0)_40%,rgba(0,0,0,0.55)_100%)] pointer-events-none" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* top bar (same everywhere) */}
        <header className="px-6 sm:px-10 py-4 flex items-center justify-between">
          {/* left brand */}
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.6)]" />
            <span className="text-sm tracking-wider text-gray-300">ElectroMatrix</span>
          </Link>

          {/* right side: nav + NISB logo */}
          <div className="flex items-center gap-6">
            <nav className="hidden sm:flex items-center gap-4 text-xs text-gray-400">
              <Link
                to="/"
                className={pathname === "/" ? "text-teal-300" : ""}
              >
                Home
              </Link>
              <Link
                to="/login"
                className={pathname.startsWith("/login") ? "text-teal-300" : ""}
              >
                Login
              </Link>
              <Link
                to="/quiz"
                className={pathname.startsWith("/quiz") ? "text-teal-300" : ""}
              >
                Quiz
              </Link>
            </nav>

            {/* NISB logo (public/images/nisb-logo.png) */}
            <a
              href="https://nisb.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <img
                src="/images/nisb-logo.png"
                alt="NISB Logo"
                className="h-8 w-auto object-contain"
              />
            </a>
          </div>
        </header>

        {/* page body */}
        <div className="flex-1 px-6 sm:px-10">
          <Outlet />
        </div>

        {/* footer */}
        <footer className="px-6 sm:px-10 py-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} ElectroMatrix · NISB
        </footer>
      </div>
    </main>
  );
}
