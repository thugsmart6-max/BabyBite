import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { DailyPlan, GeneratedMealPlan, KidFuelChildProfile } from "@/types/kidfuel";
import {
  ALLERGY_LABELS,
  CHALLENGE_LABELS,
  GOAL_LABELS,
  MEAL_SLOT_LABELS,
} from "@/types/kidfuel";
import { foodStyleLabel } from "@/services/analysis-engine";
import { growthBandForAge } from "@/lib/growth-bands";

const YELLOW = "#F6D326";
const INK = "#111111";
const MUTED = "#444444";
const PAPER = "#FFFFFF";
const HAIR = "#E8E8E8";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 52,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: INK,
    backgroundColor: PAPER,
  },
  topRule: {
    height: 18,
    backgroundColor: YELLOW,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 18,
    marginTop: 8,
  },
  brand: {
    fontSize: 11,
    letterSpacing: 2.8,
    color: INK,
    fontFamily: "Helvetica-Bold",
  },
  brandMeta: { fontSize: 8, color: MUTED },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 6, lineHeight: 1.2 },
  subtitle: { fontSize: 11, color: MUTED, marginBottom: 16, lineHeight: 1.45 },
  kicker: {
    fontSize: 8,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: INK,
    marginBottom: 6,
    fontFamily: "Helvetica-Bold",
  },
  section: { marginTop: 16 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    color: INK,
    paddingBottom: 4,
    borderBottomWidth: 2.5,
    borderBottomColor: INK,
  },
  profileGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  profileCell: {
    width: "48%",
    padding: 8,
    backgroundColor: YELLOW,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 2,
    borderColor: INK,
  },
  profileLabel: { fontSize: 7, letterSpacing: 1, color: INK, marginBottom: 3, textTransform: "uppercase" },
  profileValue: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  meal: {
    marginBottom: 8,
    paddingLeft: 10,
    borderLeftWidth: 4,
    borderLeftColor: YELLOW,
    paddingBottom: 6,
  },
  mealSlot: { fontSize: 8, letterSpacing: 1, color: INK, marginBottom: 2, textTransform: "uppercase", fontFamily: "Helvetica-Bold" },
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
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: HAIR,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: INK,
  },
  colDay: { width: "16%", fontSize: 8 },
  colMeal: { width: "28%", fontSize: 8 },
  colSnack: { width: "28%", fontSize: 8 },
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

