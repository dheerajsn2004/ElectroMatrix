import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");

    // ✅ Make sure any previous user's section state is gone
    try { localStorage.removeItem("activeSection"); } catch {}

    try {
      const res = await api.post("/login", { username, password });

      // Store only the team; section will always start at 1 in QuizPage
      localStorage.setItem("team", JSON.stringify(res.data.team));

      navigate("/quiz");
    } catch (err) {
      setMessage(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <section className="page-shell flex items-center justify-center">
      <div className="w-full max-w-md card flex flex-col items-center">
        {/* Centered title */}
        <h1 className="text-2xl font-medium text-teal-400 mb-6 text-center">
          Matrix Credentials
        </h1>

        <form onSubmit={submit} className="w-full space-y-4">
          <input
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="btn-primary w-full flex items-center justify-center text-center"
          >
            Login
          </button>
        </form>

        {message && <p className="mt-4 text-center text-red-300">{message}</p>}
      </div>
    </section>
  );
}
