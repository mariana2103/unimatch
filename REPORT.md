# UniMatch — Status Report
*March 2026 — Pre-launch*

---

## 1. App Overview

**UniMatch** (unimatch.pt) is a Portuguese higher education course explorer and candidatura simulator (~1700 courses from DGES).

**Stack:** Next.js 14 (App Router), Supabase (PostgreSQL + Auth), Tailwind CSS, Vercel

**Status:** Feature-complete MVP. Pre-launch.

---

## 2. TODO — Things Still To Do

### 🟡 High priority (week 1)

| Task | Why |
|---|---|
| Run `npx tsx --env-file=.env scripts/embed-courses.ts` | Without embeddings, AI semantic search falls back to keyword-only |

### 🟢 Polish (after stable)

| Task | Notes |
|---|---|
| Migrate server-only queries to service role key | Low urgency while RLS policies are correct |
| CNPD registration check | Small-scale personal project likely exempt — worth a quick check at cnpd.pt |

---

## 3. DONE — Already implemented

### Security
- ✅ Rate limiting: `/api/chat` (15/10min per IP + per user), `/api/ai-recommend` (5/10min per IP + per user), `/api/share` (10/hour per IP)
- ✅ Prompt injection defense in `/api/chat`: 500-char cap, context-block marker stripping, profile field type validation
- ✅ Security headers on all routes: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- ✅ Supabase RLS on all tables
- ✅ Service role key server-side only (`/api/delete-account` only)
- ✅ Share slugs are random (not enumerable)
- ✅ Delete account wipes all user data (Supabase admin cascade)
- ✅ `/api/share` requires authenticated session (no anonymous share creation)
- ✅ Production error logs sanitised — `console.error` is dev-only in auth callback and AI routes
- ✅ Security audit completed (March 2026) — no high-confidence vulnerabilities found; `.env` confirmed not in git
- ✅ Production build passing (`npm run build` — 1707 static pages, all dynamic routes compiled)

### Legal & GDPR
- ✅ Privacy Policy (`/privacidade`) — lawful basis, data breach procedure, Vercel Analytics disclosure
- ✅ Terms of Service (`/termos`) — AI disclaimer, liability limitation
- ✅ Account deletion UI + API route (`/profile` → `/api/delete-account`)
- ✅ Cookie consent: N/A — using Vercel Analytics (no cookies, no banner needed)
- ✅ Data breach notification procedure documented (72h CNPD)

### UX & UI
- ✅ Dark mode lightened for comfort
- ✅ Terminology: "nota do último colocado" / "nota de entrada" (not "corte")
- ✅ Simulator mobile: overflow fixed, collapsible controls panel
- ✅ AI counselor: mobile bottom sheet + floating FAB button (bottom-right)
- ✅ Empty states with "Ir ao Explorador" action buttons
- ✅ Onboarding welcome banner for new users (3-step guide on `/profile`)
- ✅ 404 page (`app/not-found.tsx`) and error boundary (`app/error.tsx`)
- ✅ Desktop padding improvements across all pages
- ✅ Footer with Privacidade/Termos links
- ✅ `/apoio` — Stripe custom checkout (`/api/checkout`), preset buttons €2/€5/€10 + free amount, card + PayPal, `pt-PT` locale
- ✅ Banner changed: "Versão beta" → "Versão inicial — dados de 2025"
- ✅ Font sizes: all `text-[9px]` → `text-[11px]`; readable `text-[10px]` labels → `text-[11px]` (WCAG minimum)
- ✅ Bolsas page (`/bolsas`) — ScholarshipCalendar component, fully built
- ✅ Calendário page (`/calendario`) — DGESTimeline component, fully built
- ✅ SQL migration run — sharing feature active
- ✅ DGES `link_oficial` import run
- ✅ Supabase Auth redirect URLs — `unimatch.pt` already configured (used in production)
- ✅ Sitemap submitted to Google Search Console
- ✅ Supabase auth email templates customised (branded, Portuguese)
- ✅ Vercel Analytics installed (`@vercel/analytics` v1.6.1, `<Analytics />` in root layout)
- ✅ All Vercel env vars set (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `IAEDU_ENDPOINT`, `IAEDU_API_KEY`, `IAEDU_CHANNEL_ID`, `SUPABASE_SERVICE_ROLE_KEY`) — `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_SITE_URL` still needed
- ✅ Google OAuth scopes — default Supabase config (`email profile openid` only, never customised)

---

## 4. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AI API costs spike | Low | High | Rate limiting in place |
| DGES updates data structure → import breaks | Medium | High | Pin import to specific columns |
| Data shown as 2025 during 2026 cycle | High | Medium | Banner says "dados de 2025"; update before June |
| Supabase free tier limits hit | Low | Medium | Monitor; upgrade is €25/month |
| User claims wrong application decision due to UniMatch | Low | Medium | ToS + AI disclaimer covers this |



