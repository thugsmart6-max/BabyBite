"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { HTML_LANG, motherCopy, type MotherCopyKey, type MotherLang } from "@/lib/mother-copy";

const STORAGE_KEY = "babybite-lang";

const LocaleContext = createContext<{
  lang: MotherLang;
  setLang: (lang: MotherLang) => void;
  t: (key: MotherCopyKey) => string;
}>({
  lang: "en",
  setLang: () => undefined,
  t: (key) => motherCopy("en", key),
});

function readStoredLang(): MotherLang {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "ta" || stored === "hi" || stored === "en") return stored;
  return "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<MotherLang>("en");

  useEffect(() => {
    const stored = readStoredLang();
    setLangState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
  }, [lang]);

  const setLang = (next: MotherLang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (key: MotherCopyKey) => motherCopy(lang, key),
    }),
    [lang]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useMotherLocale() {
  return useContext(LocaleContext);
}
