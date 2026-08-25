"use client";

import { MOTHER_LANGS } from "@/lib/mother-copy";
import { useMotherLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

export function LocaleToggle({ className }: { className?: string }) {
  const { lang, setLang, t } = useMotherLocale();

  return (
    <div className={cn("bb-lang", className)} role="group" aria-label={t("language")}>
      {MOTHER_LANGS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={cn("bb-lang-btn", lang === item.id && "is-active")}
          onClick={() => setLang(item.id)}
          aria-pressed={lang === item.id}
          aria-label={item.label}
          title={item.label}
        >
          {item.short}
        </button>
      ))}
    </div>
  );
}
