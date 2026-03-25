# UniMatch — Feature Backlog

## 1. Taxa de Empregabilidade
Show employment rate and average salary data per course on course cards and the detail dialog.
- Data source: DGEEC/GGP graduate employment surveys (columns already in DB schema: `taxa_empregabilidade_1ano`, `salario_medio_1ano`)
- Populate the DB columns via a CSV import script
- Display as a badge on `CourseCard` (e.g. "92% empregado 1 ano") and a dedicated section in `CourseDetailDialog`

## 2. SEO / Open Graph
Improve discoverability and social sharing.
- Add `<meta>` Open Graph tags to `app/layout.tsx` (title, description, og:image)
- Generate a static og:image (1200×630) with the UniMatch logo and tagline
- Add `sitemap.xml` and `robots.txt` via Next.js App Router conventions
- Add structured data (JSON-LD) for the course list page

## 3. Comparison Panel
Let users compare 2–3 courses side by side.
- "Compare" button on each `CourseCard` adds the course to a sticky comparison tray
- Tray slides up from the bottom showing columns: cutoff, vagas, empregabilidade, área
- Clear individual or all courses from the tray

## 4. Cursos Semelhantes (Related Courses)
Show related courses on the `CourseDetailDialog`.
- Use the existing `embedding` vectors: query Supabase for the top 5 courses with lowest cosine distance from the selected course
- Add a `match_similar_courses(course_id uuid, match_count int)` SQL function
- Render as a horizontal scroll list at the bottom of the dialog

## 5. Distrito Proximity
Weight course search and recommendations by the user's district.
- Add a "distância" score to `rankCourses` in `lib/semantic-search.ts` — same-district courses get a small boost
- Show a "Perto de ti" badge on cards when the institution is in the user's district
- In the AI chat context, include nearby institutions in the top results

## 6. Anonymous Candidatura Sharing
Let users share their 6-option candidatura list via a public link, no login required.
- Store snapshot in a `shared_candidaturas` table (id, course_ids[], created_at, expires_at)
- Generate a short slug (e.g. `/partilha/abc123`)
- Page shows read-only ordered list with cutoff and diff vs. the sharer's grade (stored in snapshot)
- Auto-expires after 30 days


Mobile simulator overflow - The slider (GradeSlider) likely has a fixed width or the overall page has overflow-x: hidden missing. The slider uses input[type='range'] which can be wider than its container. The grid on mobile is fine (single column), but the sliders might need w-full + overflow-hidden on the card.

Partilhar still not working - The API route looks correct. The issue is almost certainly that the SQL migration wasn't run yet in Supabase.

I should verify whether the table actually exists and potentially guide them through running the migration if needed.

Apoiar/MBway - No public MBway API for sending payment links. The best options are Ko-fi (free, built for creators, accepts card payments including MBway), Stripe Payment Links (one-time setup, no code), or Revolut Payment Links (very common in Portugal, supports MBway). Since they're a student in Portugal, Revolut.me or their existing PayPal link would be the most practical approach.

Dark mode too dark - The background at oklch(0.18) and card at oklch(0.24) could be lightened slightly to oklch(0.20) and oklch(0.26) for better contrast.

AI chatbot mobile - The current sidebar layout probably doesn't work well on mobile. I'm considering either a bottom drawer that slides up or a full-screen modal with a floating bubble to trigger it.

Terminology - Still working through this section.

Padding - The max-w-7xl container at 1280px feels cramped on smaller desktops with only px-4 padding, so I should increase padding on larger screens.

Footer positioning - The flex layout with min-h-screen and flex-1 on main should handle this correctly, and the mb-16 spacing accounts for the mobile nav bar, so this looks fine.

Apoiar button - Moving it from the footer to a floating button in the bottom-right corner would be less intrusive, or I could integrate it into the mobile navigation instead.

Legal considerations - DGES data is public government information covered under Portugal's PSI Directive implementation, so scraping is permitted. For user data storage, I need privacy policies and GDPR compliance through Supabase's EU infrastructure. Course and institution names are factual data without copyright protection.

Course page 404 issue - The static route generation might be mismatching the slug format between build time and runtime, or the database migration for shared_candidaturas hasn't been applied yet.

Looking at the specific URL structure, the slug generation from toCourseSlug() should combine the course name and institution, but there might be a discrepancy in how dashes are being handled in the institution name that's causing the lookup to fail. the slug generation logic looks right, so the 404 is almost certainly because these pages haven't been built yet—either the build process hasn't run with the new code, or generateStaticParams() is failing silently during the build. The user could also set dynamicParams = fal

AI chat suggested questions — the current chips are in Portuguese but generic ("Cursos de engenharia?"). Could be improved with more contextual chips based on the user's profile