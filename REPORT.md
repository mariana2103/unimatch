# UniMatch — Pre-Launch Report
*March 2026 — Internal review*

---

## 1. App Overview

**UniMatch** (unimatch.pt) is a Portuguese higher education course explorer and candidatura simulator. It pulls official data from DGES (~1700 courses) and lets students:

- Search and filter all university courses with real cutoff grades (nota do último colocado)
- Simulate their candidatura grade against any course, in real time
- Build and share an ordered 6-option candidatura list
- Get AI-powered course recommendations based on interests
- View historical grade trends per course
- Compare courses side by side

**Stack:** Next.js 14 (App Router), Supabase (PostgreSQL + Auth + Storage), Tailwind CSS, Vercel

**Users:** Portuguese secondary school students preparing their DGES application (typically 17–19 years old)

**Status:** Feature-complete MVP. Pre-launch.

---

## 2. Security Audit

### 🔴 Critical

**No rate limiting on AI API routes**
`/api/chat` and `/api/ai-recommend` call external LLM APIs with no rate limit. A single user or bot could drain your OpenAI/Anthropic quota in minutes.
- **Fix:** Add IP-based rate limiting using `@upstash/ratelimit` + Upstash Redis (free tier). 10 requests/minute per IP is reasonable.
- Example: `const ratelimit = new Ratelimit({ limiter: Ratelimit.slidingWindow(10, '1 m') })`

**No rate limiting on `/api/share`**
The share endpoint inserts rows to Supabase with no auth check. A bot could flood `shared_candidaturas` with millions of rows.
- **Fix:** Same rate limiting approach. Also add Supabase RLS CHECK to limit total rows (Supabase `pg_cron` to purge expired rows).

### 🟡 Medium

**SUPABASE_SERVICE_ROLE_KEY usage**
The key is correctly server-only (only used in `/api/delete-account`). It is in `.env` which is gitignored — good. Never expose this key in any client-side code or NEXT_PUBLIC_ variable.
- **Verify:** `grep -r "SERVICE_ROLE" app/ components/ lib/` should return zero results.

**Anon key used for server-side queries**
Several server components (course pages, sitemap, share view) use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for Supabase queries. This is fine with RLS enabled, but consider using the service role key for server-only fetches to avoid leaking RLS logic.

**No Content Security Policy (CSP)**
No CSP headers are set in `next.config`. This exposes users to potential XSS if any dependency is compromised.
- **Fix:** Add basic CSP in `next.config.js`:
```js
headers: [{ source: '/(.*)', headers: [{ key: 'X-Frame-Options', value: 'DENY' }] }]
```

**AI chat takes user input and sends to LLM with no sanitization**
Currently the chat context includes user profile data (grade, area) which is fine. Just ensure no SQL or code injection is possible — it isn't, since it's just a string prompt, but don't add database values to prompts dynamically in future.

### 🟢 Good

- Supabase RLS enabled on all tables
- Auth handled entirely by Supabase (no custom session management)
- No user passwords stored (bcrypt by Supabase)
- HTTPS enforced by Vercel
- Service role key correctly server-side only
- Share route generates random slugs (no enumerable IDs)
- Delete account wipes all user data via Supabase admin delete (cascades via FK)

---

## 3. Data & Legal Compliance

### RGPD / GDPR

| Requirement | Status | Notes |
|---|---|---|
| Privacy Policy | ✅ Done | `/privacidade` — covers data collected, rights, retention |
| Terms of Service | ✅ Done | `/termos` — covers disclaimer, AI limitations, liability |
| Right to erasure | ✅ Done | Account deletion UI + API route |
| Data minimisation | ✅ | Only collects what's needed (email, grades, favorites) |
| Lawful basis | ⚠️ Partial | Should explicitly state "legitimate interest" or "consent" in privacy policy |
| Cookie consent | ❌ Missing | **Needed before adding any analytics** |
| Data retention policy | ✅ Documented | 30 days for shares, active for accounts, 30 days post-deletion |
| EU data storage | ✅ | Supabase EU region |
| Data breach procedure | ❌ Missing | Not critical for MVP but legally required (72h notification to CNPD) |
| CNPD registration | ⚠️ Optional | Small-scale processing by a natural person may be exempt, but worth checking |

