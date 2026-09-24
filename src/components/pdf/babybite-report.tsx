import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { DailyPlan, GeneratedMealPlan, BabyBiteChildProfile } from "@/types/babybite";
import {
  AGE_BAND_LABELS,
  ALLERGY_LABELS,
  CHALLENGE_LABELS,
  GOAL_LABELS,
  MEAL_SLOT_LABELS,
  ageBandForYears,
  kitchenFacts,
} from "@/types/babybite";
import { foodStyleLabel } from "@/services/analysis-engine";
import { growthBandForAge } from "@/lib/growth-bands";
import { checklistSummary } from "@/lib/meal-rationale";

const YELLOW = "#F6D326";
const INK = "#111111";
const MUTED = "#444444";
const PAPER = "#FFFFFF";
const HAIR = "#E8E8E8";

const styles = StyleSheet.create({
  page: {
    paddingTop: 58,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: INK,
    backgroundColor: PAPER,
  },
  coverPage: {
    paddingBottom: 56,
  },
  pageHeader: {
    position: "absolute",
    top: 18,
    left: 40,
    right: 40,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: HAIR,
    backgroundColor: PAPER,
  },
  pageHeaderTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  pageHeaderMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topRule: {
    height: 18,
    backgroundColor: YELLOW,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  brandMeta: { fontSize: 7, color: MUTED },
  title: { fontSize: 17, fontFamily: "Helvetica-Bold", marginBottom: 4, lineHeight: 1.2 },
  subtitle: { fontSize: 9, color: MUTED, marginBottom: 10, lineHeight: 1.4 },
  kicker: {
    fontSize: 8,
    textTransform: "uppercase",
    color: INK,
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
  },
  section: { marginTop: 10 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    color: INK,
    paddingBottom: 4,
    borderBottomWidth: 2.5,
    borderBottomColor: INK,
  },
  profileGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  profileGridDense: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  profileCell: {
    width: "48%",
    padding: 6,
    backgroundColor: YELLOW,
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: INK,
  },
  profileCellDense: {
    width: "31.5%",
    padding: 5,
    backgroundColor: YELLOW,
    borderRadius: 5,
    marginBottom: 3,
    borderWidth: 2,
    borderColor: INK,
    minHeight: 34,
  },
  profileLabel: { fontSize: 7, color: INK, marginBottom: 2, textTransform: "uppercase", fontFamily: "Helvetica-Bold" },
  profileValue: { fontSize: 9, fontFamily: "Helvetica-Bold", lineHeight: 1.25 },
  meal: {
    marginBottom: 8,
    paddingLeft: 10,
    borderLeftWidth: 4,
    borderLeftColor: YELLOW,
    paddingBottom: 6,
  },
  mealSlot: { fontSize: 8, color: INK, marginBottom: 2, textTransform: "uppercase", fontFamily: "Helvetica-Bold" },
  mealName: { fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 2 },
  mealDesc: { color: MUTED, lineHeight: 1.4 },
  mealMeta: { fontSize: 8, color: MUTED, marginTop: 3 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: YELLOW,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: INK,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 3,
    borderBottomWidth: 1,
    borderBottomColor: HAIR,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: INK,
    alignItems: "flex-start",
  },
  colDay: { width: "11%", fontSize: 6.5, lineHeight: 1.2 },
  colMeal: { width: "17.5%", fontSize: 6.5, lineHeight: 1.2 },
  colSnack: { width: "17.5%", fontSize: 6.5, lineHeight: 1.2 },
  coverTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", lineHeight: 1.08, marginBottom: 5 },
  coverLine: { fontSize: 9.5, marginBottom: 2, color: INK },
  coverMuted: { fontSize: 8.5, color: MUTED, marginBottom: 6, lineHeight: 1.35 },
  coverChecklist: { fontSize: 8, color: MUTED, marginBottom: 8, lineHeight: 1.35 },
  coverProfileTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 2,
    borderBottomColor: INK,
  },
  monthColDate: { width: "19%", fontSize: 6.5, fontFamily: "Helvetica-Bold", lineHeight: 1.2 },
  monthColMeal: { width: "20%", fontSize: 6.5, lineHeight: 1.2 },
  listBullet: { fontSize: 8, marginBottom: 3, lineHeight: 1.35 },
  monthRow: { flexDirection: "row", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: HAIR },
  monthDate: { width: "22%", fontSize: 8, color: MUTED, fontFamily: "Helvetica-Bold" },
  monthMeals: { width: "78%", fontSize: 8, lineHeight: 1.35 },
  breakdownRow: { flexDirection: "row", marginBottom: 5 },
  breakdownLabel: { width: "32%", color: MUTED, fontSize: 9, fontFamily: "Helvetica-Bold" },
  breakdownValue: { width: "68%", fontSize: 9, lineHeight: 1.35 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  chip: {
    fontSize: 8,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: INK,
    borderRadius: 10,
    marginRight: 4,
    marginBottom: 4,
    backgroundColor: YELLOW,
    fontFamily: "Helvetica-Bold",
  },
  callout: {
    marginTop: 14,
    padding: 10,
    backgroundColor: YELLOW,
    borderWidth: 2,
    borderColor: INK,
    borderRadius: 8,
  },
  calloutText: { fontSize: 8, color: INK, lineHeight: 1.45 },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: MUTED,
    borderTopWidth: 2,
    borderTopColor: INK,
    paddingTop: 6,
  },
});

