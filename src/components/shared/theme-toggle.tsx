"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { useMotherLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  showLabel?: boolean;
};

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useMotherLocale();
  const isDark = resolvedTheme === "dark";

  if (!showLabel) {
    return (
      <button
        type="button"
        className={cn("theme-toggle is-solo", className)}
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? t("lightMode") : t("darkMode")}
        title={isDark ? t("lightMode") : t("darkMode")}
      >
        {isDark ? <Sun className="is-sun" strokeWidth={2.6} /> : <Moon className="is-moon" strokeWidth={2.6} />}
      </button>
    );
  }

  return (
    <div className={cn("theme-toggle", className)}>
      <button
        type="button"
        className={cn("theme-toggle-btn", !isDark && "is-on")}
        onClick={() => setTheme("light")}
        aria-pressed={!isDark}
        aria-label={t("lightMode")}
        title={t("lightMode")}
      >
        <Sun strokeWidth={2.6} />
        <span>{t("lightMode")}</span>
      </button>
      <button
        type="button"
        className={cn("theme-toggle-btn", isDark && "is-on")}
        onClick={() => setTheme("dark")}
        aria-pressed={isDark}
        aria-label={t("darkMode")}
        title={t("darkMode")}
      >
        <Moon strokeWidth={2.6} />
        <span>{t("darkMode")}</span>
      </button>
    </div>
  );
}
