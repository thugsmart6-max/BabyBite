"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, showTagline = false, size = "md" }: LogoProps) {
  const sizes = {
    sm: { text: "text-base", tagline: "text-[0.6rem]" },
    md: { text: "text-lg", tagline: "text-[0.65rem]" },
    lg: { text: "text-2xl", tagline: "text-xs" },
  };

  return (
    <Link href="/landing" className={cn("inline-flex flex-col group", className)}>
      <span
        className={cn(
          "font-sans font-medium tracking-tight text-foreground group-hover:opacity-70 transition-opacity duration-300",
          sizes[size].text
        )}
      >
        BabyBite
      </span>
      {showTagline && (
        <span className={cn("label-caps mt-0.5", sizes[size].tagline)}>
          Nutrition for children 4–12
        </span>
      )}
    </Link>
  );
}
