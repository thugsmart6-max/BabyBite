"use client";

import { cn } from "@/lib/utils";
import { useMotherLocale } from "@/components/providers/locale-provider";
import type { MotherCopyKey } from "@/lib/mother-copy";
import { growthBandForAge } from "@/lib/growth-bands";

export const SAMPLE_PACKS = [
  { name: "Egg dosa", slotKey: "dinnerIs" as const, tone: "yellow" },
  { name: "Ragi idli", slotKey: "breakfast" as const, tone: "sage" },
  { name: "Rajma rice", slotKey: "lunch" as const, tone: "cocoa" },
  { name: "Banana lassi", slotKey: "snack" as const, tone: "pink" },
  { name: "Paneer paratha", slotKey: "dinnerIs" as const, tone: "sky" },
  { name: "Sambar rice", slotKey: "lunch" as const, tone: "forest" },
] as const;

export type PackTone = (typeof SAMPLE_PACKS)[number]["tone"] | "cream" | "saffron";

const STICKER_KEYS: { textKey: MotherCopyKey; className: string }[] = [
  { textKey: "stickerTonight", className: "os-sticker is-yellow os-p1" },
  { textKey: "stickerAges", className: "os-sticker is-sage os-p2" },
  { textKey: "stickerKitchen", className: "os-sticker is-pink os-p3" },
  { textKey: "stickerFridge", className: "os-sticker is-sky os-p4" },
  { textKey: "stickerSimple", className: "os-sticker is-sage os-p5" },
  { textKey: "stickerProtein", className: "os-sticker is-cocoa os-p6" },
  { textKey: "stickerPicky", className: "os-sticker is-yellow os-p7" },
  { textKey: "stickerSchool", className: "os-sticker is-forest os-p8" },
  { textKey: "stickerSeven", className: "os-sticker is-saffron os-p9" },
  { textKey: "stickerGrains", className: "os-sticker is-cream os-p10" },
  { textKey: "stickerRegion", className: "os-sticker is-pink os-p11" },
  { textKey: "stickerDinnerQ", className: "os-sticker is-yellow os-p12" },
];

export function BrandStickers() {
  const { t } = useMotherLocale();
  return (
    <section className="os-stickers" aria-hidden>
      {STICKER_KEYS.map((item, i) => (
        <span key={item.textKey} className={item.className} style={{ animationDelay: `${i * 0.18}s` }}>
          {t(item.textKey)}
        </span>
      ))}
    </section>
  );
}

export function SiteArt({
  src,
  alt,
  variant = "tiffin",
  priority = false,
}: {
  src: string;
  alt: string;
  variant?: "tiffin" | "wide" | "nutrients" | "mark" | "compare";
  priority?: boolean;
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={1254}
      height={1254}
      className={cn("os-site-art", `is-${variant}`)}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "low"}
    />
  );
}

export function MealPack({
  name,
  slot,
  tone = "yellow",
  size = "md",
  note,
  lift = true,
}: {
  name: string;
  slot?: string;
  tone?: PackTone;
  size?: "md" | "lg";
  note?: string;
  lift?: boolean;
}) {
  return (
    <article className={cn("os-pack", `is-${tone}`, size === "lg" && "is-lg", !lift && "is-static")}>
      <p className="os-pack-brand">BabyBite</p>
      {slot ? <p className="os-pack-slot">{slot}</p> : null}
      <h2 className="os-pack-name">{name}</h2>
      {note ? <p className="os-pack-note">{note}</p> : null}
    </article>
  );
}

export function MealShelf({
  items,
  lift = true,
}: {
  items: { name: string; slot?: string; tone?: PackTone; note?: string }[];
  lift?: boolean;
}) {
  return (
    <div className="os-shelf" role="list">
      {items.map((item) => (
        <div key={`${item.slot}-${item.name}`} role="listitem">
          <MealPack name={item.name} slot={item.slot} tone={item.tone} note={item.note} lift={lift} />
        </div>
      ))}
    </div>
  );
}

