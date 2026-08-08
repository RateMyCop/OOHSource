"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const stored =
      (typeof window !== "undefined" &&
        (localStorage.getItem("oohs-theme") as "light" | "dark" | null)) ||
      null;
    if (stored) {
      setTheme(stored);
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("oohs-theme", next);
    } catch (e) {
      /* ignore */
    }
  }

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggle}
      aria-label="Toggle color theme"
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
