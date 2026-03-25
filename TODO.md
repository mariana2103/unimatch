# UniMatch — Release Checklist & Backlog

---

## 🔴 RELEASE BLOCKERS (must do before launch)

### Infrastructure / Data
- [ ] Run SQL migration in Supabase SQL Editor → `supabase/migrations/20240326_shared_candidaturas.sql`
- [ ] Run `python scripts/import_supabase.py` to populate `link_oficial` (DGES links)
- [ ] Run `npx tsx --env-file=.env scripts/embed-courses.ts` for remaining course embeddings
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is in `.env` (already there — account deletion works)
- [ ] Do a full production build locally (`npm run build`) to catch any SSG errors

### Legal (GDPR)
- [ ] Add cookie consent banner — required before deploying any analytics
- [ ] Verify delete-account route works end-to-end (requires service role key + test user)
- [ ] Add "Política de Privacidade" and "Termos" links to the profile page footer too

### Security
- [ ] Add rate limiting to `/api/chat`, `/api/ai-recommend`, `/api/share` (see REPORT.md)
- [ ] Review Supabase RLS policies — ensure no table is publicly readable beyond what's intended

### Quality
- [ ] Create `app/not-found.tsx` (custom 404 page)
- [ ] Create `app/error.tsx` (custom 500 / error boundary page)
- [ ] Test the full sharing flow (Partilhar button → /partilha/[slug]) after running migration
- [ ] Test account deletion flow end-to-end
- [ ] Test on real mobile devices (iPhone Safari + Android Chrome) — especially AI bottom sheet and simulator

---

## 🟡 HIGH PRIORITY (week 1 after launch)

### SEO & Discoverability
- [ ] Submit sitemap to Google Search Console (`https://www.unimatch.pt/sitemap.xml`)
- [ ] Add Vercel Analytics or GA4 — add cookie consent first
- [ ] Generate a real OG image (1200×630) with logo + tagline instead of default
- [ ] Add `<meta name="google-site-verification">` tag from Search Console

### UI / UX
- [ ] AI chat suggested questions: make chips context-aware based on user's profile (current area, grade level)
- [ ] Add empty-state guidance on the simulator when user has no grades set
- [ ] Improve onboarding: after sign-up, show a welcome modal explaining the 3 main features
- [ ] Add a "Beta" or "versão inicial" indicator somewhere visible — manages expectations
- [ ] Profile page: update footer to match main layout (Privacidade / Termos links)
- [ ] Simplify `/apoio` page — too much text, users won't read it (see notes below)

### Payments
- [ ] Create Ko-fi account at ko-fi.com, add link to `/apoio` page
- [ ] Simplify `/apoio` to: MBway (big copy button) + Ko-fi link only — remove PayPal/Revolut if page feels cluttered

### Monitoring
- [ ] Set up Vercel error alerts (free tier)
- [ ] Add basic uptime monitoring (UptimeRobot free tier — monitors unimatch.pt every 5 min)

---

## 🟢 BACKLOG (after stable v1)

### Features
- [ ] **Taxa de Empregabilidade** — show employment rate + salary on course cards
  - Data source: DGEEC/GGP CSVs, columns already in DB schema (`taxa_empregabilidade_1ano`, `salario_medio_1ano`)
  - Display as badge: "92% empregado" on CourseCard + dedicated section in CourseDetailDialog

- [ ] **Cursos Semelhantes** — "Cursos parecidos" section at bottom of CourseDetailDialog
  - Use existing vector embeddings: `match_similar_courses(course_id, 5)` SQL function
  - Show as horizontal scroll of 5 course cards

- [ ] **Distrito Proximity** — "Perto de ti" badge + boost in AI recommendations
  - Same-district courses get a small relevance boost in `rankCourses`
  - Visible badge on CourseCard when institution is in user's district

- [ ] **Dynamic OG images** — per-course social share images for /cursos/[slug]
  - Use Next.js `ImageResponse` from `next/og`
  - Shows course name, institution, and cutoff grade

- [ ] **Grade change alerts** — email users when DGES updates data for favorited courses
  - Requires a Supabase cron job + Resend/SendGrid for email

- [ ] **Comparison panel polish** — currently basic, could show radar chart or side-by-side table

- [ ] **Calculator widget** — reverse calculator: "what average do I need?" given a target course

### Data
- [ ] Update DGES data pipeline for 2025/26 cycle when released
- [ ] Add 2ª fase historical data (currently sparse)
- [ ] Validate that all ~1700 course slugs resolve correctly in production

### Technical
- [ ] Migrate from anon key to service role for server-only Supabase queries (security improvement)
- [ ] Add `next/bundle-analyzer` and optimise bundle size
- [ ] Add Lighthouse CI to Vercel deployment checks

---

## ✅ DONE

- [x] Course explorer with search, filters, sort, semantic search
- [x] Course detail dialog with grade chart + history
- [x] Grade simulator (1ª and 2ª fase) — mobile collapsible
- [x] Saved courses / Candidatura builder
- [x] Anonymous sharing (API + view page + share button)
- [x] AI counselor (questionnaire + chat) — mobile bottom sheet
- [x] Course comparison panel
- [x] SEO static pages `/cursos/[slug]` with JSON-LD, OG, dynamicParams
- [x] Sitemap + robots.txt
- [x] Dark mode (lightened)
- [x] Terminology: "nota de entrada" / "último colocado"
- [x] Privacy Policy page `/privacidade`
- [x] Terms of Service page `/termos`
- [x] Account deletion UI + API route
- [x] `/apoio` support page (MBway + Revolut + PayPal)
- [x] Support link in mobile nav
- [x] Desktop padding improvements
- [x] DGES link import in Python script
- [x] Mobile simulator overflow fix
- [x] AI disclaimer in chat
- [x] Legal footer links
