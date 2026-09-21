"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { PackTone } from "@/components/babybite/oats-brand";
import { cn } from "@/lib/utils";

export type MarqueeCard = {
  title: string;
  slot?: string;
  note?: string;
  tone?: PackTone;
  src?: string;
  imageFit?: "contain" | "cover";
};

const COLUMN_COUNT = 4;

function splitIntoFourColumns<T>(items: T[]) {
  const chunkSize = Math.max(1, Math.ceil(items.length / COLUMN_COUNT));
  return Array.from({ length: COLUMN_COUNT }, (_, colIndex) => {
    const start = colIndex * chunkSize;
    return items.slice(start, start + chunkSize);
  });
}

export const ThreeDMarquee = ({
  images,
  cards,
  className,
}: {
  /** Aceternity-style image URLs. */
  images?: string[];
  className?: string;
  /** Optional BabyBite pack tiles (same 3D engine, custom cell renderer). */
  cards?: MarqueeCard[];
}) => {
  const reduceMotion = useReducedMotion();

  if (cards?.length) {
    const chunks = splitIntoFourColumns(cards);
    return (
      <ClassicAceternityMarquee
        className={className}
        reduceMotion={reduceMotion}
        chunks={chunks}
        renderCell={(item) => (
          <BrandMarqueeCell item={item} reduceMotion={reduceMotion} />
        )}
      />
    );
  }

  const list = images ?? [];
  if (!list.length) {
    return null;
  }

  const chunks = splitIntoFourColumns(list.map((src) => ({ src })));

  return (
    <ClassicAceternityMarquee
      className={className}
      reduceMotion={reduceMotion}
      chunks={chunks}
      renderCell={(item, imageIndex) => (
        <motion.img
          whileHover={reduceMotion ? undefined : { y: -10 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          src={item.src}
          alt={`Image ${imageIndex + 1}`}
          className="aspect-[970/700] rounded-lg object-cover ring ring-gray-950/5 hover:shadow-2xl"
          width={970}
          height={700}
        />
      )}
    />
  );
};

/** Aceternity UI 3D marquee — scaled canvas, 55° / −45° grid, column bounce, grid guides. */
function ClassicAceternityMarquee<T>({
  chunks,
  className,
  reduceMotion,
  renderCell,
}: {
  chunks: T[][];
  className?: string;
  reduceMotion: boolean | null;
  renderCell: (item: T, imageIndex: number) => ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto block h-[600px] overflow-hidden rounded-2xl max-sm:h-[25rem]",
        className,
      )}
    >
      <div className="flex size-full items-center justify-center">
        <div className="size-[1720px] shrink-0 scale-50 sm:scale-75 lg:scale-100">
          <div
            style={{
              transform: "rotateX(55deg) rotateY(0deg) rotateZ(-45deg)",
            }}
            className="relative top-96 right-[50%] grid size-full origin-top-left grid-cols-4 gap-8 [transform-style:preserve-3d]"
          >
            {chunks.map((subarray, colIndex) => (
              <motion.div
                key={`marquee-col-${colIndex}`}
                className="flex flex-col items-start gap-8"
                animate={
                  reduceMotion ? undefined : { y: colIndex % 2 === 0 ? 100 : -100 }
                }
                transition={
                  reduceMotion
                    ? undefined
                    : {
                        duration: colIndex % 2 === 0 ? 10 : 15,
                        repeat: Infinity,
                        repeatType: "reverse",
                      }
                }
              >
                <GridLineVertical className="-left-4" offset="80px" />
                {subarray.map((item, imageIndex) => (
                  <div className="relative" key={`${colIndex}-${imageIndex}`}>
                    <GridLineHorizontal className="-top-4" offset="20px" />
                    {renderCell(item, imageIndex)}
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Same Aceternity cell shell (aspect image + ring); BabyBite art + copy inside. */
function BrandMarqueeCell({
  item,
  reduceMotion,
}: {
  item: MarqueeCard;
  reduceMotion: boolean | null;
}) {
  const fit = item.imageFit ?? "contain";

  return (
    <div className="relative overflow-hidden rounded-lg ring ring-gray-950/5 hover:shadow-2xl">
      {item.src ? (
        <motion.img
          whileHover={reduceMotion ? undefined : { y: -10 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          src={item.src}
          alt={item.title}
          className={cn(
            "aspect-[970/700] w-full bg-white",
            fit === "cover" ? "object-cover" : "object-contain p-3",
          )}
          width={970}
          height={700}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="flex aspect-[970/700] w-full items-end bg-[#f6d326] p-4" />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#111]/90 via-[#111]/50 to-transparent px-3 pb-2.5 pt-10 text-left">
        <p className="font-[family-name:var(--font-label)] text-[0.5rem] font-extrabold uppercase tracking-[0.14em] text-[#f6d326]">
          BabyBite
        </p>
        {item.slot ? (
          <p className="text-[0.48rem] font-bold uppercase tracking-wide text-white/80">{item.slot}</p>
        ) : null}
        <p className="font-[family-name:var(--font-label)] text-[0.68rem] font-extrabold leading-tight text-white">
          {item.title}
        </p>
      </div>
    </div>
  );
}

const GridLineHorizontal = ({
  className,
  offset,
}: {
  className?: string;
  offset?: string;
}) => {
  return (
    <div
      style={
        {
          "--background": "#ffffff",
          "--color": "rgba(0, 0, 0, 0.2)",
          "--height": "1px",
          "--width": "5px",
          "--fade-stop": "90%",
          "--offset": offset || "200px",
          "--color-dark": "rgba(255, 255, 255, 0.2)",
          maskComposite: "exclude",
        } as CSSProperties
      }
      className={cn(
        "absolute left-[calc(var(--offset)/2*-1)] h-[var(--height)] w-[calc(100%+var(--offset))]",
        "bg-[linear-gradient(to_right,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_left,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_right,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        "z-30",
        "dark:bg-[linear-gradient(to_right,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
        className,
      )}
    ></div>
  );
};

const GridLineVertical = ({
  className,
  offset,
}: {
  className?: string;
  offset?: string;
}) => {
  return (
    <div
      style={
        {
          "--background": "#ffffff",
          "--color": "rgba(0, 0, 0, 0.2)",
          "--height": "5px",
          "--width": "1px",
          "--fade-stop": "90%",
          "--offset": offset || "150px",
          "--color-dark": "rgba(255, 255, 255, 0.2)",
          maskComposite: "exclude",
        } as CSSProperties
      }
      className={cn(
        "absolute top-[calc(var(--offset)/2*-1)] h-[calc(100%+var(--offset))] w-[var(--width)]",
        "bg-[linear-gradient(to_bottom,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_top,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_bottom,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        "z-30",
        "dark:bg-[linear-gradient(to_bottom,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
        className,
      )}
    ></div>
  );
};
