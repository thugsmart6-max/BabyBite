"use client";

import type { ReactNode } from "react";
import { useMotherLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

const STROKE = "#111";
const CREAM = "#f7efe0";
const YELLOW = "#ffd54a";
const SAGE = "#b8d4b8";
const SKY = "#a8d4f0";
const PINK = "#f5c4d4";

function SceneFrame({
  title,
  caption,
  children,
  className,
}: {
  title: string;
  caption: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <figure className={cn("os-art-compare-scene", className)}>
      <svg
        viewBox="0 0 320 220"
        className="os-art-compare-svg"
        role="img"
        aria-labelledby={`art-caption-${title.replace(/\s/g, "-")}`}
      >
        {children}
      </svg>
      <figcaption id={`art-caption-${title.replace(/\s/g, "-")}`}>
        <p className="os-art-compare-scene-kicker">{title}</p>
        <p className="os-art-compare-scene-caption">{caption}</p>
      </figcaption>
    </figure>
  );
}

function ParkScene() {
  return (
    <>
      <rect x="0" y="0" width="320" height="220" fill={CREAM} />
      <ellipse cx="160" cy="200" rx="150" ry="28" fill={SAGE} opacity="0.45" />
      <rect x="24" y="120" width="48" height="72" rx="8" fill={YELLOW} stroke={STROKE} strokeWidth="3" />
      <path d="M48 120 Q72 72 96 120" fill="none" stroke={STROKE} strokeWidth="3" />
      <line x1="72" y1="88" x2="72" y2="108" stroke={STROKE} strokeWidth="3" />
      <rect x="248" y="132" width="36" height="8" rx="4" fill={SKY} stroke={STROKE} strokeWidth="2.5" />
      <line x1="266" y1="108" x2="266" y2="132" stroke={STROKE} strokeWidth="3" />
      {/* taller child */}
      <circle cx="200" cy="118" r="14" fill="#ffe0bd" stroke={STROKE} strokeWidth="2.5" />
      <rect x="192" y="132" width="16" height="36" rx="6" fill={SKY} stroke={STROKE} strokeWidth="2.5" />
      <line x1="200" y1="168" x2="194" y2="188" stroke={STROKE} strokeWidth="2.5" />
      <line x1="200" y1="168" x2="206" y2="188" stroke={STROKE} strokeWidth="2.5" />
      {/* happy child */}
      <circle cx="130" cy="128" r="13" fill="#ffe0bd" stroke={STROKE} strokeWidth="2.5" />
      <path d="M124 128 Q130 134 136 128" fill="none" stroke={STROKE} strokeWidth="2" />
      <rect x="122" y="141" width="16" height="30" rx="6" fill={PINK} stroke={STROKE} strokeWidth="2.5" />
      <line x1="130" y1="171" x2="125" y2="188" stroke={STROKE} strokeWidth="2.5" />
      <line x1="130" y1="171" x2="138" y2="186" stroke={STROKE} strokeWidth="2.5" />
      {/* mother observing */}
      <circle cx="88" cy="108" r="16" fill="#ffe0bd" stroke={STROKE} strokeWidth="2.5" />
      <path d="M82 106 Q88 100 94 106" fill="none" stroke={STROKE} strokeWidth="2" />
      <ellipse cx="88" cy="138" rx="18" ry="22" fill={YELLOW} stroke={STROKE} strokeWidth="2.5" />
      <path d="M70 148 L88 132 L106 148" fill="none" stroke={STROKE} strokeWidth="2" />
    </>
  );
}

function RelativeScene() {
  return (
    <>
      <rect x="0" y="0" width="320" height="220" fill={CREAM} />
      <rect x="16" y="24" width="288" height="172" rx="20" fill="#fff" stroke={STROKE} strokeWidth="2.5" />
      <circle cx="72" cy="88" r="18" fill="#ffe0bd" stroke={STROKE} strokeWidth="2.5" />
      <ellipse cx="72" cy="128" rx="22" ry="26" fill={SAGE} stroke={STROKE} strokeWidth="2.5" />
      <circle cx="160" cy="96" r="15" fill="#ffe0bd" stroke={STROKE} strokeWidth="2.5" />
      <rect x="150" y="111" width="20" height="34" rx="6" fill={PINK} stroke={STROKE} strokeWidth="2.5" />
      <circle cx="232" cy="82" r="17" fill="#ffe0bd" stroke={STROKE} strokeWidth="2.5" />
      <ellipse cx="232" cy="122" rx="20" ry="24" fill={SKY} stroke={STROKE} strokeWidth="2.5" />
      <path
        d="M218 100 Q200 92 188 108"
        fill="none"
        stroke={STROKE}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <ellipse cx="248" cy="98" rx="22" ry="14" fill="#fff" stroke={STROKE} strokeWidth="2" />
      <text x="248" y="102" textAnchor="middle" fontSize="10" fill={STROKE} fontFamily="system-ui,sans-serif">
        ?
      </text>
      <path d="M68 108 Q58 118 62 128" fill="none" stroke={STROKE} strokeWidth="2" opacity="0.6" />
    </>
  );
}

function WorryScene() {
  return (
    <>
      <rect x="0" y="0" width="320" height="220" fill={CREAM} />
      <rect x="20" y="32" width="120" height="156" rx="12" fill="#fff" stroke={STROKE} strokeWidth="2.5" />
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={i}
          x1="36"
          y1={52 + i * 24}
          x2="124"
          y2={52 + i * 24}
          stroke={STROKE}
          strokeWidth="1.5"
          opacity="0.25"
        />
      ))}
      <rect x="44" y="48" width="8" height="112" fill={YELLOW} stroke={STROKE} strokeWidth="2" />
      <circle cx="72" cy="100" r="5" fill={PINK} stroke={STROKE} strokeWidth="1.5" />
      <ellipse cx="200" cy="108" rx="26" ry="30" fill={YELLOW} stroke={STROKE} strokeWidth="2.5" />
      <circle cx="200" cy="78" r="18" fill="#ffe0bd" stroke={STROKE} strokeWidth="2.5" />
      <path d="M192 74 Q200 68 208 74" fill="none" stroke={STROKE} strokeWidth="2" />
      <ellipse cx="168" cy="62" rx="20" ry="14" fill="#fff" stroke={STROKE} strokeWidth="2" />
      <ellipse cx="232" cy="58" rx="18" ry="12" fill="#fff" stroke={STROKE} strokeWidth="2" />
      <circle cx="248" cy="168" r="14" fill="#ffe0bd" stroke={STROKE} strokeWidth="2.5" />
      <rect x="238" y="182" width="20" height="22" rx="5" fill={SKY} stroke={STROKE} strokeWidth="2" />
      <rect x="268" y="150" width="36" height="28" rx="8" fill={SAGE} stroke={STROKE} strokeWidth="2" />
      <circle cx="278" cy="158" r="4" fill={YELLOW} stroke={STROKE} strokeWidth="1" />
      <circle cx="292" cy="162" r="4" fill={PINK} stroke={STROKE} strokeWidth="1" />
    </>
  );
}

export function ArtCompareStory() {
  const { t } = useMotherLocale();

  return (
    <div className="os-art-compare-story" aria-label={t("artCompare")}>
      <div className="os-art-compare-flow">
        <SceneFrame title={t("artCompareScenePark")} caption={t("artCompareBridgePark")}>
          <ParkScene />
        </SceneFrame>
        <span className="os-art-compare-arrow" aria-hidden>
          ↓
        </span>
        <SceneFrame title={t("artCompareSceneRelative")} caption={t("artCompareBridgeRelative")}>
          <RelativeScene />
        </SceneFrame>
        <span className="os-art-compare-arrow" aria-hidden>
          ↓
        </span>
        <SceneFrame title={t("artCompareSceneWorry")} caption={t("artCompareBridgeWorry")}>
          <WorryScene />
        </SceneFrame>
      </div>
    </div>
  );
}
