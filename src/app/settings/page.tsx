"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
import { BbCanvas } from "@/components/kidfuel/bb-canvas";
import { MealPack, OsBusy } from "@/components/kidfuel/oats-brand";
import { OptionGrid, AgePicker, GoalCard } from "@/components/kidfuel/option-select";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { ErrorState } from "@/components/shared/error-state";
import { ResultsPdfDownload } from "@/components/kidfuel/results-pdf-download";
import type {
  ChildGender,
  DietPreference,
  FoodAllergy,
  FoodStyle,
  NutritionChallenge,
  NutritionGoal,
} from "@/types/kidfuel";
import { fetchKidFuelProfile, KidFuelApiError } from "@/lib/kidfuel-client";
import { toast } from "sonner";
import { useMotherLocale } from "@/components/providers/locale-provider";
import type { MotherCopyKey } from "@/lib/mother-copy";
import { cn } from "@/lib/utils";

type SetTab = "child" | "kitchen" | "focus" | "account" | "plan";

type SettingsForm = {
  name: string;
  ageYears: number;
  gender: ChildGender;
  heightCm: string;
  weightKg: string;
  dietPreference: DietPreference;
  foodStyle: FoodStyle;
  challenges: NutritionChallenge[];
  goal: NutritionGoal;
  allergies: FoodAllergy[];
  dislikedFoods: string;
};

const EMPTY_FORM: SettingsForm = {
  name: "",
  ageYears: 7,
  gender: "male",
  heightCm: "",
  weightKg: "",
  dietPreference: "vegetarian",
  foodStyle: "mixed-indian",
  challenges: ["picky-eater"],
  goal: "healthy-nutrition",
  allergies: [],
  dislikedFoods: "",
};