export function MealMarquee() {
  const { t } = useMotherLocale();
  const copies = [0, 1, 2];
  return (
    <div className="os-marquee" aria-hidden>
      <div className="os-marquee-track">
        {copies.map((copy) => (
          <div className="os-marquee-set" key={copy}>
            {SAMPLE_PACKS.map((item) => (
              <MealPack
                key={`${copy}-${item.name}`}
                name={item.name}
                slot={t(item.slotKey)}
                tone={item.tone}
                lift={false}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BondTable() {
  const { t } = useMotherLocale();
  return (
    <section className="os-bond" id="together">
      <p className="os-band-kicker">{t("bondKicker")}</p>
      <h2 className="os-section-title">{t("bondTitle")}</h2>
      <p className="os-bond-copy">{t("bondBody")}</p>
      <div className="os-bond-art" aria-hidden>
        <div className="os-bond-figure is-mom">
          <span className="os-bond-head" />
          <span className="os-bond-torso" />
        </div>
        <div className="os-bond-figure is-kid">
          <span className="os-bond-head" />
          <span className="os-bond-torso" />
        </div>
        <div className="os-bond-bench" />
        <div className="os-bond-plate" />
        <span className="os-sticker is-pink os-bond-heart">{t("bondTag")}</span>
      </div>
    </section>
  );
}

export function CompareTables({
  achieved = false,
  childName,
}: {
  achieved?: boolean;
  childName?: string;
}) {
  const { t } = useMotherLocale();
  return (
    <section className="os-compare" id="compare">
      <p className="os-band-kicker">{achieved ? t("yourKitchen") : t("compareKicker")}</p>
      <h2 className="os-section-title">{achieved ? t("growthTitle") : t("compareTitle")}</h2>
      <p className="os-bond-copy">{achieved ? t("growthBody") : t("compareBody")}</p>
      <SiteArt src="/art-mark.png" alt={t("artMark")} variant="mark" />
      <div className="os-compare-grid">
        <article className="os-compare-card is-other">
          <p className="os-band-kicker">{t("otherTable")}</p>
          <ul>
            <li>{t("otherLine1")}</li>
            <li>{t("otherLine2")}</li>
            <li>{t("otherLine3")}</li>
          </ul>
        </article>
        <article className="os-compare-card is-ours">
          <p className="os-band-kicker">{t("thisTable")}</p>
          <ul>
            <li>{childName ? `${childName} · ${t("thisLine1")}` : t("thisLine1")}</li>
            <li>{t("thisLine2")}</li>
            <li>{t("thisLine3")}</li>
          </ul>
        </article>
      </div>
      <p className="os-compare-note">{t("compareNote")}</p>
    </section>
  );
}

export function GrowthBoard({
  ageYears,
  heightCm,
  weightKg,
}: {
  ageYears: number;
  heightCm?: number;
  weightKg?: number;
}) {
  const { t } = useMotherLocale();
  const band = growthBandForAge(ageYears);
  return (
    <section className="os-growth">
      <p className="os-band-kicker">{t("growthKicker")}</p>
      <h2 className="os-section-title">{t("growthTitle")}</h2>
      <p className="os-bond-copy">{t("growthBody")}</p>
      <div className="os-growth-grid">
        <article className="os-growth-card">
          <p className="os-band-kicker">{t("usualHeight")}</p>
          <h3>{band.heightCm}</h3>
          {heightCm ? (
            <p>
              {t("measured")}: {heightCm} cm
            </p>
          ) : null}
        </article>
        <article className="os-growth-card">
          <p className="os-band-kicker">{t("usualWeight")}</p>
          <h3>{band.weightKg}</h3>
          {weightKg ? (
            <p>
              {t("measured")}: {weightKg} kg
            </p>
          ) : null}
        </article>
        <article className="os-growth-card is-yellow">
          <p className="os-band-kicker">{t("energyPlate")}</p>
          <h3>{t("proteinPlate")}</h3>
          <p>{t("calciumPlate")}</p>
        </article>
      </div>
      <p className="os-compare-note">{t("noExtraCm")}</p>
    </section>
  );
}

export function OsBusy({ note }: { note?: string }) {
  const { t } = useMotherLocale();
  return (
    <section className="os-results-hero os-results-empty">
      <p className="os-band-kicker">{t("tonight")}</p>
      <h1 className="os-hero-title">{t("whatsDinner")}</h1>
      <MealPack
        name={t("writingPlate")}
        slot={t("tonight")}
        tone="yellow"
        size="lg"
        note={note ?? t("writingDinner")}
        lift={false}
      />
    </section>
  );
}
