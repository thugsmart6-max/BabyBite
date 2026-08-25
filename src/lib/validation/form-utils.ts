import type { ZodError, ZodType } from "zod";

export type FieldErrors<T extends Record<string, unknown>> = Partial<
  Record<keyof T, string>
>;

export function errorsFromZod<T extends Record<string, unknown>>(
  error: ZodError
): FieldErrors<T> {
  const errors: FieldErrors<T> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof T;
    if (key && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export function validateForm<T extends Record<string, unknown>>(
  schema: ZodType<T>,
  values: T
):
  | { success: true; data: T }
  | { success: false; errors: FieldErrors<T> } {
  const result = schema.safeParse(values);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: errorsFromZod<T>(result.error) };
}

export function validateField<T extends Record<string, unknown>>(
  schema: ZodType<T>,
  values: T,
  field: keyof T
): string | undefined {
  const result = schema.safeParse(values);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

export function parseCommaList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseOptionalNumber(
  value: string,
  label: string
): { ok: true; value: number | undefined } | { ok: false; message: string } {
  if (!value.trim()) return { ok: true, value: undefined };
  const num = Number(value);
  if (Number.isNaN(num)) {
    return { ok: false, message: `${label} must be a valid number` };
  }
  return { ok: true, value: num };
}
