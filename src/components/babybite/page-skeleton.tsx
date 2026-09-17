"use client";

import { BbCanvas } from "@/components/babybite/bb-canvas";
import { LoaderFive, LoaderOne } from "@/components/ui/loader";
import { useMotherLocale } from "@/components/providers/locale-provider";

export function KitchenSkeleton({ note }: { note?: string }) {
  const { t } = useMotherLocale();
  return (
    <section className="os-load" data-testid="page-skeleton" aria-busy="true" aria-live="polite">
      <LoaderOne />
      <p className="os-band-kicker">{t("tonight")}</p>
      <LoaderFive text={note ?? t("writingDinner")} />
    </section>
  );
}

export function KitchenSkeletonScreen({ note }: { note?: string }) {
  return (
    <BbCanvas full>
      <KitchenSkeleton note={note} />
    </BbCanvas>
  );
}
