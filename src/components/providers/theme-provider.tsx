"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: Theme;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored =
    window.localStorage.getItem("babybite-theme") ?? window.localStorage.getItem("kidfuel-theme");
  return stored === "dark" ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredTheme();
    applyTheme(stored);
    const frame = window.requestAnimationFrame(() => {
      setThemeState(stored);
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    applyTheme(theme);
    localStorage.setItem("babybite-theme", theme);
    localStorage.removeItem("kidfuel-theme");
  }, [theme, hydrated]);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    localStorage.setItem("babybite-theme", next);
    localStorage.removeItem("kidfuel-theme");
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme: theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
