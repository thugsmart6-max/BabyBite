import { z } from "zod";
import { TERMS_VERSION } from "@/lib/constants";

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters with letters and numbers")
  .regex(/[a-zA-Z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signupFields = {
  name: z.string().min(2, "Name must be at least 2 characters").max(60, "Name is too long"),
  email: z.string().email("Please enter a valid email address"),
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
};

export const signupFormSchema = z.object(signupFields).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const signupSchema = z
  .object({
    ...signupFields,
    acceptedTerms: z.literal(true, {
      message: "You must accept the Terms & Conditions to create an account",
    }),
    termsVersion: z.string().default(TERMS_VERSION),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const loginFormSchema = loginSchema;

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupFormSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginFormValues = LoginInput;
