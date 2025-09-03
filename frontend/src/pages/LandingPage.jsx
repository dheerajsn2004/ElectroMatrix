import React from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col">
      <section className="flex flex-1 items-center justify-center flex-col text-center px-6 py-12">
        <h1 className="text-5xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-lg animate-pulse">
          ElectroMatrix ⚡
        </h1>
        <p className="mt-6 text-lg md:text-2xl text-gray-300 max-w-2xl">
          Where Innovation Meets Circuits – IEEE presents the ultimate tech showdown.
        </p>
        <Link
          to="/login"
          className="mt-8 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-cyan-500/50 hover:scale-110 transition-all duration-300 inline-block"
        >
          Get Started
        </Link>
      </section>
    </div>
  );
}
