"use client";

import { Logo } from "@/components/shared/logo";
import { BbCanvas } from "@/components/kidfuel/bb-canvas";
import { SiteArt } from "@/components/kidfuel/oats-brand";

export function BlimpFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className={compact ? "border-t border-border pt-6 mt-8 px-4" : "site-footer"}>
      <div className="mx-auto max-w-7xl flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Logo size="sm" />
          {!compact && (
            <p className="site-footer-tagline mt-3">Nutrition for mothers of kids 4–12</p>
          )}
        </div>
        <p className="site-footer-tagline max-w-xs leading-relaxed">
          {compact
            ? "Educational guidance only"
            : "This app provides educational nutrition guidance and is not a substitute for professional medical advice."}
        </p>
      </div>
    </footer>
  );
}

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <BbCanvas full className="os-auth">
      <section className="os-auth-grid">
        <div className="os-auth-form">
          <p className="os-band-kicker">{subtitle}</p>
          <h1 className="os-auth-title">{title}</h1>
          {children}
        </div>
        <div className="os-auth-pack" aria-hidden>
          <SiteArt src="/art-tiffin.png" alt="" variant="tiffin" />
        </div>
      </section>
    </BbCanvas>
  );
}
