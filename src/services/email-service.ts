import { Resend } from "resend";
import { EmailLog } from "@/models/EmailLog";
import { connectDB } from "@/lib/mongodb";
import type { GeneratedMealPlan, KidFuelChildProfile } from "@/types/kidfuel";

function subjectFor(name: string) {
  return `${name}'s 30 days are written | BabyBite`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatEmailError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return "Email failed — check RESEND_FROM_EMAIL and your Resend domain settings";
}

function babyBiteFromAddress(): string {
  const raw = (process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev").trim();
  const angled = raw.match(/<([^>]+)>/);
  const email = (angled?.[1] ?? raw.replace(/[<>]/g, "").trim());
  return `BabyBite <${email}>`;
}

function slotLabel(slot: GeneratedMealPlan["today"]["meals"][number]["slot"]): string {
  const labels = {
    breakfast: "Breakfast",
    morningSnack: "Morning snack",
    lunch: "Lunch",
    eveningSnack: "Evening snack",
    dinner: "Dinner",
  } as const;
  return labels[slot];
}

const SLOT_ORDER = ["breakfast", "morningSnack", "lunch", "eveningSnack", "dinner"] as const;

function buildHtml(profile: KidFuelChildProfile, plan: GeneratedMealPlan): string {
  const name = escapeHtml(profile.name);
  const age = profile.ageYears;
  const meals = SLOT_ORDER.map((slot, index) => {
    const meal = plan.today.meals.find((item) => item.slot === slot);
    if (!meal) return "";
    const mark = String(index + 1).padStart(2, "0");
    const isDinner = slot === "dinner";
    const rowBg = isDinner ? "#f6d326" : "#ffffff";
    return `
      <tr>
        <td style="padding:0 0 10px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:2.5px solid #111111;border-radius:18px;background:${rowBg};">
            <tr>
              <td width="48" valign="middle" style="width:48px;padding:14px 0 14px 14px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:800;letter-spacing:0.12em;color:#111111;">${mark}</td>
              <td valign="middle" style="padding:14px 16px 14px 8px;font-family:Arial,Helvetica,sans-serif;color:#111111;">
                <p style="margin:0 0 4px 0;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#111111;">${slotLabel(slot)}</p>
                <p style="margin:0;font-size:17px;font-weight:800;line-height:1.2;color:#111111;">${escapeHtml(meal.name)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>${name}'s 30 days | BabyBite</title>
</head>
<body style="margin:0;padding:0;background:#111111;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Tonight is written for ${name}. Five plates today. The 30-day PDF is attached.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#111111;">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;background:#ffffff;border:2.5px solid #111111;border-radius:28px;overflow:hidden;">
          <tr>
            <td style="background:#f6d326;padding:20px 24px;border-bottom:2.5px solid #111111;text-align:center;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:800;letter-spacing:0.28em;text-transform:uppercase;color:#111111;">BabyBite</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px 8px 24px;">
              <p style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#111111;">Tonight is written${age ? ` · ${age} years` : ""}</p>
              <h1 style="margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;font-size:30px;line-height:1.02;letter-spacing:-0.04em;text-transform:uppercase;color:#111111;">${name}'s 30 days</h1>
              <p style="margin:0 0 22px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#444444;">Indian plates for ages 4–12. Tape the fridge PDF. WhatsApp tonight. Educational guidance only — not medical advice.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 8px 24px;">
              <p style="margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#111111;">Today's meals</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${meals}</table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 24px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6d326;border:2.5px solid #111111;border-radius:999px;">
                <tr>
                  <td align="center" style="padding:14px 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;color:#111111;">Tape the fridge PDF — attached</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 28px 24px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#666666;">The full 30-day PDF is attached. BabyBite does not promise extra centimetres of height. Consult your paediatrician for health concerns.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildText(profile: KidFuelChildProfile, plan: GeneratedMealPlan): string {
  const lines = SLOT_ORDER.map((slot) => {
    const meal = plan.today.meals.find((item) => item.slot === slot);
    return meal ? `${slotLabel(slot)}: ${meal.name}` : "";
  }).filter(Boolean);

  return [
    `BabyBite — tonight is written`,
    `${profile.name}'s 30 days`,
    "",
    ...lines,
    "",
    "The full 30-day PDF is attached. Tape it to the fridge.",
    "Educational guidance only — not medical advice. BabyBite does not promise extra centimetres of height.",
  ].join("\n");
}

export async function sendPlanEmail({
  userId,
  childProfileId,
  to,
  profile,
  plan,
  pdfBuffer,
  fileName,
}: {
  userId: string;
  childProfileId: string;
  to: string;
  profile: KidFuelChildProfile;
  plan: GeneratedMealPlan;
  pdfBuffer: Buffer;
  fileName: string;
}) {
  await connectDB();
  const subject = subjectFor(profile.name);

  if (!process.env.RESEND_API_KEY) {
    await EmailLog.create({
      userId,
      childProfileId,
      to,
      subject,
      status: "skipped",
      error: "RESEND_API_KEY not configured",
    });
    return { sent: false, reason: "Email skipped — configure RESEND_API_KEY" };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = babyBiteFromAddress();

  try {
    await resend.emails.send({
      from,
      to,
      subject,
      html: buildHtml(profile, plan),
      text: buildText(profile, plan),
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer.toString("base64"),
        },
      ],
    });

    await EmailLog.create({
      userId,
      childProfileId,
      to,
      subject,
      status: "sent",
      sentAt: new Date(),
    });

    return { sent: true };
  } catch (error) {
    const message = formatEmailError(error);
    await EmailLog.create({
      userId,
      childProfileId,
      to,
      subject,
      status: "failed",
      error: message,
    });
    return { sent: false, reason: message };
  }
}
