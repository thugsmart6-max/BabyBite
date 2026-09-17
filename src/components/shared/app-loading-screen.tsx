"use client";

import { cn } from "@/lib/utils";
import { OsBusy } from "@/components/babybite/oats-brand";

export function AppLoadingScreen({ className }: { className?: string }) {
  return (
    <div className={cn("os-load-wrap w-full", className)}>
      <OsBusy />
    </div>
  );
}
