"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { AuthShell } from "@/components/blimp/site-chrome";
import { useMotherLocale } from "@/components/providers/locale-provider";
import { FormField, inputStateClass } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useZodForm } from "@/hooks/use-zod-form";
import { loginFormSchema } from "@/schemas/forms";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { safeInternalPath } from "@/lib/funnel-gates";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { t } = useMotherLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeInternalPath(searchParams.get("callbackUrl"));
  const oauthError = searchParams.get("error");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!oauthError) return;
    toast.error(t("oauthFail"));
  }, [oauthError]);

  const { values, setField, touchField, validateAll, getError, touched } = useZodForm(
    loginFormSchema,
    { email: "", password: "" }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateAll();
    if (!result.success) return;

    setLoading(true);
    const signInResult = await signIn("credentials", {
      email: result.data.email,
      password: result.data.password,
      redirect: false,
    });
    setLoading(false);

    if (signInResult?.error) {
      toast.error(t("badLogin"));
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <AuthShell title={t("welcomeBack")} subtitle={t("termsSub")}>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <FormField id="email" label={t("email")} required error={getError("email")}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={inputStateClass(getError("email"), touched.email)}
            value={values.email}
            onChange={(e) => setField("email", e.target.value)}
            onBlur={() => touchField("email")}
            aria-invalid={!!getError("email")}
          />
        </FormField>

        <FormField id="password" label={t("password")} required error={getError("password")}>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className={cn("pr-10", inputStateClass(getError("password"), touched.password))}
              value={values.password}
              onChange={(e) => setField("password", e.target.value)}
              onBlur={() => touchField("password")}
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

        <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
          {loading ? t("signingIn") : t("signIn")}
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
        onClick={() => signIn("google", { callbackUrl: callbackUrl })}
      >
        {t("continueGoogle")}
      </Button>

      <p className="mt-8 text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href="/signup" className="text-foreground hover:text-accent underline-offset-4 hover:underline">
          {t("createOne")}
        </Link>
      </p>
    </AuthShell>
  );
}
