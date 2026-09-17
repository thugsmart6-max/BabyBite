"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
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

function subscribeLang(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("babybite-lang-change", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("babybite-lang-change", onStoreChange);
  };
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore<MotherLang>(subscribeLang, readStoredLang, () => "en");

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
  }, [lang]);

  const setLang = useCallback((next: MotherLang) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event("babybite-lang-change"));
  }, []);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (key: MotherCopyKey) => motherCopy(lang, key),
    }),
    [lang, setLang]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useMotherLocale() {
  return useContext(LocaleContext);
}
