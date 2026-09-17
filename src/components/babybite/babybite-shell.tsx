"use client";

import type { ReactNode } from "react";
import { BbCanvas } from "@/components/babybite/bb-canvas";
import { MealPack } from "@/components/babybite/oats-brand";

export function BabyBiteShell({
  title = "What's for dinner?",
  left,
  right,
  children,
  chips,
  chipInteractive,
  dinnerFirst = false,
  className,
}: {
  title?: string;
  left?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
  chips?: string[];
  chipInteractive?: boolean;
  dinnerFirst?: boolean;
  className?: string;
}) {
  return (
    <BbCanvas
      title={title}
      chips={chips}
      chipInteractive={chipInteractive}
      dinnerFirst={dinnerFirst}
      className={className}
      left={
        left ?? (
          <div className="os-hero-pack">
            <MealPack name="Ages 4–12" slot="Fridge PDF" tone="sage" note="Indian meals for the school-age table." lift={false} />
          </div>
        )
      }
      right={right ?? children}
    />
  );
}
