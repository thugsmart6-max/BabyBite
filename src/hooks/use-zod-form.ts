"use client";

import { useCallback, useState } from "react";
import type { ZodType } from "zod";
import {
  errorsFromZod,
  validateField,
  type FieldErrors,
} from "@/lib/validation/form-utils";

export function useZodForm<T extends Record<string, unknown>>(
  schema: ZodType<T>,
  initialValues: T
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FieldErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setField = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setValues((prev) => {
        const next = { ...prev, [key]: value };
        setTouched((t) => {
          if (!t[key]) return t;
          const message = validateField(schema, next, key);
          setErrors((e) => ({ ...e, [key]: message }));
          return t;
        });
        return next;
      });
    },
    [schema]
  );

  const touchField = useCallback(
    (key: keyof T) => {
      setTouched((t) => ({ ...t, [key]: true }));
      setValues((prev) => {
        const message = validateField(schema, prev, key);
        setErrors((e) => ({ ...e, [key]: message }));
        return prev;
      });
    },
    [schema]
  );

  const validateAll = useCallback(() => {
    const result = schema.safeParse(values);
    if (result.success) {
      setErrors({});
      return { success: true as const, data: result.data };
    }
    const nextErrors = errorsFromZod<T>(result.error);
    setErrors(nextErrors);
    setTouched(
      Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Partial<Record<keyof T, boolean>>
      )
    );
    return { success: false as const, errors: nextErrors };
  }, [schema, values]);

  const resetErrors = useCallback(() => setErrors({}), []);

  const getError = useCallback(
    (key: keyof T) => (touched[key] ? errors[key] : undefined),
    [errors, touched]
  );

  return {
    values,
    errors,
    touched,
    setValues,
    setField,
    touchField,
    validateAll,
    resetErrors,
    getError,
    setErrors,
  };
}