**Recommended action:** Before adding Google Analytics or any third-party tracker, implement a simple cookie consent banner. Without it, GA4 is not legal under GDPR. Alternative: use **Vercel Analytics** (privacy-friendly, no cookies, no consent banner needed).

### Data Sources (DGES)

DGES is a public Portuguese government body. Their course data is:
- Published under the **PSI Directive** (Directive 2019/1024, transposed in Portugal as Lei 26/2016)
- **Freely reusable** for informational purposes, including commercial uses
- No copyright on factual data (course names, grades, vagas are facts)

**Recommended action:** Add a clear attribution line (already in footer: "Dados baseados na DGES") and the disclaimer: *"Informação para fins orientativos. Consulta sempre a DGES oficial."*

### AI Counselor

The AI counselor gives course and career advice to minors (17–19 year olds).
- AI disclaimer already added to chat empty state ✅
- Terms of Service covers AI limitations ✅
- **Risk:** If a student makes a wrong application decision based on AI advice and blames UniMatch, the Terms of Service protects you
- **Recommendation:** Don't store chat history — currently looks like it's session-only (good)

### Google OAuth

Verify in Supabase Auth settings that Google OAuth only requests `email` and `profile` scopes. No calendar, drive, or other sensitive scopes should be requested.

---

## 4. Usability & Design

### What's Working Well
- Clean, minimal design with good visual hierarchy
- Dark mode functional (recently lightened to a more comfortable level)
- Mobile navigation with hamburger menu is solid
- Course cards are information-dense but readable
- Simulator shows grade differences intuitively
- AI counselor questionnaire flow is well-designed

### Issues to Address

**Onboarding gap**
New users are redirected to `/profile` but there's no explanation of what to fill in or why. Many will leave without filling anything.
- *Fix:* A 3-step welcome modal: "1. Add your grades → 2. Heart courses you like → 3. Simulate your candidatura"

**AI counselor discoverability**
On mobile, the AI button is only in the hamburger menu. Many users won't find it.
- *Fix:* Add a floating AI button on mobile, bottom-right, small but visible. Or highlight it in the onboarding.

**Empty states**
When a user has no favorites, the simulator shows a generic empty state. Same for the candidatura builder.
- *Fix:* Empty states should guide the user to the next action ("Vai ao Explorador e marca ♥ nos cursos que gostas")

**The `/apoio` page has too much text**
Students have short attention spans. The current page explains the project in 3 paragraphs before showing the payment options.
- *Fix:* Lead with the action (MBway number, big and prominent), put the story below. Maximum 2 sentences of context.

**Font size on mobile**
Some labels are at `text-[9px]` and `text-[10px]` which are below the 11px WCAG minimum for body text on mobile. These are in table headers and stat labels.
- *Fix:* Bump to minimum `text-[11px]` everywhere, `text-xs` (12px) preferred.

**Loading states**
The course explorer loads courses in batches, showing a spinner first. On slow connections, users see nothing for 2–3 seconds. Consider skeleton loading cards.

### Design Consistency

- ✅ Colour palette is consistent (navy/teal)
- ✅ Border radius consistent (rounded-xl as default)
- ✅ Dark mode now usable
- ⚠️ Some pages (profile, bolsas) feel less polished than the explorer
- ⚠️ The beta banner takes up space — consider removing once stable

---

## 5. What Could Go Wrong (Risk Register)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| DGES updates data structure → import script breaks | Medium | High | Pin the import script to specific table columns; add CI test |
| AI API costs spike (no rate limit) | High | High | **Add rate limiting before launch** |
| Supabase free tier limits hit | Low | Medium | Monitor usage; upgrade is €25/month |
| User claims UniMatch caused wrong application | Low | Medium | Terms of Service + disclaimer covers this |
| Google deindexes pages (duplicate content) | Low | Medium | Canonical URLs already set; sitemap submitted |
| Data is outdated (2024 grades shown as 2025) | High | Medium | Add a "dados de 2025" badge; update script before candidature period |
| Supabase free tier hit for DB size | Low | Low | 500MB free; ~1700 courses + embeddings ≈ ~50MB |
| Course slug collision (two courses same name + institution) | Very Low | Low | `toCourseSlug` is deterministic; duplicates handled by `findIndex` |

