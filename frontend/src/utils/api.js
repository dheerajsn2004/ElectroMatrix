import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Attach team username from localStorage to each request
api.interceptors.request.use((config) => {
  try {
    const team = JSON.parse(localStorage.getItem("team") || "null");
    if (team?.username) {
      config.headers["x-team-username"] = team.username;
    }
  } catch {}
  return config;
});
