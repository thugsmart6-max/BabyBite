"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { AuthShell } from "@/components/blimp/site-chrome";
import { BbCanvas } from "@/components/kidfuel/bb-canvas";
import { TermsAgreementGate } from "@/components/shared/terms-agreement-gate";
import { useMotherLocale } from "@/components/providers/locale-provider";
import { FormField, inputStateClass } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useZodForm } from "@/hooks/use-zod-form";
import { signupFormSchema } from "@/schemas/forms";
import { TERMS_VERSION } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function SignupForm() {
  const { t } = useMotherLocale();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { values, setField, touchField, validateAll, getError, touched } = useZodForm(
    signupFormSchema,
    { name: "", email: "", password: "", confirmPassword: "" }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast.error(t("acceptTerms"));
      return;
    }

    const result = validateAll();
    if (!result.success) return;

    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...result.data,
        acceptedTerms: true,
        termsVersion: TERMS_VERSION,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      toast.error(data.error ?? t("signupFail"));
      return;
    }

    const signInResult = await signIn("credentials", {
      email: result.data.email,
      password: result.data.password,
      redirect: false,
    });
    setLoading(false);

    if (signInResult?.error) {
      toast.error(t("createdSignIn"));
      router.push("/login");
      return;
    }

    toast.success(t("welcomeBite"));
    router.push("/onboarding");
    router.refresh();
  };

  if (!termsAccepted) {
    return (
      <BbCanvas full>
        <TermsAgreementGate
          embedded
          onAccept={() => setTermsAccepted(true)}
          onDecline={() => router.push("/landing")}
        />
      </BbCanvas>
    );
  }

  return (
    <AuthShell title={t("createAccount")} subtitle={t("termsSub")}>
      <p className="text-xs text-muted-foreground border border-border p-3 mb-6 leading-relaxed">
        {t("acceptedTermsNote")}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <FormField id="name" label={t("fullName")} required error={getError("name")}>
          <Input
            id="name"
            autoComplete="name"
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            onBlur={() => touchField("name")}
            className={inputStateClass(getError("name"), touched.name)}
            aria-invalid={!!getError("name")}
          />
        </FormField>

        <FormField id="email" label={t("email")} required error={getError("email")}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => setField("email", e.target.value)}
            onBlur={() => touchField("email")}
            className={inputStateClass(getError("email"), touched.email)}
            aria-invalid={!!getError("email")}
          />
        </FormField>

        <FormField
          id="password"
          label={t("password")}
          required
          error={getError("password")}
          hint={t("passwordHint")}
        >
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={values.password}
              onChange={(e) => setField("password", e.target.value)}
              onBlur={() => touchField("password")}
              className={cn("pr-10", inputStateClass(getError("password"), touched.password))}
              aria-invalid={!!getError("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-accent"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>

        <FormField
          id="confirmPassword"
          label={t("confirmPassword")}
          required
          error={getError("confirmPassword")}
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={(e) => setField("confirmPassword", e.target.value)}
            onBlur={() => touchField("confirmPassword")}
            className={inputStateClass(getError("confirmPassword"), touched.confirmPassword)}
            aria-invalid={!!getError("confirmPassword")}
          />
        </FormField>

        <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
          {loading ? t("creating") : t("createAccountBtn")}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="os-or-chip">{t("or")}</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={loading}
        onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
      >
        {t("continueGoogle")}
      </Button>

      <p className="mt-6 text-xs text-muted-foreground">
        <button
          type="button"
          className="text-foreground hover:text-accent underline-offset-4 hover:underline"
          onClick={() => setTermsAccepted(false)}
        >
          {t("reviewTerms")}
        </button>
      </p>

      <p className="mt-4 text-sm text-muted-foreground">
        {t("haveAccountQ")}{" "}
        <Link href="/login" className="text-foreground hover:text-accent underline-offset-4 hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
