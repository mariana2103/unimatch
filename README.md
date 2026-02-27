
# <img src="assets/uni-match-icon.png" height="45" /> UniMatch

<p align="left">
  <img src="https://img.shields.io/badge/Status-Beta-ebbcba?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Deployment-Live-e0def4?style=for-the-badge" />
  <a href="https://www.unimatch.pt/"><img src="https://img.shields.io/badge/Website-unimatch.pt-31748f?style=for-the-badge" /></a>
</p>

**UniMatch** is a data-driven ecosystem designed to replace the anxiety of Portuguese university applications with clarity.

In a landscape where admission data is scattered across PDFs and fragmented portals, UniMatch centralizes the journey. We don't just calculate grades; we bridge the gap between ambition and eligibility. By turning complex DGES rounding rules and historical cut-offs into a personalized strategy, we help students navigate the "Match" between their results and their future.

---

## 🚀 Live Functionalities

* **Precision GPA Engine:** Full support for internal secondary school average (CFA) calculations for both **Scientific-Humanistic** and **Professional** pathways, following official rounding rules.
* **The Match Algorithm:** A relational engine that cross-references your exam grades with specific university weightings to tell you exactly where you stand.
* **Eligibility & Exam Filtering:** Instantly see which courses you can actually apply for based on the exams you've taken and the minimum GPA requirements.
* **Unified Directory:** Search and filter Public and Private institutions by district, academic area, and type.
* **Application Timeline:** A dynamic calendar view for national exam dates and application phases to ensure no deadlines are missed.
* **Student Dashboard:** Secure Google/Email authentication to track your grades, save favorite courses, and monitor your progress.
* **AI Counselor:** Conversational career guidance with a 5-question profile questionnaire, semantic course ranking, and a live chat interface.

---

## 🛠 Tech Stack

<p align="left">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
</p>

---

## 🗺️ Roadmap & Current Status

### ✅ Completed

* **Relational Database:** Core architecture for institutions and courses.
* **Logic Engine:** Official grade calculations and eligibility checks.
* **Authentication & Profiles:** Full User Dashboard integration.
* **Timeline System:** Key dates for the 2025/26 cycle.
* **AI Counselor:** SSE-streamed chat + semantic course recommender live.

### 🚧 Under Construction

* **Data Refinement:** Cleaning and unifying scattered data sources for 100% accuracy on vagas and historical cut-offs.
* **Predictive Analytics:** Regression model for 2026/27 closing grade trends.

---

## 🏗 Architecture & Engineering Decisions

### Overview

UniMatch is a Next.js 15 App Router application backed by Supabase (Postgres + Auth). All grade logic runs client-side or in Server Actions — no dedicated backend server.

```
Browser → Next.js App Router
           ├── Server Components (course list, filters)
           ├── Client Components (cards, dialogs, AI sidebar)
           ├── Server Actions (grade upserts, profile updates)
           └── Route Handlers
               ├── /api/chat       → SSE proxy to iaedu
               └── /api/ai-recommend → profile → area weights
```

---

### Key Architectural Choices

#### 1. Client-side Grade Calculation

**Decision:** `calculateAdmissionGrade()` runs in the browser on every card render, not pre-computed in the database.

**Why:** Admission grades depend on three dynamic inputs — the student's secondary average, their exam scores, and the course's specific weights. Pre-computing them server-side would require re-running for every profile change. Client-side calculation keeps it reactive with zero latency.

**Tradeoff:** If a student has many exams and hundreds of course cards are visible, this becomes O(courses × exams). Mitigated with a flat data model and cheap arithmetic — no DB round-trips per card.

**Bottleneck observed:** With 3 000+ courses visible at once, initial render cost was measurable. Fixed by keeping the course list paginated and filtered before passing to card components.

---

#### 2. SSE Proxy Pattern for AI Chat

**Decision:** `/api/chat` acts as an SSE proxy — it forwards the request to the iaedu upstream and re-streams the response to the browser.

**Why:** The upstream AI service requires a private API key that must never be exposed to the client. Proxying through a Next.js Route Handler keeps the key server-side while preserving the streaming UX.

**Tradeoff:** Adds one extra network hop and doubles streaming latency on slow connections. Acceptable for a chat interface; would not be acceptable for real-time voice.

**Bug fixed (Feb 2026):** `FormData.append()` was receiving `undefined` when the request body lacked a `message` field (e.g., malformed client request or JSON serialisation of `undefined` values). The fix adds an early validation guard that returns 400 before touching FormData.

**Bottleneck:** The `maxDuration = 30` Vercel limit means very long AI responses get cut off. The `[DONE]` sentinel is always sent in `finally` so the client stream closes cleanly even on timeout.

---

#### 3. Empty-bubble Problem in Chat UI

**Decision (original):** Pre-insert an empty `{ role: 'assistant', content: '' }` bubble before streaming starts, then mutate it in-place.

**Problem:** If the upstream returns an SSE stream with no parseable `data:` lines (format mismatch, error body, or empty response), the empty bubble stays permanently — appearing as a black/invisible message.