function PdfFooter({ childName }: { childName: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>BabyBite · {childName} · Educational guidance only, not medical advice · Ages 4–12</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function PageChrome({ prepared }: { prepared: string }) {
  return (
    <>
      <View style={styles.topRule} fixed />
      <View style={styles.brandRow}>
        <Text style={styles.brand}>BABYBITE</Text>
        <Text style={styles.brandMeta}>{prepared}</Text>
      </View>
    </>
  );
}

export function KidFuelPDFDocument({
  profile,
  plan,
}: {
  profile: KidFuelChildProfile;
  plan: GeneratedMealPlan;
}) {
  const prepared = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const allergyText = profile.allergies.length
    ? profile.allergies.map((item) => ALLERGY_LABELS[item]).join(", ")
    : "None listed";
  const challengeText = profile.challenges.length
    ? profile.challenges.map((item) => CHALLENGE_LABELS[item]).join(", ")
    : "None listed";
  const avoidText = profile.dislikedFoods.length ? profile.dislikedFoods.join(", ") : "None listed";
  const band = growthBandForAge(profile.ageYears);
  const heightNote = profile.heightCm ? `You noted ${profile.heightCm} cm.` : "Height not noted yet.";
  const weightNote = profile.weightKg ? `You noted ${profile.weightKg} kg.` : "Weight not noted yet.";

  return (
    <Document
      title={`${profile.name} — BabyBite meal plan`}
      author="BabyBite"
      subject="Personalized Indian nutrition plan for ages 4–12"
    >
      <Page size="A4" style={styles.page}>
        <PageChrome prepared={prepared} />
        <Text style={styles.kicker}>Personalized kitchen plan</Text>
        <Text style={styles.title}>{`${profile.name}’s meals for the next 30 days`}</Text>
        <Text style={styles.subtitle}>
          Written for the mother who already runs this table. Indian plates, five meals a day, ages
          4–12. Built from onboarding — diet, allergies, and {GOAL_LABELS[profile.goal].toLowerCase()}.
        </Text>

        <View style={styles.profileGrid}>
          {[
            ["Age", `${profile.ageYears} years`],
            ["Goal", GOAL_LABELS[profile.goal]],
            ["Diet", DIET_LABELS[profile.dietPreference]],
            ["Kitchen style", foodStyleLabel(profile.foodStyle)],
            ["Allergies", allergyText],
            ["Challenges", challengeText],
          ].map(([label, value]) => (
            <View key={label} style={styles.profileCell}>
              <Text style={styles.profileLabel}>{label}</Text>
              <Text style={styles.profileValue}>{value}</Text>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: 9, color: MUTED, marginTop: 4 }}>Foods to avoid: {avoidText}</Text>

        <View style={styles.section}>
          <Text style={styles.kicker}>Height and weight</Text>
          <Text style={styles.sectionTitle}>What this kitchen is for</Text>
          <Text style={{ fontSize: 10, lineHeight: 1.45, marginBottom: 8 }}>
            Children aged {profile.ageYears} often sit around {band.heightCm} and {band.weightKg}.
            These plates fill energy, protein, and calcium so {profile.name}’s body can do its own
            growing. BabyBite does not promise extra centimetres of height.
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today — {plan.today.dayLabel}</Text>
          {plan.today.meals.map((meal) => (
            <View key={meal.slot} style={styles.meal} wrap={false}>
              <Text style={styles.mealSlot}>{MEAL_SLOT_LABELS[meal.slot]}</Text>
              <Text style={styles.mealName}>{meal.name}</Text>
              <Text style={styles.mealDesc}>{meal.description}</Text>
              <Text style={styles.mealMeta}>
                ~{meal.caloriesApprox} kcal
                {meal.portionNote ? `  ·  ${meal.portionNote}` : ""}
              </Text>
            </View>
          ))}
        </View>

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
        <PageChrome prepared={prepared} />
        <Text style={styles.sectionTitle}>This week</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.colDay, { fontFamily: "Helvetica-Bold" }]}>Day</Text>
          <Text style={[styles.colMeal, { fontFamily: "Helvetica-Bold" }]}>Breakfast</Text>
          <Text style={[styles.colMeal, { fontFamily: "Helvetica-Bold" }]}>Lunch</Text>
          <Text style={[styles.colSnack, { fontFamily: "Helvetica-Bold" }]}>Dinner</Text>
        </View>
        {plan.weekly.map((day) => (
          <View key={day.date} style={styles.tableRow} wrap={false}>
            <Text style={styles.colDay}>{day.dayLabel}</Text>
            <Text style={styles.colMeal}>{mealOf(day, "breakfast")}</Text>
            <Text style={styles.colMeal}>{mealOf(day, "lunch")}</Text>
            <Text style={styles.colSnack}>{mealOf(day, "dinner")}</Text>
          </View>
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Snacks this week</Text>
          {plan.weekly.map((day) => (
            <Text key={`${day.date}-snack`} style={{ marginBottom: 3, fontSize: 9 }}>
              {day.dayLabel}: {mealOf(day, "morningSnack")} · {mealOf(day, "eveningSnack")}
            </Text>
          ))}
        </View>
        <PdfFooter childName={profile.name} />
      </Page>

      <Page size="A4" style={styles.page}>
        <PageChrome prepared={prepared} />
        <Text style={styles.sectionTitle}>30-day calendar</Text>
        <Text style={{ fontSize: 9, color: MUTED, marginBottom: 10 }}>
          A rotating pool of Indian meals, filtered for {foodStyleLabel(profile.foodStyle).toLowerCase()}{" "}
          cooking and the allergies you listed.
        </Text>
        {plan.monthly.map((day) => (
          <View key={day.date} style={styles.monthRow} wrap={false}>
            <Text style={styles.monthDate}>
              {day.date}  {day.dayLabel}
            </Text>
            <Text style={styles.monthMeals}>
              {mealOf(day, "breakfast")}  ·  {mealOf(day, "lunch")}  ·  {mealOf(day, "dinner")}
            </Text>
          </View>
        ))}
        <PdfFooter childName={profile.name} />
      </Page>

      <Page size="A4" style={styles.page}>
        <PageChrome prepared={prepared} />
        <Text style={styles.sectionTitle}>Nutrition notes (daily average)</Text>
        {Object.entries(plan.breakdown).map(([key, value]) => (
          <View key={key} style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{BREAKDOWN_LABELS[key] ?? key}</Text>
            <Text style={styles.breakdownValue}>{value}</Text>
          </View>
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Keep these in the kitchen</Text>
          <View style={styles.chips}>
            {plan.recommendedFoods.map((food) => (
              <Text key={food} style={styles.chip}>
                {food}
              </Text>
            ))}
          </View>
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
