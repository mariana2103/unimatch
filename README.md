
# UniMatch 🎓

### Data-Driven Guidance for the Portuguese Higher Education System

## The Problem

Choosing a university is one of the most significant decisions a young adult faces, yet the process in Portugal remains notoriously fragmented and stressful. Students must navigate:

* **Complex Weighted Averages:** 
* **Information Asymmetry:** 
* **Logistic Hurdles:** 

> **"Every year, over 60,000 candidates apply for Higher Education in Portugal, often making life-altering decisions based on incomplete calculations or outdated spreadsheets."**

**UniMatch** was built to solve this. It provides a centralized, automated platform that transforms raw academic data into actionable insights, reducing the anxiety of the application season.

---

## Features & Solutions

### Precision Grade Management

Instead of simple estimates, UniMatch allows for **subject-specific grade entry per year**. This granularity ensures that the internal average—which accounts for 50% to 65% of the final score—is calculated with 100% accuracy.

### The "Match" Algorithm

The core of the application is a relational logic engine that cross-references:

1. The student's validated national exams.
2. The specific weightings of each university course.
3. Historical cut-off data.
It provides a "Match Score," telling the student exactly what their entry grade would be for a specific institution.

### Bridging the Public-Private Gap

The platform treats the educational landscape as a whole, integrating both public universities and private colleges. For private institutions, it provides direct channels to official information, streamlining the discovery of specialized programs.

---

## 💻 Tech Stack & Architecture

* **Framework:** [Next.js]() (App Router & Server Actions)
* **Database:** [PostgreSQL]() via [Supabase]()
* **Authentication:** Multi-provider OAuth (Google) and Email/Password
* **Infrastructure:** Containerized with **Docker** for environment consistency
* **CI/CD:** Automated deployments via **Vercel**

---

## 🐳 Getting Started (Local Development)

This project is fully containerized to ensure a seamless setup experience.

### 1. Prerequisites

* Docker and Docker Compose
* A Supabase project (for the managed database)

### 2. Configuration

Clone the repository and create a `.env.local` file with your environment variables:

```bash
git clone https://github.com/your-username/unimatch
cd unimatch
# Add your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local
```

### 3. Execution

Run the application using Docker Compose:

```bash
docker-compose up --build

```

The application will be accessible at `http://localhost:3000`.

### 4. Database Initialization

Execute the SQL scripts found in `/database/schema.sql` within your Supabase SQL Editor to initialize the tables, triggers, and Row Level Security (RLS) policies.

---

## 🛡 Security & Reliability

* **Row Level Security (RLS):** Student data and grades are strictly isolated at the database level.
* **Server-Side Logic:** Sensitive calculations and database writes are handled via Server Actions to prevent client-side manipulation.
* **Data Integrity:** SQL Triggers ensure that user profiles are automatically synchronized upon authentication.

---
