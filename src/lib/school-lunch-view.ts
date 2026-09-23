import type { DailyPlan, GeneratedMealPlan, KitchenLists, MealEntry } from "@/types/babybite";

function emptyLists(): KitchenLists {
  return {
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
    tenMin: [],
    budget: [],
    schoolLunch: [],
    kidsFavourite: [],
    riceFree: [],
    homemadeSnacks: [],
  };
}

function isTiffin(meal?: MealEntry): boolean {
  return Boolean(meal?.tags?.includes("school-tiffin"));
}

function packableLunches(lists: KitchenLists): MealEntry[] {
  const seen = new Set<string>();
  const out: MealEntry[] = [];
  for (const meal of [
    ...(lists.schoolLunch ?? []),
    ...(lists.lunch ?? []).filter(isTiffin),
    ...(lists.breakfast ?? []).filter(isTiffin),
  ]) {
    if (!meal?.name || seen.has(meal.name)) continue;
    seen.add(meal.name);
    out.push({ ...meal, slot: "lunch" });
  }
  return out;
}

function replaceLunch(day: DailyPlan, alt: MealEntry, current: MealEntry | undefined, schoolOn: boolean): DailyPlan {
  const next: MealEntry = {
    ...alt,
    slot: "lunch",
    swaps: current?.swaps ?? alt.swaps,
    whyThisPlate: schoolOn
      ? alt.whyThisPlate || "Packed because you asked for school tiffin."
      : alt.whyThisPlate || "Packable lunch from your kitchen lists.",
  };
  return {
    ...day,
    meals: (day.meals ?? []).map((meal) => (meal.slot === "lunch" ? next : meal)),
  };
}

function pickOverlayLunch(
  pool: MealEntry[],
  dayIndex: number,
  currentName?: string,
  recentNames: string[] = []
): MealEntry | undefined {
  if (pool.length === 0) return undefined;
  const last = recentNames[recentNames.length - 1];
  const fresh = pool.filter((meal) => meal.name !== currentName && !recentNames.includes(meal.name));
  if (fresh.length > 0) return fresh[0];
  const ranked = [...pool].sort((a, b) => {
    const aIndex = recentNames.lastIndexOf(a.name);
    const bIndex = recentNames.lastIndexOf(b.name);
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.name.localeCompare(b.name);
  });
  const notLast = ranked.filter((meal) => meal.name !== last && meal.name !== currentName);
  if (notLast.length > 0) return notLast[0];
  return ranked[dayIndex % ranked.length];
}

export function overlaySchoolLunch(
  day: DailyPlan,
  lists: KitchenLists,
  schoolOn: boolean,
  dayIndex = 0,
  recentLunches: string[] = []
): DailyPlan {
  const lunch = (day.meals ?? []).find((meal) => meal.slot === "lunch");
  if (schoolOn) {
    const pool = packableLunches(lists);
    const pick = pickOverlayLunch(pool, dayIndex, lunch?.name, recentLunches);
    if (!pick) return day;
    if (pick.name === lunch?.name) return day;
    return replaceLunch(day, pick, lunch, true);
  }
  if (!isTiffin(lunch)) return day;
  const homePool = [
    ...(lists.lunch ?? []).filter((meal) => !isTiffin(meal)),
    ...(lists.dinner ?? []).filter((meal) => !isTiffin(meal)),
    ...(lists.riceFree ?? []).filter((meal) => !isTiffin(meal)),
  ];
  const seen = new Set<string>();
  const uniqueHome = homePool.filter((meal) => {
    if (!meal.name || seen.has(meal.name) || meal.name === lunch?.name) return false;
    seen.add(meal.name);
    return true;
  });
  const pick = pickOverlayLunch(uniqueHome, dayIndex, lunch?.name, recentLunches);
  if (!pick || pick.name === lunch?.name) return day;
  return replaceLunch(day, pick, lunch, false);
}

function overlayDays(days: DailyPlan[], lists: KitchenLists, schoolOn: boolean): DailyPlan[] {
  const window = Math.max(6, Math.min(24, packableLunches(lists).length - 1));
  const recent: string[] = [];
  return days.map((day, index) => {
    const next = overlaySchoolLunch(day, lists, schoolOn, index, recent);
    const lunch = (next.meals ?? []).find((meal) => meal.slot === "lunch");
    if (lunch?.name) {
      recent.push(lunch.name);
      if (recent.length > window) recent.shift();
    }
    return next;
  });
}

export function overlaySchoolPlan(plan: GeneratedMealPlan, schoolOn: boolean): GeneratedMealPlan {
  const lists = plan.kitchenLists ?? emptyLists();
  const source =
    (plan.monthly?.length ?? 0) > 0
      ? plan.monthly
      : (plan.weekly?.length ?? 0) > 0
        ? plan.weekly
        : plan.today
          ? [plan.today]
          : [];
  const overlaid = overlayDays(source, lists, schoolOn);
  return {
    ...plan,
    today: overlaid[0] ?? plan.today,
    weekly: plan.weekly?.length ? overlaid.slice(0, plan.weekly.length) : plan.weekly ?? [],
    monthly: plan.monthly?.length ? overlaid : plan.monthly ?? [],
  };
}