const ALLERGY_KEYS: Record<FoodAllergy, MotherCopyKey> = {
  dairy: "allergyDairy",
  nuts: "allergyNuts",
  eggs: "allergyEggs",
  gluten: "allergyGluten",
  soy: "allergySoy",
  seafood: "allergySeafood",
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

const CHALLENGE_MARKS: Record<
  NutritionChallenge,
  { mark: string; tone: "yellow" | "sage" | "pink" | "sky" | "cocoa" }
> = {
  underweight: { mark: "01", tone: "yellow" },
  "poor-appetite": { mark: "02", tone: "sage" },
  "picky-eater": { mark: "03", tone: "pink" },
  "no-vegetables": { mark: "04", tone: "sky" },
  "no-milk": { mark: "05", tone: "cocoa" },
  "low-energy": { mark: "06", tone: "yellow" },
  "active-sports": { mark: "07", tone: "sage" },
};

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

const GOALS = Object.keys(GOAL_KEYS) as NutritionGoal[];

function snapshot(form: SettingsForm) {
  return JSON.stringify({
    ...form,
    allergies: [...form.allergies].sort(),
    challenges: [...form.challenges].sort(),
    dislikedFoods: form.dislikedFoods.trim(),
    name: form.name.trim(),
  });
}

function kitchenSnapshot(form: SettingsForm) {
  return JSON.stringify({
    ageYears: form.ageYears,
    gender: form.gender,
    heightCm: form.heightCm,
    weightKg: form.weightKg,
    dietPreference: form.dietPreference,
    foodStyle: form.foodStyle,
    challenges: [...form.challenges].sort(),
    goal: form.goal,
    allergies: [...form.allergies].sort(),
    dislikedFoods: form.dislikedFoods.trim(),
  });
}

export default function SettingsPage() {
  const { t } = useMotherLocale();
  const router = useRouter();
  const { update, data: session } = useSession();
  const [tab, setTab] = useState<SetTab>("child");
  const [loggingOut, setLoggingOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPaid, setHasPaid] = useState(false);
  const [childId, setChildId] = useState<string | null>(null);
  const [form, setForm] = useState<SettingsForm>(EMPTY_FORM);
  const [savedSnap, setSavedSnap] = useState("");
  const [savedKitchen, setSavedKitchen] = useState("");
  const [askRebuild, setAskRebuild] = useState(false);

  const dirty = savedSnap !== "" && snapshot(form) !== savedSnap;

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

  const tabs = useMemo(
    () =>
      (
        [
          { id: "child" as const, label: t("setChild") },
          { id: "kitchen" as const, label: t("setKitchen") },
          { id: "focus" as const, label: t("setFocus") },
          { id: "account" as const, label: t("account") },
          ...(hasPaid ? [{ id: "plan" as const, label: t("setPlan") }] : []),
        ]
      ),
    [hasPaid, t]
  );

  const applyChild = (profile: Awaited<ReturnType<typeof fetchKidFuelProfile>>) => {
    if (!profile.child) {
      router.replace("/onboarding");
      return;
    }
    const child = profile.child;
    const next: SettingsForm = {
      name: child.name,
      ageYears: child.ageYears,
      gender: child.gender,
      heightCm: child.heightCm ? String(child.heightCm) : "",
      weightKg: child.weightKg ? String(child.weightKg) : "",
      dietPreference: (child.dietPreference as DietPreference) ?? "vegetarian",
      foodStyle: (child.foodStyle as FoodStyle) ?? "mixed-indian",
      challenges: (child.challenges as NutritionChallenge[]) ?? ["picky-eater"],
      goal: (child.goal as NutritionGoal) ?? "healthy-nutrition",
      allergies: child.allergies ?? [],
      dislikedFoods: (child.dislikedFoods ?? []).join(", "),
    };
    setChildId(child.id);
    setHasPaid(child.hasPaid);
    setForm(next);
    setSavedSnap(snapshot(next));
    setSavedKitchen(kitchenSnapshot(next));
    setAskRebuild(false);
  };

  useEffect(() => {
    let cancelled = false;
    fetchKidFuelProfile()
      .then((profile) => {
        if (cancelled) return;
        applyChild(profile);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof KidFuelApiError ? err.message : t("failedSettings"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const retry = () => {
    setLoading(true);
    setError(null);
    fetchKidFuelProfile()
      .then(applyChild)
      .catch((err) => {
        setError(err instanceof KidFuelApiError ? err.message : t("failedSettings"));
      })
      .finally(() => setLoading(false));
  };

  const toggle = <T extends string>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const save = async () => {
    if (!form.name.trim()) {
      setTab("child");
      toast.error(t("enterName"));
      return;
    }
    if (form.challenges.length === 0) {
      setTab("focus");
      toast.error(t("selectChallenge"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/kidfuel/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          ageYears: form.ageYears,
          gender: form.gender,
          heightCm: form.heightCm ? Number(form.heightCm) : undefined,
          weightKg: form.weightKg ? Number(form.weightKg) : undefined,
          dietPreference: form.dietPreference,
          foodStyle: form.foodStyle,
          challenges: form.challenges,
          goal: form.goal,
          allergies: form.allergies,
          dislikedFoods: form.dislikedFoods
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? t("failedSettings"));
      await update({ onboardingComplete: true });
      const kitchenChanged = kitchenSnapshot(form) !== savedKitchen;
      setSavedSnap(snapshot(form));
      setSavedKitchen(kitchenSnapshot(form));
      if (hasPaid && kitchenChanged) {
        setAskRebuild(true);
        setTab("plan");
        toast.success(t("savedNeedRebuild"));
      } else {
        setAskRebuild(false);
        toast.success(t("profileSaved"));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("failedSettings"));
    } finally {
      setSaving(false);
    }
  };

  const rebuild = async () => {
    if (!childId) return;
    setRebuilding(true);
    try {
      const res = await fetch("/api/kidfuel/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childProfileId: childId, regenerate: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? t("failedPlan"));
      setAskRebuild(false);
      toast.success(t("planRebuilt"));
      router.push("/results");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("failedPlan"));
    } finally {
      setRebuilding(false);
    }
  };

  const logout = async () => {
    if (dirty && !window.confirm(t("unsavedLeave"))) return;
    setLoggingOut(true);
    try {
      await signOut({ callbackUrl: "/landing" });
    } catch {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <BbCanvas full>
        <OsBusy />
      </BbCanvas>
    );
  }

  if (error) {
    return (
      <BbCanvas full>
        <section className="os-results-empty">
          <ErrorState message={error} onRetry={retry} />
        </section>
      </BbCanvas>
    );
  }

  return (
    <BbCanvas full className={cn("os-onboard os-settings", dirty && "has-unsaved")}>
      <section className="os-auth-grid">
        <div className="os-onboard-form">
          <div className="os-set-head">
            <div className="os-set-head-copy">
              <p className="os-band-kicker">{t("account")}</p>
              <h1 className="os-auth-title">{t("settingsTitle")}</h1>
              <p className="os-onboard-lede os-set-lede">{t("setLede")}</p>
              {hasPaid ? (
                <Link href="/results" className="os-text-link">
                  {t("openTonight")}
                </Link>
              ) : null}
            </div>
            <button
              type="button"
              className="os-set-logout"
              onClick={logout}
              disabled={loggingOut}
            >
              <LogOut strokeWidth={2.6} aria-hidden />
              {loggingOut ? t("loggingOut") : t("logOut")}
            </button>
          </div>

          <div className="os-set-summary" aria-live="polite">
            <span>{form.name || t("yourChild")}</span>
            <span>
              {form.ageYears} {t("years")}
            </span>
            <span>{dietLabel}</span>
            <span>{styleLabel}</span>
          </div>

          <div className="os-set-tabs" role="tablist" aria-label={t("settingsTitle")}>
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={cn("os-step-pill", tab === item.id && "is-on")}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div id="set-panel" role="tabpanel" className="os-set-panel">
            {tab === "child" ? (
              <section className="os-set-card" aria-labelledby="set-child">
                <h2 id="set-child" className="os-set-card-title">
                  {t("setChild")}
                </h2>
                <div>
                  <label className="os-band-kicker" htmlFor="settings-name">
                    {t("name")}
                  </label>
                  <Input
                    id="settings-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={t("namePh")}
                    autoComplete="nickname"
                  />
                </div>
                <div>
                  <p className="os-band-kicker">{t("age")}</p>
                  <p className="os-set-hint">{t("pickOne")}</p>
                  <AgePicker value={form.ageYears} onChange={(ageYears) => setForm({ ...form, ageYears })} />
                </div>
                <div>
                  <p className="os-band-kicker">{t("gender")}</p>
                  <OptionGrid
                    options={[
                      { value: "male", label: t("boy"), mark: "B", tone: "sky" },
                      { value: "female", label: t("girl"), mark: "G", tone: "pink" },
                      { value: "other", label: t("other"), mark: "+", tone: "sage" },
                    ]}
                    value={form.gender}
                    onChange={(v) => setForm({ ...form, gender: v as ChildGender })}
                    columns={3}
                  />
                </div>
                <details className="os-optional" open={Boolean(form.heightCm || form.weightKg)}>
                  <summary className="os-band-kicker">{t("optionalHw")}</summary>
                  <div className="os-hw-grid">
                    <div>
                      <label className="os-band-kicker" htmlFor="settings-height">
                        {t("heightCm")}
                      </label>
                      <Input
                        id="settings-height"
                        inputMode="decimal"
                        value={form.heightCm}
                        onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                        placeholder="102"
                      />
                    </div>
                    <div>
                      <label className="os-band-kicker" htmlFor="settings-weight">
                        {t("weightKg")}
                      </label>
                      <Input
                        id="settings-weight"
                        inputMode="decimal"
                        value={form.weightKg}
                        onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                        placeholder="22"
                      />
                    </div>
                  </div>
                </details>
              </section>
            ) : null}

            {tab === "kitchen" ? (
              <section className="os-set-card" aria-labelledby="set-kitchen">
                <h2 id="set-kitchen" className="os-set-card-title">
                  {t("setKitchen")}
                </h2>
                <div>
                  <p className="os-band-kicker">{t("dietHome")}</p>
                  <p className="os-set-hint">{t("pickOne")}</p>
                  <OptionGrid
                    options={[
                      { value: "vegetarian", label: t("veg"), hint: t("vegHint"), mark: "01", tone: "sage" },
                      { value: "eggetarian", label: t("egg"), hint: t("eggHint"), mark: "02", tone: "yellow" },
                      { value: "non-vegetarian", label: t("nonveg"), hint: t("nonvegHint"), mark: "03", tone: "cocoa" },
                    ]}
                    value={form.dietPreference}
                    onChange={(v) => setForm({ ...form, dietPreference: v as DietPreference })}
                    columns={1}
                  />
                </div>
                <div>
                  <p className="os-band-kicker">{t("regionStyle")}</p>
                  <p className="os-set-hint">{t("pickOne")}</p>
                  <OptionGrid
                    options={[
                      { value: "south-indian", label: t("south"), hint: t("southHint"), mark: "S", tone: "sage" },
                      { value: "north-indian", label: t("north"), hint: t("northHint"), mark: "N", tone: "yellow" },
                      { value: "mixed-indian", label: t("mixed"), hint: t("mixedHint"), mark: "M", tone: "pink" },
                    ]}
                    value={form.foodStyle}
                    onChange={(v) => setForm({ ...form, foodStyle: v as FoodStyle })}
                    columns={1}
                  />
                </div>
                <div>
                  <p className="os-band-kicker">{t("anyAllergies")}</p>
                  <OptionGrid
                    options={(Object.keys(ALLERGY_KEYS) as FoodAllergy[]).map((value) => ({
                      value,
                      label: t(ALLERGY_KEYS[value]),
                    }))}
                    value={form.allergies}
                    onChange={(v) =>
                      setForm({ ...form, allergies: toggle(form.allergies, v as FoodAllergy) })
                    }
                    multiple
                    columns={2}
                  />
                </div>
                <div>
                  <label className="os-band-kicker" htmlFor="disliked">
                    {t("foodsAvoid")}
                  </label>
                  <Input
                    id="disliked"
                    value={form.dislikedFoods}
                    onChange={(e) => setForm({ ...form, dislikedFoods: e.target.value })}
                    placeholder={t("foodsAvoidPh")}
                  />
                </div>
              </section>
            ) : null}

            {tab === "focus" ? (
              <section className="os-set-card" aria-labelledby="set-focus">
                <h2 id="set-focus" className="os-set-card-title">
                  {t("setFocus")}
                </h2>
                <div>
                  <p className="os-band-kicker">{t("roomChallenges")}</p>
                  <p className="os-set-hint">{t("challengeTick")}</p>
                  <OptionGrid
                    options={(Object.keys(CHALLENGE_KEYS) as NutritionChallenge[]).map((value) => ({
                      value,
                      label: t(CHALLENGE_KEYS[value]),
                      mark: CHALLENGE_MARKS[value].mark,
                      tone: CHALLENGE_MARKS[value].tone,
                    }))}
                    value={form.challenges}
                    onChange={(v) =>
                      setForm({ ...form, challenges: toggle(form.challenges, v as NutritionChallenge) })
                    }
                    multiple
                    columns={1}
                  />
                </div>
                <div>
                  <p className="os-band-kicker">{t("roomGoal")}</p>
                  <p className="os-set-hint">{t("pickOne")}</p>
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
                </div>
              </section>
            ) : null}

            {tab === "account" ? (
              <section className="os-set-card" aria-labelledby="set-account">
                <h2 id="set-account" className="os-set-card-title">
                  {t("account")}
                </h2>
                {session?.user?.email ? (
                  <p className="os-set-email">
                    <span className="os-band-kicker">{t("signedInAs")}</span>
                    {session.user.email}
                  </p>
                ) : null}
                <div className="os-appear">
                  <div>
                    <p className="os-band-kicker">{t("appearance")}</p>
                    <p className="os-set-hint">{t("appearanceHint")}</p>
                  </div>
                  <ThemeToggle showLabel />
                </div>
                <button
                  type="button"
                  className="os-set-logout os-set-logout-block"
                  onClick={logout}
                  disabled={loggingOut}
                >
                  <LogOut strokeWidth={2.6} aria-hidden />
                  {loggingOut ? t("loggingOut") : t("logOut")}
                </button>
              </section>
            ) : null}

            {tab === "plan" && hasPaid && childId ? (
              <section className="os-set-card os-set-plan" aria-labelledby="set-plan">
                <h2 id="set-plan" className="os-set-card-title">
                  {t("setPlan")}
                </h2>
                <p className="os-onboard-lede">{askRebuild ? t("savedNeedRebuild") : t("setPlanNote")}</p>
                <div className="os-set-plan-actions">
                  <Link href="/results" className="bb-cta">
                    {t("openTonight")}
                  </Link>
                  <button type="button" className="bb-cta-ghost" onClick={rebuild} disabled={rebuilding}>
                    {rebuilding ? t("rebuilding") : t("rebuildPlan")}
                  </button>
                </div>
                <ResultsPdfDownload childProfileId={childId} />
              </section>
            ) : null}
          </div>

          {dirty ? (
            <div className="os-set-bar">
              <p className="os-set-hint">{t("unsavedHint")}</p>
              <button type="button" className="bb-cta os-set-save" onClick={save} disabled={saving}>
                {saving ? t("saving") : t("saveChanges")}
              </button>
            </div>
          ) : null}
        </div>

        <div className="os-auth-pack">
          <MealPack
            name={form.name || t("yourChild")}
            slot={`${form.ageYears} ${t("years")}`}
            tone="sage"
            size="lg"
            note={t(GOAL_KEYS[form.goal])}
            lift={false}
          />
        </div>
      </section>
    </BbCanvas>
  );
}
