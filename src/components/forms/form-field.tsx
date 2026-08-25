"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  id?: string;
  label: string;
  error?: string;
  hint?: string;
  success?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  id,
  label,
  error,
  hint,
  success,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label
        htmlFor={id}
        className={cn(
          "text-sm font-semibold transition-colors",
          error && "text-destructive",
          success && !error && "text-success-foreground"
        )}
      >
        {label}
        {required && (
          <span className="ml-1 text-accent" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {children}
      {error ? (
        <p
          role="alert"
          className="flex items-start gap-1.5 text-xs font-medium text-destructive animate-in fade-in slide-in-from-top-1"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : success ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-success-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          {success}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function FormErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive flex items-start gap-2"
    >
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      {message}
    </div>
  );
}

export function inputStateClass(error?: string, touched?: boolean) {
  return cn(
    touched && error && "border-destructive ring-destructive/20 focus-visible:border-destructive focus-visible:ring-destructive/30",
    touched && !error && "border-success/40 focus-visible:border-success focus-visible:ring-success/20"
  );
}