const DIET_LABELS = {
  vegetarian: "Vegetarian",
  eggetarian: "Eggetarian",
  "non-vegetarian": "Non-vegetarian",
} as const;

const BREAKDOWN_LABELS: Record<string, string> = {
  protein: "Protein",
  carbohydrates: "Carbohydrates",
  healthyFats: "Healthy fats",
  fiber: "Fibre",
  ironSources: "Iron sources",
  calciumSources: "Calcium sources",
  vitaminSources: "Vitamins",
};

function mealOf(day: DailyPlan, slot: DailyPlan["meals"][number]["slot"]) {
  return day.meals.find((meal) => meal.slot === slot)?.name ?? "—";
}

function truncateCoverText(text: string, maxLen = 240): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen).trim()}…`;
}

function PdfFooter({ childName }: { childName: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>BabyBite · {childName} · Educational guidance only</Text>
    </View>
  );
}

function PageChrome({ childName }: { childName: string }) {
  return (
    <>
      <View style={styles.topRule} fixed />
      <View style={styles.pageHeader} fixed>
        <Text style={styles.pageHeaderTitle}>BABYBITE PERSONALIZED KITCHEN PLAN</Text>
        <View style={styles.pageHeaderMeta}>
          <Text style={styles.brandMeta}>BabyBite · {childName} · Educational guidance only</Text>
          <Text style={styles.brandMeta} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </View>
    </>
  );
}

function ProfileFields({
  profile,
  allergyText,
  challengeText,
  kitchen,
  dense = false,
}: {
  profile: BabyBiteChildProfile;
  allergyText: string;
  challengeText: string;
  kitchen: ReturnType<typeof kitchenFacts>;
  dense?: boolean;
}) {
  const cellStyle = dense ? styles.profileCellDense : styles.profileCell;
  const gridStyle = dense ? styles.profileGridDense : styles.profileGrid;
  const fields: [string, string][] = [
    ["Age", `${profile.ageYears} years`],
    ["Plate", AGE_BAND_LABELS[ageBandForYears(profile.ageYears)]],
    ["Goal", GOAL_LABELS[profile.goal]],
    ["Diet", DIET_LABELS[profile.dietPreference]],
    ["Kitchen style", foodStyleLabel(profile.foodStyle)],
    ["Allergies", allergyText],
    ["Challenges", challengeText],
    ["Cook time", kitchen.cookTime === "ten-min" ? "10 minutes" : "Normal"],
    ["Budget", kitchen.kitchenBudget === "tight" ? "Tight" : "Normal"],
    ["Rice", kitchen.riceHabit === "refuses-rice" ? "No plated rice" : "Eats rice"],
    ["Lunch", kitchen.tiffinNeed === "school-lunch" ? "School tiffin" : "Home table"],
  ];

  return (
    <View style={gridStyle}>
      {fields.map(([label, value]) => (
        <View key={label} style={cellStyle}>
          <Text style={styles.profileLabel}>{label}</Text>
          <Text style={styles.profileValue}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

function MonthCalendarTable({ days }: { days: DailyPlan[] }) {
  return (
    <>
      <View style={styles.tableHeader}>
        <Text style={[styles.monthColDate, { fontFamily: "Helvetica-Bold" }]}>Date</Text>
        <Text style={[styles.monthColMeal, { fontFamily: "Helvetica-Bold" }]}>Breakfast</Text>
        <Text style={[styles.monthColMeal, { fontFamily: "Helvetica-Bold" }]}>Lunch</Text>
        <Text style={[styles.monthColMeal, { fontFamily: "Helvetica-Bold" }]}>Dinner</Text>
        <Text style={[styles.monthColMeal, { fontFamily: "Helvetica-Bold" }]}>Snack</Text>
      </View>
      {days.map((day) => (
        <View key={day.date} style={styles.tableRow}>
          <Text style={styles.monthColDate}>
            {day.date} · {day.dayLabel}
          </Text>
          <Text style={styles.monthColMeal}>{mealOf(day, "breakfast")}</Text>
          <Text style={styles.monthColMeal}>{mealOf(day, "lunch")}</Text>
          <Text style={styles.monthColMeal}>{mealOf(day, "dinner")}</Text>
          <Text style={styles.monthColMeal}>{mealOf(day, "eveningSnack")}</Text>
        </View>
      ))}
    </>
  );
}

export function BabyBitePDFDocument({
  profile,
  plan,
}: {
  profile: BabyBiteChildProfile;
  plan: GeneratedMealPlan;
}) {
  const allergyText = profile.allergies.length
    ? profile.allergies.map((item) => ALLERGY_LABELS[item]).join(", ")
    : "None listed";
  const challengeText = profile.challenges.length
    ? profile.challenges.map((item) => CHALLENGE_LABELS[item]).join(", ")
    : "None listed";
  const avoidText = profile.dislikedFoods.length ? profile.dislikedFoods.join(", ") : "None listed";
  const kitchen = kitchenFacts(profile);
  const checklist = plan.checklistSummary ?? checklistSummary(profile);
  const band = growthBandForAge(profile.ageYears);
  const heightNote = profile.heightCm ? `You noted ${profile.heightCm} cm.` : "Height not noted yet.";
  const weightNote = profile.weightKg ? `You noted ${profile.weightKg} kg.` : "Weight not noted yet.";
  const nameUpper = profile.name.toUpperCase();
  const monthMid = Math.ceil(plan.monthly.length / 2);
  const monthFirst = plan.monthly.slice(0, monthMid);
  const monthSecond = plan.monthly.slice(monthMid);

  return (
    <Document
      title={`${profile.name} — BabyBite meal plan`}
      author="BabyBite"
      subject="Personalized Indian nutrition plan for ages 4–12"
    >
      <Page size="A4" style={[styles.page, styles.coverPage]}>
        <PageChrome childName={profile.name} />
        <Text style={styles.coverTitle}>{`${nameUpper}’S 30-DAY MEAL PLAN`}</Text>
        <Text style={styles.coverLine}>A personalized kitchen plan</Text>
        <Text style={styles.coverLine}>Indian plates · Five meals a day · Ages 4–12</Text>
        <Text style={styles.coverMuted}>Designed around the checklist provided for {profile.name}.</Text>
        <Text style={styles.coverChecklist}>Checklist: {truncateCoverText(checklist)}</Text>
        <Text style={styles.coverProfileTitle}>{profile.name}’s kitchen profile</Text>
        <ProfileFields
          profile={profile}
          allergyText={allergyText}
          challengeText={challengeText}
          kitchen={kitchen}
          dense
        />
        <Text style={{ fontSize: 8, color: MUTED, marginTop: 6 }}>Foods to avoid: {avoidText}</Text>
        <View style={[styles.callout, { marginTop: 8, padding: 7 }]}>
          <Text style={styles.calloutText}>
            Educational guidance only. Today’s meals and growth bands are on page 2.
          </Text>
        </View>
        <PdfFooter childName={profile.name} />
      </Page>

      <Page size="A4" style={styles.page}>
        <PageChrome childName={profile.name} />
        <Text style={styles.kicker}>Height and weight</Text>
        <Text style={styles.sectionTitle}>What this kitchen is for</Text>
        <Text style={{ fontSize: 9, lineHeight: 1.4, marginBottom: 8 }}>
          Children aged {profile.ageYears} often sit around {band.heightCm} and {band.weightKg}. These plates
          fill energy, protein, and calcium so {profile.name}’s body can grow. BabyBite does not promise extra
          centimetres of height.
        </Text>
        <View style={styles.profileGrid}>
          <View style={styles.profileCell}>
            <Text style={styles.profileLabel}>Usual height band</Text>
            <Text style={styles.profileValue}>{band.heightCm}</Text>
            <Text style={{ fontSize: 8, color: MUTED, marginTop: 3 }}>{heightNote}</Text>
          </View>
          <View style={styles.profileCell}>
            <Text style={styles.profileLabel}>Usual weight band</Text>
            <Text style={styles.profileValue}>{band.weightKg}</Text>
            <Text style={{ fontSize: 8, color: MUTED, marginTop: 3 }}>{weightNote}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.kicker}>Today’s plate</Text>
          <Text style={styles.sectionTitle}>
            {plan.today.dayLabel} · Breakfast to dinner
          </Text>
        </View>
        {plan.today.meals.map((meal) => (
          <View key={meal.slot} style={styles.meal}>
            <Text style={styles.mealSlot}>
              {MEAL_SLOT_LABELS[meal.slot]} · Why this plate
            </Text>
            <Text style={styles.mealName}>
              {meal.name}
              {meal.whyThisPlate ? ` ${meal.whyThisPlate}` : ""}
            </Text>
            <Text style={styles.mealDesc}>{meal.description}</Text>
            <Text style={styles.mealMeta}>
              ~{meal.caloriesApprox} kcal
              {meal.portionNote ? ` · ${meal.portionNote}` : ""}
            </Text>
          </View>
        ))}
        <View style={styles.callout}>
          <Text style={styles.calloutText}>
            Print this PDF for the fridge. It is educational nutrition guidance, not a medical
            prescription. If {profile.name} has a clinical condition, speak with your paediatrician
            before changing the diet.
          </Text>
        </View>
        <PdfFooter childName={profile.name} />
      </Page>

      <Page size="A4" style={styles.page}>
        <PageChrome childName={profile.name} />
        <Text style={styles.sectionTitle}>This week</Text>
        <Text style={{ fontSize: 9, color: MUTED, marginBottom: 8 }}>Main meals + two snack slots</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.colDay, { fontFamily: "Helvetica-Bold" }]}>Day</Text>
          <Text style={[styles.colMeal, { fontFamily: "Helvetica-Bold" }]}>Breakfast</Text>
          <Text style={[styles.colMeal, { fontFamily: "Helvetica-Bold" }]}>Lunch</Text>
          <Text style={[styles.colMeal, { fontFamily: "Helvetica-Bold" }]}>Dinner</Text>
          <Text style={[styles.colSnack, { fontFamily: "Helvetica-Bold" }]}>Snack 1</Text>
          <Text style={[styles.colSnack, { fontFamily: "Helvetica-Bold" }]}>Snack 2</Text>
        </View>
        {plan.weekly.map((day) => (
          <View key={day.date} style={styles.tableRow}>
            <Text style={styles.colDay}>{day.dayLabel}</Text>
            <Text style={styles.colMeal}>{mealOf(day, "breakfast")}</Text>
            <Text style={styles.colMeal}>{mealOf(day, "lunch")}</Text>
            <Text style={styles.colMeal}>{mealOf(day, "dinner")}</Text>
            <Text style={styles.colSnack}>{mealOf(day, "morningSnack")}</Text>
            <Text style={styles.colSnack}>{mealOf(day, "eveningSnack")}</Text>
          </View>
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Snacks this week</Text>
          {plan.weekly.map((day) => (
            <Text key={`${day.date}-snack`} style={styles.listBullet}>
              {day.dayLabel}: {mealOf(day, "morningSnack")} · {mealOf(day, "eveningSnack")}
            </Text>
          ))}
        </View>
        <PdfFooter childName={profile.name} />
      </Page>

      <Page size="A4" style={styles.page}>
        <PageChrome childName={profile.name} />
        <Text style={styles.kicker}>Kitchen options</Text>
        <Text style={styles.sectionTitle}>If they refuse the plate</Text>
        <Text style={styles.kicker}>Rice refusal</Text>
        <Text style={{ fontSize: 9, color: MUTED, marginBottom: 10 }}>
          Rice refusal means plated rice — roti, dosa, poha, and millets stay.
        </Text>
        {plan.today.meals.map((meal) => (
          <View key={`swap-${meal.slot}`} style={styles.meal} wrap={false}>
            <Text style={styles.mealSlot}>{MEAL_SLOT_LABELS[meal.slot]}</Text>
            <Text style={styles.mealName}>{meal.name}</Text>
            {meal.minutes ? <Text style={styles.mealMeta}>{meal.minutes} minutes</Text> : null}
            {(meal.swaps ?? []).map((swap, index) => (
              <Text key={swap.name} style={styles.mealDesc}>
                Option {index + 1}: {swap.name} — {swap.why}
              </Text>
            ))}
          </View>
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evening snacks this week</Text>
          <Text style={styles.listBullet}>
            {plan.weekly.map((day) => `${day.dayLabel}: ${mealOf(day, "eveningSnack")}`).join(" · ")}
          </Text>
        </View>
        <PdfFooter childName={profile.name} />
      </Page>

      <Page size="A4" style={styles.page}>
        <PageChrome childName={profile.name} />
        <Text style={styles.kicker}>Quick food guide</Text>
        <Text style={styles.sectionTitle}>School tiffin · 10-minute food · No plated rice</Text>

        {profile.tiffinNeed === "school-lunch" || plan.kitchenLists?.schoolLunch?.length ? (
          <View style={styles.section}>
            <Text style={styles.kicker}>School tiffin</Text>
            {(plan.kitchenLists?.schoolLunch?.length ?? 0) > 0 ? (
              plan.kitchenLists!.schoolLunch.slice(0, 8).map((meal) => (
                <Text key={meal.name} style={styles.listBullet}>
                  • {meal.name}
                  {meal.minutes ? ` · ${meal.minutes} min` : ""}
                </Text>
              ))
            ) : (
              <Text style={styles.listBullet}>No school box meals in this kitchen yet.</Text>
            )}
          </View>
        ) : null}

        {plan.kitchenLists?.tenMin?.length ? (
          <View style={styles.section}>
            <Text style={styles.kicker}>10-minute food</Text>
            {plan.kitchenLists.tenMin.slice(0, 8).map((meal) => (
              <Text key={meal.name} style={styles.listBullet}>
                • {meal.name}
                {meal.minutes ? ` · ${meal.minutes} min` : ""}
              </Text>
            ))}
          </View>
        ) : null}

        {plan.kitchenLists?.riceFree?.length ? (
          <View style={styles.section}>
            <Text style={styles.kicker}>No plated rice</Text>
            {plan.kitchenLists.riceFree.slice(0, 8).map((meal) => (
              <Text key={meal.name} style={styles.listBullet}>
                • {meal.name}
              </Text>
            ))}
          </View>
        ) : null}
        <PdfFooter childName={profile.name} />
      </Page>

      <Page size="A4" style={styles.page}>
        <PageChrome childName={profile.name} />
        <Text style={styles.sectionTitle}>30-day calendar</Text>
        <Text style={styles.kicker}>Part 1 · A rotating pool of Indian meals</Text>
        <MonthCalendarTable days={monthFirst} />
        <PdfFooter childName={profile.name} />
      </Page>

      <Page size="A4" style={styles.page}>
        <PageChrome childName={profile.name} />
        <Text style={styles.sectionTitle}>30-day calendar</Text>
        <Text style={styles.kicker}>Part 2 · A rotating pool of Indian meals</Text>
        <MonthCalendarTable days={monthSecond} />
        <PdfFooter childName={profile.name} />
      </Page>

      <Page size="A4" style={styles.page}>
        <PageChrome childName={profile.name} />
        <Text style={styles.kicker}>Nutrition notes</Text>
        <Text style={styles.sectionTitle}>Daily average + kitchen reference</Text>
        <Text style={[styles.kicker, { marginTop: 8 }]}>Daily average</Text>
        {Object.entries(plan.breakdown).map(([key, value]) => (
          <View key={key} style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{BREAKDOWN_LABELS[key] ?? key}</Text>
            <Text style={styles.breakdownValue}>{value}</Text>
          </View>
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Keep these in the kitchen</Text>
          <Text style={{ fontSize: 9, lineHeight: 1.45 }}>
            {plan.recommendedFoods.join(" · ")}
          </Text>
        </View>

        <View style={styles.callout}>
          <Text style={styles.calloutText}>
            BabyBite is for mothers of children aged 4–12. Meals are educational suggestions from
            the profile you provided. They are not a diagnosis, supplement plan, or substitute for
            professional medical advice. © BabyBite {new Date().getFullYear()}
          </Text>
        </View>
        <PdfFooter childName={profile.name} />
      </Page>
    </Document>
  );
}
