"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { FormField, inputStateClass } from "@/components/forms/form-field";
import { useMotherLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

type PdfStatus = {
  accountEmail: string;
  authProvider: "credentials" | "google" | "apple";
  pdfEmailSent: boolean;
  pdfDeliveryEmail: string | null;
  childProfileId: string | null;
};

type Phase = "idle" | "form" | "sending" | "success" | "error";

function isValidEmailFormat(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function ResultsPdfDownload({
  childProfileId,
  className,
}: {
  childProfileId?: string;
  className?: string;
}) {
  const { t } = useMotherLocale();
  const [status, setStatus] = useState<PdfStatus | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/kidfuel/plans/pdf")
      .then((res) => (res.ok ? res.json() : null))
      .then((json: PdfStatus | null) => {
        if (cancelled || !json) return;
        setStatus(json);
        setEmail(json.accountEmail ?? "");
        if (json.pdfEmailSent) setPhase("success");
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshStatus() {
    const res = await fetch("/api/kidfuel/plans/pdf");
    if (!res.ok) return;
    const json: PdfStatus = await res.json();
    setStatus(json);
    setEmail(json.accountEmail ?? "");
    if (json.pdfEmailSent) setPhase("success");
  }

  const isOAuth = status?.authProvider === "google" || status?.authProvider === "apple";

  const downloadPdf = async () => {
    setError(null);
    setDownloading(true);
    try {
      const res = await fetch("/api/kidfuel/plans/pdf?download=1");
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? t("pdfDownloadFail"));
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const header = res.headers.get("Content-Disposition");
      const match = header?.match(/filename="([^"]+)"/);
      link.href = url;
      link.download = match?.[1] ?? "babybite-plan.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("pdfDownloadFail"));
    } finally {
      setDownloading(false);
    }
  };

  const sendPdf = async (deliveryEmail: string) => {
    if (!isValidEmailFormat(deliveryEmail)) {
      setError(t("invalidEmail"));
      setPhase("form");
      return;
    }

    setPhase("sending");
    setSending(true);
    setError(null);

    const res = await fetch("/api/kidfuel/plans/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: deliveryEmail.trim(),
        childProfileId: childProfileId ?? status?.childProfileId ?? undefined,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? t("pdfDownloadFail"));
      setPhase("form");
      setSending(false);
      return;
    }

    setPhase("success");
    setSending(false);
    setEmail(deliveryEmail.trim().toLowerCase());
    await refreshStatus();
  };

  const alreadySent = Boolean(status?.pdfEmailSent) || phase === "success";
  const mailLabel = alreadySent ? t("resendPdfEmail") : t("sendPdfEmail");
  const knownEmail = status?.pdfDeliveryEmail ?? status?.accountEmail ?? email;

  const handleSendClick = () => {
    setError(null);
    if (alreadySent && isValidEmailFormat(knownEmail)) {
      void sendPdf(knownEmail);
      return;
    }
    if (isOAuth && status?.accountEmail) {
      void sendPdf(status.accountEmail);
      return;
    }
    setPhase("form");
  };

  return (
    <div className={cn("os-pdf-card", className)}>
      <p className="os-band-kicker">{t("fridgePdf")}</p>
      <h2 className="os-section-title">{t("step3")}</h2>
      {phase === "success" ? (
        <p className="os-pdf-copy">{t("pdfSent")}</p>
      ) : (
        <p className="os-pdf-copy">{t("step3Body")}</p>
      )}

      {error ? <p role="alert">{error}</p> : null}

      <div className="os-pdf-actions">
        <button type="button" className="bb-cta" disabled={downloading} onClick={() => void downloadPdf()}>
          {downloading ? t("downloading") : t("downloadPdf")}
        </button>
        <button type="button" className="bb-cta-ghost" disabled={sending} onClick={handleSendClick}>
          {sending ? t("sendingEmail") : mailLabel}
        </button>
      </div>

      {phase === "form" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setTouched(true);
            void sendPdf(email);
          }}
          className="os-field-stack"
          noValidate
        >
          <FormField
            id="pdf-email"
            label={t("email")}
            required
            error={error ?? (touched && !isValidEmailFormat(email) ? t("invalidEmail") : undefined)}
          >
            <Input
              id="pdf-email"
              type="email"
              autoComplete="email"
              value={email}
              readOnly={isOAuth}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              className={cn(inputStateClass(error ?? undefined, touched), isOAuth && "cursor-default")}
              aria-invalid={!!error}
            />
          </FormField>
          <button type="submit" className="bb-cta" disabled={sending}>
            {sending ? t("sendingEmail") : mailLabel}
          </button>
        </form>
      ) : null}
    </div>
  );
}
