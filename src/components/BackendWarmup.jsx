

import { useEffect } from "react";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://parth-portfolio-r152.onrender.com"
).replace(/\/$/, "");

export default function BackendWarmup() {
  useEffect(() => {
    fetch(`${API_URL}/health`, {
      method: "GET",
      cache: "no-store",
    }).catch(() => {
      console.log("PARTH.AI backend is starting...");
    });
  }, []);

  return null;
}
