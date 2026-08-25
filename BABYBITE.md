# BabyBite

Personalized nutrition plans for children aged 4–12.

## Flow

Landing → Sign up → Onboarding (5 steps) → Analysis → Payment (demo spin wheel) → Success → Results + PDF email

## Env variables

```env
# copy from .env.example
MONGODB_URI=
AUTH_SECRET=
RESEND_API_KEY=          # optional — skips email if missing
RESEND_FROM_EMAIL=BabyBite <onboarding@resend.dev>  # sandbox: send only to your Resend account email
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
MONGODB_DNS_SERVERS=     # optional — defaults to 1.1.1.1,8.8.8.8 for SRV lookups
```

### Email (Resend free tier)

- Use `onboarding@resend.dev` as `RESEND_FROM_EMAIL` for testing (no domain purchase).
- **Sandbox rule:** emails can only be delivered to the address on your Resend account (same as Google sign-in email if you used that for Resend).
- To send to any parent email, verify your own domain at [resend.com/domains](https://resend.com/domains) and set `RESEND_FROM_EMAIL=BabyBite <hello@yourdomain.com>`.
- Do **not** use `@gmail.com` in `RESEND_FROM_EMAIL` — Resend cannot send from Gmail.

## Key routes

| Route | Purpose |
|-------|---------|
| `/landing` | Marketing |
| `/signup` `/login` | Auth |
| `/onboarding` | 5-step wizard |
| `/analysis` | Nutrition score |
| `/payment` | Spin wheel + demo payment |
| `/success` | Plan generation loading |
| `/results` | Unlocked meal plans (requires demo payment) |
| `/settings` | Edit child profile, theme, rebuild plan |

## Architecture

- `src/models/` — User, ChildProfile, NutritionAnalysis, MealPlan, Payment, PDFReport, EmailLog
- `src/services/` — analysis-engine, kidfuel-meal-engine, pdf-service, email-service
- `src/app/api/kidfuel/` — onboarding, payment, plans APIs
- `src/proxy.ts` — route protection via named `proxy` export (login, onboarding, demo-payment gates)

Legacy dashboard routes (`/dashboard/*`, old APIs) have been removed. `/legacy/dashboard` redirects to `/results`.

## Tests

```bash
npm test
```