**Fix (Feb 2026):** Removed the pre-insertion. The assistant bubble is only added once the first non-empty token arrives (`bubbleAdded` flag). If the stream ends with no content, a fallback error message is shown explicitly. This eliminates ghost bubbles entirely.

---

#### 4. Semantic Course Ranking Without a Vector DB

**Decision:** Course ranking uses TF-IDF-style keyword scoring in `lib/semantic-search.ts`, not a vector embedding store.

**Why:** Embedding 3 000+ courses and running cosine similarity at query time requires either a pgvector setup or an external embedding API call. For a beta product with unknown query volume, both add cost and operational complexity.

**Tradeoff:** Recall is weaker than true semantic search — "I like fixing things" won't surface "Engenharia Mecânica" unless the keywords overlap. Mitigated by the `/api/ai-recommend` call, which uses an LLM to translate free-text answers into structured area weights before ranking.

**Bottleneck:** The LLM call adds ~2–4 s to the questionnaire completion. Shown as an explicit "A analisar..." loading state. A local model or cached embeddings would eliminate this.

---

#### 5. Supabase as the Only Backend

**Decision:** No Express/Fastify server. All mutation logic lives in Next.js Server Actions; all reads are either Server Components querying Supabase directly or client-side Supabase calls.

**Why:** Eliminates an entire deployment target and halves infrastructure complexity. Server Actions give type-safe RPC without writing REST endpoints. Supabase RLS handles row-level auth.

**Tradeoff:** Server Actions are coupled to Next.js — migrating to a standalone API later would require rewriting the action layer. Acceptable at this scale.

---

#### 6. Near-Cutoff Grade State (0.5 threshold)

**Decision (Feb 2026):** Introduced a third eligibility state — yellow "Próximo ao corte" — when a student's calculated admission grade is within 0.5 points (0-20 scale) of the course cut-off.

**Why:** Binary green/red was misleading. A student 0.2 below last year's cut-off is in a fundamentally different position than one who is 5 points below. The 0.5 threshold (= 5 on the 0-200 internal scale) captures the statistical noise in year-to-year cut-off variation.

**Tradeoff:** The threshold is hardcoded. Ideally it would be derived from historical cut-off variance per course, but that data isn't yet available at the required granularity.

---

### Data Model (simplified)

```
profiles          — user GPA, district, contingent
user_grades       — subject × year × grade (upsert on conflict)
user_exams        — exam_code × grade × year
courses           — nome, instituicao, nota_ultimo_colocado, pesos
course_requirements — exam_code × weight × conjunto_id (alternative exam sets)
favorites         — user_id × course_id
```

The `conjunto_id` column on `course_requirements` is the key modelling decision: Portuguese courses can accept one of several alternative exam combinations (e.g., "Maths + Physics" OR "Maths + Chemistry"). Grouping by `conjunto_id` allows the grade engine to evaluate each alternative independently and pick the best result for the student.

---

### Takeaways

| What worked | Why |
|---|---|
| App Router + Server Actions | Zero-boilerplate mutations with full type safety |
| Client-side grade math | Instant feedback, no API latency per card |
| SSE proxy pattern | Streaming AI UX without exposing keys |
| Supabase RLS | Auth-aware data access without custom middleware |

| What was painful | Lesson |
|---|---|
| FormData + undefined env vars | Always validate at the boundary before touching platform APIs |
| Pre-inserted empty chat bubbles | Never mutate UI state optimistically for async streams — wait for first real token |
| Binary eligibility states | Domain nuance (near-miss) matters more than clean code symmetry |
| iaedu SSE format variance | Upstream SSE format can change silently — normalize at the proxy, not the client |

---

## 🏗 Setup

1. Clone the repository.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`.
3. Add `IAEDU_ENDPOINT`, `IAEDU_API_KEY`, `IAEDU_CHANNEL_ID` to `.env.local`.
4. Apply SQL migrations in `/database/schema.sql`.

```bash
npm install
npm run dev
```

---

## 💌 Connect with the Developer

> "Information is everywhere, yet clarity is nowhere. UniMatch was built for the student who has the grades but lacks a map, turning the overwhelming noise of higher education into a clear path for those still figuring out what to do with their lives."

<p align="left">
<a href="[https://github.com/mariana2103](https://github.com/mariana2103)">
<img src="[https://img.shields.io/badge/Mariana_Almeida-ebbcba?style=for-the-badge&logo=github&logoColor=191724](https://img.shields.io/badge/Mariana_Almeida-ebbcba?style=for-the-badge&logo=github&logoColor=191724)" alt="GitHub" />
</a>
&nbsp;
<a href="[https://www.linkedin.com/in/mcaalmeida/](https://www.linkedin.com/in/mcaalmeida/)">
<img src="[https://img.shields.io/badge/LinkedIn-e0def4?style=for-the-badge&logo=linkedin&logoColor=191724](https://img.shields.io/badge/LinkedIn-e0def4?style=for-the-badge&logo=linkedin&logoColor=191724)" height="28" alt="LinkedIn" />
</a>
</p>
