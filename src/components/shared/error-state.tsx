"use client";

import { useMotherLocale } from "@/components/providers/locale-provider";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  const { t } = useMotherLocale();
  return (
    <div className="os-results-empty">
      <p className="os-band-kicker">{t("holdOn")}</p>
      <h3 className="os-section-title">{title ?? t("couldNotLoad")}</h3>
      <p className="os-onboard-lede">{message ?? t("couldNotLoad")}</p>
      {onRetry ? (
        <button type="button" className="bb-cta" onClick={onRetry}>
          {t("tryAgain")}
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="os-results-empty">
      <Icon className="h-8 w-8 mx-auto mb-4" />
      <h3 className="os-section-title">{title}</h3>
      <p className="os-onboard-lede">{description}</p>
      {action}
    </div>
  );
}
