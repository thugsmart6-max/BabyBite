import { motherCopy, type MotherCopyKey, type MotherLang } from "@/lib/mother-copy";

const ERROR_MAP: Record<string, MotherCopyKey> = {
  "Failed to load profile": "failedPlan",
  "Failed to load plan": "failedPlan",
  "Failed to generate plan": "failedPlan",
  "Failed to save profile": "couldNotLoad",
  "Failed to save meal plan": "couldNotLoad",
  "Failed to create account": "couldNotLoad",
  "Failed to send PDF": "pdfSendFail",
  "Failed to send email. Please try again.": "pdfSendFail",
  "Invalid email": "invalidEmail",
  "This email is already registered to another account": "emailTaken",
  REQUEST_TIMEOUT: "requestTimeout",
  "Email already registered": "emailTaken",
};

/** Map known API English errors to localized copy; unknown messages fall back safely. */
export function translateApiError(lang: MotherLang, message: string | undefined | null): string {
  const raw = (message ?? "").trim();
  if (!raw) return motherCopy(lang, "genericApiError");
  const key = ERROR_MAP[raw];
  if (key) return motherCopy(lang, key);
  if (raw === "REQUEST_TIMEOUT") return motherCopy(lang, "requestTimeout");
  if (/^Failed/i.test(raw) || /please try again/i.test(raw)) {
    return motherCopy(lang, "genericApiError");
  }
  return raw;
}
