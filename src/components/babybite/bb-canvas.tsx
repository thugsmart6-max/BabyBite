"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Settings, X } from "lucide-react";
import { LocaleToggle } from "@/components/babybite/locale-toggle";
import { useMotherLocale } from "@/components/providers/locale-provider";
import { translateCta } from "@/lib/mother-copy";
import { cn } from "@/lib/utils";
import { homePathForUser, nextMotherAction } from "@/lib/funnel-gates";
import { endLocalSession } from "@/lib/local-user-store";

export const DEFAULT_CHIPS = [
  "Ages 4–12",
  "PDF",
  "Protein",
  "Indian meals",
  "Picky eater",
];

type MailNested = { kind: "reply" | "room" | "file"; text: string };

export type BbMailItem = {
  initials: string;
  name: string;
  line: string;
  nested?: MailNested | null;
  chip?: string;
};

export function FeatherTopbar({
  tagline,
}: {
  tagline?: string;
}) {
  const pathname = usePathname();
  const { data, status } = useSession();
  const { lang, t } = useMotherLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuScrollY = useRef(0);
  const loggedIn = status === "authenticated";

  useEffect(() => {
    if (!menuOpen) return;
    const { body, documentElement } = document;
    const alreadyLocked = body.style.position === "fixed";
    const fromTop = Math.abs(Number.parseInt(body.style.top || "0", 10)) || 0;
    const measured = alreadyLocked ? fromTop : window.scrollY;
    const scrollY = measured || menuScrollY.current;
    menuScrollY.current = scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
      htmlOverflow: documentElement.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";
    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      body.style.overflow = previous.overflow;
      documentElement.style.overflow = previous.htmlOverflow;
      const restore = menuScrollY.current;
      window.scrollTo(0, restore);
      requestAnimationFrame(() => window.scrollTo(0, restore));
    };
  }, [menuOpen]);
  const homeHref = homePathForUser({
    isLoggedIn: loggedIn,
    onboardingComplete: Boolean(data?.user?.onboardingComplete),
    hasPaid: Boolean(data?.user?.hasPaid),
  });
  const cta = nextMotherAction({
    pathname,
    isLoggedIn: loggedIn,
    onboardingComplete: Boolean(data?.user?.onboardingComplete),
    hasPaid: Boolean(data?.user?.hasPaid),
  });

  const logout = async () => {
    setMenuOpen(false);
    endLocalSession();
    await signOut({ callbackUrl: "/landing" });
  };

  return (
    <header className="os-nav">
      <div className="os-nav-left">
        <button
          type="button"
          className="os-menu-btn"
          aria-label={t("openMenu")}
          aria-expanded={menuOpen}
          onClick={(event) => {
            if (!menuOpen) {
              menuScrollY.current = window.scrollY;
            }
            setMenuOpen((open) => !open);
            event.currentTarget.blur();
          }}
        >
          {menuOpen ? <X strokeWidth={2.4} /> : <Menu strokeWidth={2.4} />}
        </button>
        {cta ? (
          <Link href={cta.href} className="bb-cta">
            {translateCta(lang, cta.label)}
          </Link>
        ) : null}
      </div>
      <Link href={homeHref} className="os-wordmark">
        BabyBite
      </Link>
      <div className="os-nav-right">
        <div className="os-nav-tools">
          <LocaleToggle />
        </div>
        <Link
          href={loggedIn ? "/settings" : "/login"}
          className="os-mascot"
          aria-label={loggedIn ? t("settingsTitle") : t("signIn")}
          title={loggedIn ? t("settingsTitle") : t("signIn")}
        >
          <Settings strokeWidth={2.2} />
        </Link>
      </div>
      <AnimatePresence onExitComplete={() => window.scrollTo(0, menuScrollY.current)}>
        {menuOpen ? (
          <motion.nav
            className="os-menu-full"
            aria-label="BabyBite"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            <button type="button" className="os-menu-close" onClick={() => setMenuOpen(false)} aria-label={t("closeMenu")}>
              <X strokeWidth={2.6} />
            </button>
            <Link href="/signup" onClick={() => setMenuOpen(false)}>
              {t("makePlan")}
            </Link>
            <Link href={loggedIn ? homeHref : "/login"} onClick={() => setMenuOpen(false)}>
              {loggedIn ? t("openTonight") : t("signIn")}
            </Link>
            <Link href="/landing" onClick={() => setMenuOpen(false)}>
              {t("seeHow")}
            </Link>
            {loggedIn ? (
              <Link href="/settings" onClick={() => setMenuOpen(false)}>
                {t("childKitchen")}
              </Link>
            ) : null}
            {loggedIn ? (
              <button type="button" className="os-menu-action" data-testid="menu-logout" onClick={logout}>
                {t("logOut")}
              </button>
            ) : null}
            <p className="os-menu-tag">{tagline ?? t("menuTag")}</p>
            <div className="os-menu-tools">
              <LocaleToggle />
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

export function BbCanvas({
  left,
  right,
  className,
  tagline,
  showTopbar = true,
  dinnerFirst = false,
  full = false,
  children,
}: {
  title?: string;
  onTitleClick?: () => void;
  left?: ReactNode;
  right?: ReactNode;
  chips?: string[];
  chipInteractive?: boolean;
  className?: string;
  tagline?: string;
  showTopbar?: boolean;
  dinnerFirst?: boolean;
  full?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={cn("bb-studio is-oats", dinnerFirst && "is-hero", full && "is-full", className)}>
      {showTopbar ? <FeatherTopbar tagline={tagline} /> : null}
      {full ? (
        children
      ) : (
        <div className="bb-spread">
          <section className="bb-stage">{right}</section>
          <aside className="bb-rail">{left}</aside>
        </div>
      )}
    </div>
  );
}

export function BbCluster({
  tone,
  label,
  children,
}: {
  tone: "must" | "fyi" | "low";
  label: string;
  children: ReactNode;
}) {
  const { t } = useMotherLocale();
  const titles: Record<string, string> = {
    "Must see": t("forYou"),
    Fyi: t("also"),
    "Low priority": t("later"),
  };

  return (
    <section className={cn("bb-cluster", `is-${tone}`)}>
      <p className="bb-cluster-label">{titles[label] ?? label}</p>
      {children}
    </section>
  );
}

export function BbMailCard({ item }: { item: BbMailItem }) {
  return (
    <article className="bb-course">
      <p className="bb-course-slot">{item.name}</p>
      <div className="bb-course-body">
        <p className="bb-course-dish">{item.line}</p>
        {item.chip ? <span className="bb-course-chip">{item.chip}</span> : null}
        {item.nested?.kind === "reply" && <p className="bb-course-note">{item.nested.text}</p>}
        {item.nested?.kind === "room" && <p className="bb-course-note">{item.nested.text}</p>}
        {item.nested?.kind === "file" && <p className="bb-course-file">{item.nested.text}</p>}
      </div>
    </article>
  );
}

export function BbFyiRow({
  count,
  label,
  icon,
}: {
  count: number | string;
  label: string;
  icon?: ReactNode;
}) {
  return (
    <div className="bb-fyi-row">
      {icon}
      <span className="tabular-nums">{count}</span>
      <span>{label}</span>
    </div>
  );
}

export function BbViewToggle({
  view,
  onChange,
}: {
  view: "table" | "insight";
  onChange: (view: "table" | "insight") => void;
}) {
  const { t } = useMotherLocale();
  return (
    <div className="bb-view-toggle">
      <button
        type="button"
        className={cn("bb-view-btn", view === "table" && "is-active")}
        onClick={() => onChange("table")}
      >
        {t("table")}
      </button>
      <button
        type="button"
        className={cn("bb-view-btn", view === "insight" && "is-active")}
        onClick={() => onChange("insight")}
      >
        {t("why")}
      </button>
    </div>
  );
}

export function BbRoomTabs<T extends string>({
  rooms,
  active,
  onChange,
}: {
  rooms: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="bb-rooms" role="tablist">
      {rooms.map((room) => (
        <button
          key={room.id}
          type="button"
          role="tab"
          aria-selected={active === room.id}
          className={cn("bb-room", active === room.id && "is-active")}
          onClick={() => onChange(room.id)}
        >
          {room.label}
        </button>
      ))}
    </div>
  );
}
