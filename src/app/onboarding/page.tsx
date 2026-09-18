"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { BbCanvas } from "@/components/babybite/bb-canvas";
import { SiteArt } from "@/components/babybite/oats-brand";
import { KitchenSkeleton } from "@/components/babybite/page-skeleton";
import { AgePicker, GoalCard, OptionGrid } from "@/components/babybite/option-select";
import { Input } from "@/components/ui/input";
import { useMotherLocale } from "@/components/providers/locale-provider";
import type { MotherCopyKey } from "@/lib/mother-copy";
import type {
  ChildGenderChoice,
  CookTime,
  FoodAllergy,
  KitchenBudget,
  NutritionChallenge,
  NutritionGoal,
  RiceHabit,
  TiffinNeed,
} from "@/types/babybite";
import { parseOptionalMeasure } from "@/schemas/babybite";
import { growthBandForAge } from "@/lib/growth-bands";
import { writeActiveChildId } from "@/lib/babybite-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STEPS = [0, 1, 2, 3, 4, 5] as const;
const TITLE_KEYS = ["obTitle1", "obTitle2", "obTitleKitchen", "obTitle3", "obTitle4", "obTitle5"] as const;
const LEDE_KEYS = ["obLede1", "obLede2", "obLedeKitchen", "obLede3", "obLede4", "obLede5"] as const;
const ROOM_KEYS = [
  { id: "child", key: "roomChild" },
  { id: "food", key: "roomFood" },
  { id: "kitchen", key: "roomKitchen" },
  { id: "challenges", key: "roomChallenges" },
  { id: "goal", key: "roomGoal" },
  { id: "review", key: "roomReview" },
] as const;

const GOAL_KEYS: Record<NutritionGoal, MotherCopyKey> = {
  "healthy-nutrition": "goalHealthy",
  "better-eating-habits": "goalHabits",
  "protein-focus": "goalProtein",
  "balanced-meals": "goalBalance",
  "food-variety": "goalVariety",
};

const GOAL_HINT_KEYS: Record<NutritionGoal, MotherCopyKey> = {
  "healthy-nutrition": "goalHealthyHint",
  "better-eating-habits": "goalHabitsHint",
  "protein-focus": "goalProteinHint",
  "balanced-meals": "goalBalanceHint",
  "food-variety": "goalVarietyHint",
};

const CHALLENGE_MARKS: Record<NutritionChallenge, { mark: string; tone: "yellow" | "sage" | "pink" | "sky" | "cocoa" }> = {
  underweight: { mark: "01", tone: "yellow" },
  "poor-appetite": { mark: "02", tone: "sage" },
  "picky-eater": { mark: "03", tone: "pink" },
  "no-vegetables": { mark: "04", tone: "sky" },
  "no-milk": { mark: "05", tone: "cocoa" },
  "low-energy": { mark: "06", tone: "yellow" },
  "active-sports": { mark: "07", tone: "sage" },
};

const CHALLENGE_KEYS: Record<NutritionChallenge, MotherCopyKey> = {
  underweight: "chUnder",
  "poor-appetite": "chAppetite",
  "picky-eater": "chPicky",
  "no-vegetables": "chVeg",
  "no-milk": "chMilk",
  "low-energy": "chEnergy",
  "active-sports": "chSports",
};

const ALLERGY_KEYS: Record<FoodAllergy, MotherCopyKey> = {
  dairy: "allergyDairy",
  nuts: "allergyNuts",
  eggs: "allergyEggs",
  gluten: "allergyGluten",
  soy: "allergySoy",
  seafood: "allergySeafood",
};

const GOALS = Object.keys(GOAL_KEYS) as NutritionGoal[];

