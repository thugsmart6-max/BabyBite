"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

type Theme = "light";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: Theme;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  resolvedTheme: "light",
});

function lockLight() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("dark");
  root.classList.add("light");
  root.style.colorScheme = "light";
  try {
    window.localStorage.setItem("babybite-theme", "light");
  } catch {
    /* private mode */
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    lockLight();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "light", resolvedTheme: "light" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
