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