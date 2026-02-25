# <img src="assets/uni-match-icon.png" height="45" /> UniMatch

<p align="left">
  <img src="https://img.shields.io/badge/Status-In_Development-ebbcba?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Deployment-Live-e0def4?style=for-the-badge" />
  <a href="https://www.unimatch.pt/"><img src="https://img.shields.io/badge/Website-unimatch.pt-31748f?style=for-the-badge" /></a>
</p>

**UniMatch** is a data-driven ecosystem designed to replace the anxiety of Portuguese university applications with clarity.

Beyond just calculating grades, UniMatch bridges the gap between ambition and eligibility. Whether you're struggling with complex rounding rules, facing grades lower than your dream course requires, or feeling lost among thousands of options, UniMatch provides a map. By leveraging semantic AI and predictive analytics, we turn fragmented data into a personalized strategy, helping every student find their place in Higher Education, even when they don't yet know where they belong.

---

## 💻 Tech Stack

<p align="left">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
</p>

---

## ✨ Key Features

* **Precision GPA Engine:** Automated calculation of the internal secondary school average (CFA) following official DGES rounding rules.
* **The Match Algorithm:** A relational engine that cross-references your exam grades with specific university course weightings and historical cut-offs.
* **Unified Search:** A single source of truth for both Public and Private institutions.
* **Smart Eligibility:** Instant feedback on whether you meet the minimum entry requirements for a specific course.

---

## 🗺️ Roadmap

### 📍 Phase 1: Foundation (Current Focus)

* [ ] **Relational Course Directory:** Comprehensive database of Portuguese Public and Private institutions.
* [ ] **Exploration Engine:** Search and filter courses by **location (districts)**, **academic area**, and **institution type**.
* [ ] **Official Grade Logic:** Rigorous secondary school average calculation (CFA) for both Scientific-Humanistic and **Professional** pathways.
* [ ] ⏳**Auth Integration:** Robust Google OAuth and Email/Password flows.
* [ ] ⏳**Student Dashboard:** Personal profile to track grades and save favorite courses.

### 📍 Phase 2: Intelligence & Semantics

* [ ] **Smart Eligibility Filter:** Real-time filtering that hides courses you don't meet the minimum requirements for and highlights those where your grade is competitive.
* [ ] **AI Counselor:** An LLM-powered assistant using **Vector Embeddings** (`pgvector`) to suggest paths for students who aren't sure what to do with their lives, matching intent to curricula.

### 📍 Phase 3: Predictive Analytics

* [ ] **Trend Predictor:** A regression algorithm analyzing historical cut-offs and current-year exam difficulty to **predict the 2026/27 closing grades** before they are officially released.
* [ ] **Vacancy Monitoring:** Real-time insights into course popularity and placement probability.

---

## 🏗 Setup

1. Clone the repository.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`.
3. Apply SQL migrations in `/database/schema.sql`.

```bash
npm install
npm run dev

```

---

## 💌 Connect with the Developer

> "Information is everywhere, yet clarity is nowhere. UniMatch was built for the student who has the grades but lacks a map, turning the overwhelming noise of higher education into a clear path for those still figuring out what to do with their lives."

<p align="left">
  <a href="https://github.com/mariana2103">
    <img src="https://img.shields.io/badge/Mariana_Almeida-ebbcba?style=for-the-badge&logo=github&logoColor=191724" alt="GitHub" />
  </a>
  &nbsp;
  <a href="https://www.linkedin.com/in/mcaalmeida/">
    <img src="https://img.shields.io/badge/LinkedIn-e0def4?style=for-the-badge&logo=linkedin&logoColor=191724" height="28" alt="LinkedIn" />
  </a>
</p>