export default function OnboardingPage() {
  const { t } = useMotherLocale();
  const router = useRouter();
  const { update, status } = useSession();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    ageYears: 7,
    gender: "male" as ChildGenderChoice,
    heightCm: "",
    weightKg: "",
    dietPreference: "vegetarian" as "vegetarian" | "eggetarian" | "non-vegetarian",
    foodStyle: "mixed-indian" as "south-indian" | "north-indian" | "mixed-indian",
    challenges: ["picky-eater"] as NutritionChallenge[],
    goal: "healthy-nutrition" as NutritionGoal,
    allergies: [] as FoodAllergy[],
    dislikedFoods: "",
    cookTime: "normal" as CookTime,
    kitchenBudget: "normal" as KitchenBudget,
    riceHabit: "eats-rice" as RiceHabit,
    tiffinNeed: "home-only" as TiffinNeed,
  });

  const dietLabel =
    form.dietPreference === "eggetarian"
      ? t("egg")
      : form.dietPreference === "non-vegetarian"
        ? t("nonveg")
        : t("veg");
  const styleLabel =
    form.foodStyle === "south-indian"
      ? t("south")
      : form.foodStyle === "north-indian"
        ? t("north")
        : t("mixed");

  const growthBand = growthBandForAge(form.ageYears);
  const progress = ((step + 1) / STEPS.length) * 100;

  const toggleChallenge = (c: string) => {
    const key = c as NutritionChallenge;
    setForm((f) => ({
      ...f,
      challenges: f.challenges.includes(key)
        ? f.challenges.filter((x) => x !== key)
        : [...f.challenges, key],
    }));
  };

  const submit = async () => {
    if (form.challenges.length === 0) {
      toast.error(t("selectChallenge"));
      setStep(3);
      return;
    }
    if (status === "unauthenticated") {
      toast.error(t("signInToSave"));
      router.push("/login?callbackUrl=/onboarding");
      return;
    }
    setLoading(true);
    try {
      const heightCm = parseOptionalMeasure(form.heightCm);
      const weightKg = parseOptionalMeasure(form.weightKg);
      const createNew = new URLSearchParams(window.location.search).get("new") === "1";
      const res = await fetch("/api/babybite/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          ageYears: form.ageYears,
          gender: form.gender,
          dietPreference: form.dietPreference,
          foodStyle: form.foodStyle,
          challenges: form.challenges,
          goal: form.goal,
          allergies: form.allergies,
          dislikedFoods: form.dislikedFoods
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          cookTime: form.cookTime,
          kitchenBudget: form.kitchenBudget,
          riceHabit: form.riceHabit,
          tiffinNeed: form.tiffinNeed,
          ...(heightCm !== undefined ? { heightCm } : {}),
          ...(weightKg !== undefined ? { weightKg } : {}),
          ...(createNew ? { createNew: true } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      if (json.childProfileId) writeActiveChildId(json.childProfileId);
      await update({ onboardingComplete: true, hasPaid: Boolean(json.hasPaid) });
      router.push(json.hasPaid ? "/results" : "/payment");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("couldNotLoad"));
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    if (step === 0 && !form.name.trim()) {
      toast.error(t("enterName"));
      return;
    }
    if (step === 0 && (form.ageYears < 4 || form.ageYears > 12)) {
      toast.error(t("ageRange"));
      return;
    }
    if (step === 3 && form.challenges.length === 0) {
      toast.error(t("pickChallenge"));
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
    else submit();
  };

  if (status === "loading") {
    return (
      <BbCanvas full>
        <KitchenSkeleton />
      </BbCanvas>
    );
  }

  return (
    <BbCanvas full className="os-onboard">
      <section className="os-auth-grid">
        <div className="os-onboard-form">
          <div className="os-step-pills" role="tablist">
            {ROOM_KEYS.map((room, index) => (
              <button
                key={room.id}
                type="button"
                role="tab"
                aria-selected={step === index}
                className={cn("os-step-pill", step === index && "is-on")}
                onClick={() => setStep(index)}
              >
                {t(room.key)}
              </button>
            ))}
          </div>
          <div className="os-progress" aria-hidden>
            <span style={{ width: `${progress}%` }} />
          </div>
          <p className="os-band-kicker">
            {t("stepOf")} {step + 1} {t("of")} {STEPS.length}
          </p>
          <h1 className="os-auth-title">{t(TITLE_KEYS[step])}</h1>
          <p className="os-onboard-lede">{t(LEDE_KEYS[step])}</p>

          <div className="os-onboard-compare">
            <SiteArt src="/art-compare.png" alt={t("artCompare")} variant="compare" />
            <p className="os-onboard-art-note">{t("noExtraCm")}</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              {step === 0 && (
                <div className="os-field-stack">
                  <div>
                    <label className="os-band-kicker" htmlFor="child-name">
                      {t("name")}
                    </label>
                    <Input
                      id="child-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder={t("namePh")}
                      data-testid="child-name"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="os-band-kicker">{t("age")}</label>
                    <p className="os-onboard-lede">{t("ageRange")}</p>
                    <AgePicker
                      value={form.ageYears}
                      onChange={(age) => setForm({ ...form, ageYears: age })}
                    />
                  </div>
                  <div>
                    <label className="os-band-kicker">{t("gender")}</label>
                    <p className="os-onboard-lede">{t("genderHint")}</p>
                    <OptionGrid
                      options={[
                        { value: "male", label: t("boy"), mark: "B", tone: "sky" },
                        { value: "female", label: t("girl"), mark: "G", tone: "pink" },
                      ]}
                      value={form.gender}
                      onChange={(v) => setForm({ ...form, gender: v as ChildGenderChoice })}
                      columns={2}
                    />
                  </div>
                  <div className="os-hw-card">
                    <p className="os-band-kicker">{t("hwMain")}</p>
                    <p className="os-onboard-lede">{t("hwLede")}</p>
                    <p className="os-band-kicker os-hw-band-kicker">{t("hwBand")}</p>
                    <div className="os-hw-band">
                      <article>
                        <p className="os-band-kicker">{t("usualHeight")}</p>
                        <h3>{growthBand.heightCm}</h3>
                      </article>
                      <article>
                        <p className="os-band-kicker">{t("usualWeight")}</p>
                        <h3>{growthBand.weightKg}</h3>
                      </article>
                    </div>
                    <div className="os-hw-grid">
                      <div>
                        <label className="os-band-kicker" htmlFor="child-height">
                          {t("heightCm")}
                        </label>
                        <Input
                          id="child-height"
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          value={form.heightCm}
                          onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                          placeholder={growthBand.heightCm}
                        />
                      </div>
                      <div>
                        <label className="os-band-kicker" htmlFor="child-weight">
                          {t("weightKg")}
                        </label>
                        <Input
                          id="child-weight"
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          value={form.weightKg}
                          onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                          placeholder={growthBand.weightKg}
                        />
                      </div>
                    </div>
                    <p className="os-onboard-lede">{t("hwSkip")}</p>
                    <p className="os-compare-note">{t("noExtraCm")}</p>
                  </div>
                  <div>
                    <label className="os-band-kicker">{t("anyAllergies")}</label>
                    <OptionGrid
                      options={(Object.keys(ALLERGY_KEYS) as FoodAllergy[]).map((value) => ({
                        value,
                        label: t(ALLERGY_KEYS[value]),
                      }))}
                      value={form.allergies}
                      onChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          allergies: f.allergies.includes(v as FoodAllergy)
                            ? f.allergies.filter((a) => a !== v)
                            : [...f.allergies, v as FoodAllergy],
                        }))
                      }
                      multiple
                      columns={2}
                    />
                  </div>
                  <div>
                    <label className="os-band-kicker" htmlFor="disliked-foods">
                      {t("foodsAvoid")}
                    </label>
                    <Input
                      id="disliked-foods"
                      value={form.dislikedFoods}
                      onChange={(e) => setForm({ ...form, dislikedFoods: e.target.value })}
                      placeholder={t("foodsAvoidPh")}
                    />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="os-field-stack">
                  <p className="os-now-line">
                    {t("diet")}: {dietLabel} · {t("style")}: {styleLabel}
                  </p>
                  <div>
                    <label className="os-band-kicker">{t("dietHome")}</label>
                    <OptionGrid
                      options={[
                        { value: "vegetarian", label: t("veg"), mark: "01", tone: "sage", hint: t("vegHint") },
                        { value: "eggetarian", label: t("egg"), mark: "02", tone: "yellow", hint: t("eggHint") },
                        { value: "non-vegetarian", label: t("nonveg"), mark: "03", tone: "cocoa", hint: t("nonvegHint") },
                      ]}
                      value={form.dietPreference}
                      onChange={(v) =>
                        setForm({ ...form, dietPreference: v as typeof form.dietPreference })
                      }
                      columns={1}
                    />
                  </div>
                  <div>
                    <label className="os-band-kicker">{t("regionStyle")}</label>
                    <OptionGrid
                      options={[
                        { value: "south-indian", label: t("south"), mark: "S", tone: "sage", hint: t("southHint") },
                        { value: "north-indian", label: t("north"), mark: "N", tone: "yellow", hint: t("northHint") },
                        { value: "mixed-indian", label: t("mixed"), mark: "M", tone: "pink", hint: t("mixedHint") },
                      ]}
                      value={form.foodStyle}
                      onChange={(v) =>
                        setForm({ ...form, foodStyle: v as typeof form.foodStyle })
                      }
                      columns={1}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="os-field-stack">
                  <div>
                    <label className="os-band-kicker">{t("cookTime")}</label>
                    <OptionGrid
                      options={[
                        { value: "ten-min", label: t("cookTenMin"), mark: "10", tone: "yellow", hint: t("cookTenMinHint") },
                        { value: "normal", label: t("cookNormal"), mark: "OK", tone: "sage", hint: t("cookNormalHint") },
                      ]}
                      value={form.cookTime}
                      onChange={(v) => setForm({ ...form, cookTime: v as CookTime })}
                      columns={1}
                    />
                  </div>
                  <div>
                    <label className="os-band-kicker">{t("kitchenMoney")}</label>
                    <OptionGrid
                      options={[
                        { value: "tight", label: t("budgetTight"), mark: "₹", tone: "cocoa", hint: t("budgetTightHint") },
                        { value: "normal", label: t("budgetNormal"), mark: "₹₹", tone: "sky", hint: t("budgetNormalHint") },
                      ]}
                      value={form.kitchenBudget}
                      onChange={(v) => setForm({ ...form, kitchenBudget: v as KitchenBudget })}
                      columns={1}
                    />
                  </div>
                  <div>
                    <label className="os-band-kicker">{t("kitchenRice")}</label>
                    <OptionGrid
                      options={[
                        { value: "eats-rice", label: t("riceEats"), mark: "R", tone: "sage", hint: t("riceEatsHint") },
                        { value: "refuses-rice", label: t("riceRefuses"), mark: "X", tone: "pink", hint: t("riceRefusesHint") },
                      ]}
                      value={form.riceHabit}
                      onChange={(v) => setForm({ ...form, riceHabit: v as RiceHabit })}
                      columns={1}
                    />
                  </div>
                  <div>
                    <label className="os-band-kicker">{t("kitchenTiffin")}</label>
                    <OptionGrid
                      options={[
                        { value: "school-lunch", label: t("tiffinSchool"), mark: "S", tone: "yellow", hint: t("tiffinSchoolHint") },
                        { value: "home-only", label: t("tiffinHome"), mark: "H", tone: "sky", hint: t("tiffinHomeHint") },
                      ]}
                      value={form.tiffinNeed}
                      onChange={(v) => setForm({ ...form, tiffinNeed: v as TiffinNeed })}
                      columns={1}
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="os-field-stack">
                  <p className="os-now-line">{t("challengeTick")}</p>
                  <OptionGrid
                    options={(Object.keys(CHALLENGE_KEYS) as NutritionChallenge[]).map((value) => ({
                      value,
                      label: t(CHALLENGE_KEYS[value]),
                      mark: CHALLENGE_MARKS[value].mark,
                      tone: CHALLENGE_MARKS[value].tone,
                      hint:
                        value === "picky-eater"
                          ? t("pickyHint")
                          : value === "underweight"
                            ? t("underHint")
                            : value === "no-vegetables"
                              ? t("vegSkipHint")
                              : undefined,
                    }))}
                    value={form.challenges}
                    onChange={toggleChallenge}
                    multiple
                    columns={1}
                  />
                </div>
              )}

              {step === 4 && (
                <div className="os-field-stack">
                  {GOALS.map((goal) => (
                      <GoalCard
                        key={goal}
                        label={t(GOAL_KEYS[goal])}
                        description={t(GOAL_HINT_KEYS[goal])}
                        selected={form.goal === goal}
                        onSelect={() => setForm({ ...form, goal })}
                      />
                    ))}
                </div>
              )}

              {step === 5 && (
                <div className="os-review">
                  <p className="os-band-kicker">
                    {t("readyFor")} {form.name || t("yourChild")}
                  </p>
                  <div className="os-review-chips">
                    {[
                      form.name,
                      `${form.ageYears} ${t("years")}`,
                      form.gender === "female" ? t("girl") : t("boy"),
                      form.heightCm.trim() ? `${form.heightCm.trim()} cm` : growthBand.heightCm,
                      form.weightKg.trim() ? `${form.weightKg.trim()} kg` : growthBand.weightKg,
                      dietLabel,
                      styleLabel,
                      form.cookTime === "ten-min" ? t("cookTenMin") : t("cookNormal"),
                      form.kitchenBudget === "tight" ? t("budgetTight") : t("budgetNormal"),
                      form.riceHabit === "refuses-rice" ? t("riceRefuses") : t("riceEats"),
                      form.tiffinNeed === "school-lunch" ? t("tiffinSchool") : t("tiffinHome"),
                      ...form.challenges.map((item) => t(CHALLENGE_KEYS[item])),
                      ...form.allergies.map((item) => t(ALLERGY_KEYS[item])),
                      form.dislikedFoods.trim() || "",
                      t(GOAL_KEYS[form.goal]),
                    ]
                      .filter(Boolean)
                      .map((tag) => (
                        <span key={tag} className="os-chip is-yellow">
                          {tag}
                        </span>
                      ))}
                  </div>
                  <p className="os-onboard-lede">{t("nextReadTable")}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="os-band-actions os-onboard-actions">
            {step > 0 ? (
              <button type="button" className="os-text-link" onClick={() => setStep(step - 1)}>
                {t("back")}
              </button>
            ) : null}
            <button type="button" className="bb-cta" onClick={next} disabled={loading} data-testid="onboarding-next">
              {loading ? t("saving") : step === STEPS.length - 1 ? t("seeTable") : t("continue")}
            </button>
          </div>
        </div>

        <div className="os-auth-pack">
          <SiteArt src="/art-compare.png" alt={t("artCompare")} variant="compare" />
          <p className="os-onboard-art-note">{t("noExtraCm")}</p>
        </div>
      </section>
    </BbCanvas>
  );
}
