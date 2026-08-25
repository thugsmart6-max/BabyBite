"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { BbCanvas } from "@/components/kidfuel/bb-canvas";
import { SiteArt } from "@/components/kidfuel/oats-brand";
import { AgePicker, GoalCard, OptionGrid } from "@/components/kidfuel/option-select";
import { Input } from "@/components/ui/input";
import { useMotherLocale } from "@/components/providers/locale-provider";
import type { MotherCopyKey } from "@/lib/mother-copy";
import type { FoodAllergy, NutritionChallenge, NutritionGoal } from "@/types/kidfuel";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STEPS = [0, 1, 2, 3, 4] as const;
const TITLE_KEYS = ["obTitle1", "obTitle2", "obTitle3", "obTitle4", "obTitle5"] as const;
const LEDE_KEYS = ["obLede1", "obLede2", "obLede3", "obLede4", "obLede5"] as const;
const ROOM_KEYS = [
  { id: "child", key: "roomChild" },
  { id: "food", key: "roomFood" },
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
    gender: "male" as "male" | "female" | "other",
    heightCm: "",
    weightKg: "",
    dietPreference: "vegetarian" as "vegetarian" | "eggetarian" | "non-vegetarian",
    foodStyle: "mixed-indian" as "south-indian" | "north-indian" | "mixed-indian",
    challenges: ["picky-eater"] as NutritionChallenge[],
    goal: "healthy-nutrition" as NutritionGoal,
    allergies: [] as FoodAllergy[],
    dislikedFoods: "",
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
      setStep(2);
      return;
    }
    if (status === "unauthenticated") {
      toast.error(t("signInToSave"));
      router.push("/login?callbackUrl=/onboarding");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/kidfuel/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          heightCm: form.heightCm ? Number(form.heightCm) : undefined,
          weightKg: form.weightKg ? Number(form.weightKg) : undefined,
          allergies: form.allergies,
          dislikedFoods: form.dislikedFoods
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      await update({ onboardingComplete: true });
      router.push("/payment");
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
    if (step === 2 && form.challenges.length === 0) {
      toast.error(t("pickChallenge"));
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
    else submit();
  };

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
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="os-band-kicker">{t("age")}</label>
                    <AgePicker
                      value={form.ageYears}
                      onChange={(age) => setForm({ ...form, ageYears: age })}
                    />
                  </div>
                  <div>
                    <label className="os-band-kicker">{t("gender")}</label>
                    <OptionGrid
                      options={[
                        { value: "male", label: t("boy"), mark: "B", tone: "sky" },
                        { value: "female", label: t("girl"), mark: "G", tone: "pink" },
                        { value: "other", label: t("other"), mark: "+", tone: "sage" },
                      ]}
                      value={form.gender}
                      onChange={(v) => setForm({ ...form, gender: v as typeof form.gender })}
                      columns={3}
                    />
                  </div>
                  <details className="os-optional">
                    <summary className="os-band-kicker cursor-pointer">{t("optionalHw")}</summary>
                    <div className="grid sm:grid-cols-2 gap-4 mt-4">
                      <Input
                        value={form.heightCm}
                        onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                        placeholder={t("heightCm")}
                      />
                      <Input
                        value={form.weightKg}
                        onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                        placeholder={t("weightKg")}
                      />
                    </div>
                  </details>
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

              {step === 3 && (
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

              {step === 4 && (
                <div className="os-review">
                  <p className="os-band-kicker">
                    {t("readyFor")} {form.name || t("yourChild")}
                  </p>
                  <div className="os-review-chips">
                    {[
                      form.name,
                      `${form.ageYears} ${t("years")}`,
                      dietLabel,
                      styleLabel,
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
            <button type="button" className="bb-cta" onClick={next} disabled={loading}>
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