---

## 6. Marketing Plan

### Target Audience
Portuguese secondary school students (17–19) in their final year (12º ano), applying to university. Parents are secondary audience (they research too). **Application period:** typically June–August, with results in September.

### Channels (free / low-cost)

**SEO (highest long-term ROI)**
- Submit sitemap to Google Search Console immediately
- Target keywords: "nota entrada [curso]", "média [curso] [universidade]", "como calcular nota candidatura"
- Each `/cursos/[slug]` page is a landing page for its search query
- Add FAQ section to course pages: "Como é calculada a nota de candidatura para X?"
- Expected: 3–6 months to rank, then traffic compounds

**Instagram & TikTok (highest short-term reach)**
- Account: @unimatch.pt
- Content ideas:
  - "A nota do último colocado em Medicina desceu 5 valores" (data-driven content)
  - "Como usar o simulador em 30 segundos" (screen record)
  - "3 coisas que os alunos erram na candidatura" (educational)
  - "Cursos com nota de entrada abaixo de 130 em Lisboa" (discovery)
- Post during key moments: quando as notas de exame saem (Julho), resultados (Setembro)

**Reddit & Discord**
- r/portugal and r/estudantes_pt — share the tool when someone asks about candidaturas
- Procura Discord servers de estudantes portugueses
- Never spam; only share when genuinely helpful

**Schools & tutoring centers**
- Email directly to 12º ano class directors at high schools
- Prepare a one-page PDF about UniMatch for teachers to share
- This is a high-trust channel — if a teacher recommends it, students use it

**Partnerships**
- Centros de explicações: Aprender+, Academia de Estudos, etc. — they have thousands of students
- Student newspapers at universities (they'll write about tools for incoming students)
- Resultado.pt, Acesso Ensino Superior blogs — offer to write a guest post

### Timeline

| Period | Action |
|---|---|
| Now (March) | Submit sitemap, set up Search Console, create Instagram account |
| April–May | Start posting content, reach out to tutoring centers |
| June (exams) | Peak posting period — calculadoras de nota, dicas de candidatura |
| July (notas exame) | Launch push — "descobre agora se entras no teu curso preferido" |
| August–September (results) | Most traffic — the app is most useful now |
| October | Post-mortem, collect feedback, plan v2 |

### Metrics to Track
- Google Search Console: impressions, clicks, average position
- Vercel Analytics: page views, top pages, geography
- Supabase: active users (can query `profiles` table)
- Conversion: visitors → sign-ups (set up a simple funnel)

---

## 7. Missing Features / Things That Could Bite You

1. **No `app/not-found.tsx`** — Next.js default 404 page is unstyled and off-brand. Create one.

2. **No `app/error.tsx`** — If a server component throws, users see an ugly Next.js error page. Create a styled fallback.

3. **Beta banner says "Beta"** — if you're launching, consider removing it or changing to "Versão inicial — dados de 2025".

4. **The bolsas and calendário pages** — likely basic/empty. Either flesh them out or hide them from the main nav before launch.

5. **No email on sign-up confirmation** — Supabase sends a default confirmation email. Customise the email template (Supabase Dashboard → Auth → Email Templates) to match UniMatch branding. The default Supabase email looks spammy.

6. **Google OAuth redirect URLs** — verify the production URL `https://www.unimatch.pt` is in Supabase Auth → URL Configuration → Redirect URLs. Localhost-only is a common launch day bug.

7. **Embedding coverage** — if not all courses have embeddings, the AI semantic search silently degrades to keyword-only. Run the embed script and check coverage.

8. **Data staleness warning** — the grades shown are from 2025. Before the 2026 application cycle opens (around March/April), add a banner: "Dados referentes a 2025. Actualização prevista para Junho 2026."

9. **Mobile bottom nav obscures content** — the fixed `pb-16` on mobile works for most pages but verify on the profile page and candidatura builder that nothing is hidden behind the mobile nav.

10. **Vercel `NEXT_PUBLIC_SUPABASE_*` env vars** — make sure these are set in Vercel's Environment Variables settings, not just locally. A common cause of "works locally, broken in production."
