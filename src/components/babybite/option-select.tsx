"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type OptionItem = {
  value: string;
  label: string;
  hint?: string;
  mark?: string;
  tone?: "yellow" | "sage" | "pink" | "sky" | "cocoa" | "cream";
};

export function OptionGrid({
  options,
  value,
  onChange,
  multiple = false,
  columns = 2,
}: {
  options: OptionItem[];
  value: string | string[];
  onChange: (value: string) => void;
  multiple?: boolean;
  columns?: 1 | 2 | 3;
}) {
  const selected = multiple ? (value as string[]) : [value as string];

  return (
    <div
      className={cn(
        "os-choice-grid",
        columns === 1 && "is-1",
        columns === 2 && "is-2",
        columns === 3 && "is-3"
      )}
    >
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={isSelected}
            className={cn("os-choice", isSelected && "is-on")}
          >
            {opt.mark ? (
              <span className={cn("os-choice-mark", opt.tone && `is-${opt.tone}`)}>{opt.mark}</span>
            ) : null}
            <span className="os-choice-copy">
              <span className="os-choice-label">{opt.label}</span>
              {opt.hint ? <span className="os-choice-hint">{opt.hint}</span> : null}
            </span>
            {isSelected ? <Check className="os-choice-check" strokeWidth={3} /> : null}
          </button>
        );
      })}
    </div>
  );
}

export function GoalCard({
  label,
  subtitle,
  description,
  selected,
  onSelect,
}: {
  label: string;
  subtitle?: string;
  description: string;
  tags?: string[];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button type="button" onClick={onSelect} aria-pressed={selected} className={cn("os-choice os-goal", selected && "is-on")}>
      <span className="os-choice-copy">
        {subtitle ? <span className="os-choice-kicker">{subtitle}</span> : null}
        <span className="os-choice-label">{label}</span>
        <span className="os-choice-hint">{description}</span>
      </span>
    </button>
  );
}

export function AgePicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (age: number) => void;
}) {
  return (
    <div className="os-age-grid">
      {[4, 5, 6, 7, 8, 9, 10, 11, 12].map((age) => (
        <button
          key={age}
          type="button"
          onClick={() => onChange(age)}
          aria-pressed={value === age}
          aria-label={`Age ${age}`}
          className={cn("os-age", value === age && "is-on")}
        >
          {age}
        </button>
      ))}
    </div>
  );
}
