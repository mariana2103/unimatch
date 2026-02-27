"""
DGES Provas de Ingresso Scraper — stdlib only, no pip required
==============================================================
Fetches https://www.dges.gov.pt/guias/detcursopi.asp?codc={COD_CURSO}&code={COD_UO}
for every course in vagas.csv, extracts:
  - Provas de ingresso (exam codes + conjuntos)
  - Fórmula de cálculo (peso_secundario, peso_exames)
  - Classificações mínimas (nota_minima)

Outputs:
  database/data/provas_cache.json    ← resumes if interrupted
  database/data/provas_import.sql    ← paste into Supabase after courses_import.sql

Usage:
    python3 database/scrape_provas.py
"""

import csv, itertools, json, re, sys, time, urllib.request, urllib.error
from html.parser import HTMLParser
from pathlib import Path

BASE       = Path(__file__).parent
VAGAS_FILE = BASE / "data" / "vagas.csv"
CACHE_FILE = BASE / "data" / "provas_cache.json"
OUT_FILE   = BASE / "data" / "provas_import.sql"

DGES_URL = "https://www.dges.gov.pt/guias/detcursopi.asp?codc={codc}&code={code}"
DELAY    = 0.45   # seconds between requests — be polite to the server
TIMEOUT  = 12

# ─── HTML section extractor ────────────────────────────────────────────────
class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self._parts: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag == "br":
            self._parts.append("\n")

    def handle_data(self, data: str):
        self._parts.append(data)

    def text(self) -> str:
        return "".join(self._parts).strip()


def extract_section(html: str, h2_pattern: str) -> str:
    """Return text content of the section headed by h2_pattern."""
    m = re.search(
        rf"<h2[^>]*>{h2_pattern}</h2>(.*?)(?=<h2|<a\s+name=)",
        html, re.DOTALL | re.IGNORECASE,
    )
    if not m:
        return ""
    p = TextExtractor()
    p.feed(m.group(1))
    return p.text()


# ─── Exam code regex ───────────────────────────────────────────────────────
EXAM_RE = re.compile(r"\b(\d{2})\s{1,4}[A-Za-záéíóúâêîôûàèìòùãõçÁÉÍÓÚ]")


def find_codes(text: str) -> list[str]:
    return EXAM_RE.findall(text)


# ─── Provas parser ─────────────────────────────────────────────────────────
def parse_provas(text: str) -> list[dict]:
    """
    Returns a list of conjuntos:
        [{"id": 1, "exams": ["02", "16"]}, {"id": 2, "exams": ["02", "07"]}, ...]

    Each conjunction = one valid combination of exams.
    User must satisfy ALL exams in at least ONE conjunction.

    Handles four DGES formats:
    1. Simple list         → 1 conjunction with all exams
    2. "Duas das seguintes"→ all 2-combinations of the listed exams
    3. "Uma das seguintes" → 1 conjunction per option
    4. "Um dos conjuntos"  → 1 conjunction per set, separated by "ou"
    5. Required + option   → required exams prepended to each optional conjunction
    """
    if not text or "não" in text.lower():
        return []

    lines = [ln.strip() for ln in text.split("\n")]
    lines = [ln for ln in lines if ln]

    tl = text.lower()

    # ── Case 4: "Um dos seguintes conjuntos" ──────────────────────────────
    if "seguintes conjuntos" in tl:
        sets: list[list[str]] = []
        current: list[str] = []
        for ln in lines:
            if "conjuntos" in ln.lower():
                continue
            if re.fullmatch(r"ou", ln.lower().strip()):
                if current:
                    sets.append(current)
                current = []
                continue
            codes = find_codes(ln)
            current.extend(codes)
        if current:
            sets.append(current)
        return [{"id": i + 1, "exams": s} for i, s in enumerate(sets) if s]

    # ── Split required / optional, detect choice-header lines early ────────
    required_codes: list[str] = []
    optional_lines: list[str] = []
    divider_seen   = False
    choice_seen    = False  # True once we hit "Uma/Duas das seguintes" header

    for ln in lines:
        lnl = ln.lower().strip()
        if re.fullmatch(r"[eE]", ln.strip()) or re.match(r"mais\s+", lnl):
            divider_seen = True
            continue
        # Once we see the choice header, everything after goes to optional_lines
        if re.search(r"(uma|duas)\s+das\s+seguintes", lnl) or re.search(r"seguinte\s+prova", lnl):
            choice_seen = True
            optional_lines.append(ln)
            continue
        if divider_seen or choice_seen:
            optional_lines.append(ln)
        else:
            codes = find_codes(ln)
            if codes and not re.search(r"seguinte", lnl):
                required_codes.extend(codes)

    optional_text = "\n".join(optional_lines)
    optional_tl   = optional_text.lower()

    # ── Case 3: "Uma das seguintes provas" ────────────────────────────────
    if "uma das seguintes" in optional_tl or "seguinte prova" in optional_tl:
        options = [c for c in find_codes(optional_text) if c not in required_codes]
        if not options:
            options = find_codes(text)
        return [
            {"id": i + 1, "exams": required_codes + [code]}
            for i, code in enumerate(options)
        ] or ([{"id": 1, "exams": required_codes}] if required_codes else [])

    # ── Case 2: "Duas das seguintes provas" ───────────────────────────────
    if "duas das seguintes" in tl:
        pool = [c for c in find_codes(optional_text) if c not in required_codes]
        if not pool:
            pool = find_codes(text)
        combos = list(itertools.combinations(pool, 2))
        if not combos:
            return [{"id": 1, "exams": pool}]
        return [
            {"id": i + 1, "exams": list(required_codes) + list(pair)}
            for i, pair in enumerate(combos)
        ]

    # ── Case 1: Simple list (all required) ────────────────────────────────
    all_codes = find_codes(text)
    if all_codes:
        return [{"id": 1, "exams": all_codes}]

    return []


# ─── Formula / mínimas parsers ────────────────────────────────────────────
def parse_formula(text: str):
    sec_m  = re.search(r"secund[aá]rio[^%\d]*(\d+)\s*%", text, re.I)
    exam_m = re.search(r"provas?[^%\d]*(\d+)\s*%", text, re.I)
    peso_sec  = float(sec_m.group(1))  / 100 if sec_m  else None
    peso_exam = float(exam_m.group(1)) / 100 if exam_m else None
    return peso_sec, peso_exam


def parse_minima(text: str):
    m = re.search(r"provas?\s+de\s+ingresso[^0-9]*(\d+)\s*pontos", text, re.I)
    return float(m.group(1)) if m else None


# ─── HTTP fetch ────────────────────────────────────────────────────────────
def fetch(codc: str, code: str) -> dict | None:
    url = DGES_URL.format(codc=codc, code=code)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            html = resp.read().decode("iso-8859-1")

        provas_text  = extract_section(html, "Provas de Ingresso")
        formula_text = extract_section(html, r"F[oó]rmula de C[aá]lculo")
        minima_text  = extract_section(html, r"Classifica[cç][oõ]es M[ií]nimas")

        conjuntos            = parse_provas(provas_text)
        peso_sec, peso_exam  = parse_formula(formula_text)
        nota_min             = parse_minima(minima_text)

        return {
            "codc": codc,
            "code": code,
            "conjuntos": conjuntos,
            "peso_secundario": peso_sec,
            "peso_exames": peso_exam,
            "nota_minima": nota_min,
        }
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return {"codc": codc, "code": code, "not_found": True}
        print(f"  HTTP {e.code} for {codc}/{code}")
        return None
    except Exception as e:
        print(f"  Error {codc}/{code}: {e}")
        return None


# ─── Load vagas: build course index ────────────────────────────────────────
def load_vagas() -> tuple[list[tuple[str, str, str]], dict[tuple[str, str], str]]:
    """
    Returns:
        unique_courses  — list of (COD_CURSO, COD_UO, COD_IES), one per unique (CURSO, UO)
        uo_curso_to_ies — dict (COD_UO, COD_CURSO) → COD_IES
    """
    seen: set[tuple[str, str]] = set()
    unique: list[tuple[str, str, str]] = []
    lookup: dict[tuple[str, str], str] = {}

    with open(VAGAS_FILE, encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            codc = row["COD CURSO"].strip()
            code = row["COD UO"].strip()
            ies  = row["COD IES"].strip()
            lookup[(code, codc)] = ies
            if (codc, code) not in seen:
                seen.add((codc, code))
                unique.append((codc, code, ies))

    return unique, lookup


# ─── SQL helpers ──────────────────────────────────────────────────────────
def esc(v) -> str:
    if v is None: return "NULL"
    return "'" + str(v).replace("'", "''") + "'"


def make_course_id(ies: str, code: str, codc: str) -> str:
    return f"{ies.zfill(4)}_{code.zfill(4)}_{codc.zfill(4)}"


# ─── SQL generation ───────────────────────────────────────────────────────
def generate_sql(cache: dict, uo_to_ies: dict[tuple[str, str], str]) -> str:
    update_lines: list[str] = []
    req_rows: list[str]     = []

    for entry in cache.values():
        if not entry or entry.get("not_found") or entry.get("error"):
            continue

        codc = entry["codc"]
        code = entry["code"]    # COD UO
        ies  = uo_to_ies.get((code, codc), "")
        if not ies:
            continue

        cid = esc(make_course_id(ies, code, codc))

        # ── UPDATE courses ──────────────────────────────────────────────
        parts = []
        if entry.get("peso_secundario") is not None:
            parts.append(f"peso_secundario = {entry['peso_secundario']}")
        if entry.get("peso_exames") is not None:
            parts.append(f"peso_exames = {entry['peso_exames']}")
        if entry.get("nota_minima") is not None:
            parts.append(f"nota_minima_p_ingresso = {entry['nota_minima']}")

        if parts:
            update_lines.append(f"UPDATE courses SET {', '.join(parts)} WHERE id = {cid};")

        # ── course_requirements rows ────────────────────────────────────
        for conj in (entry.get("conjuntos") or []):
            exams = conj.get("exams", [])
            if not exams:
                continue
            weight = round(1.0 / len(exams), 4)
            for exam_code in exams:
                req_rows.append(
                    f"  ({cid}, '{exam_code}', {conj['id']}, {weight})"
                )

    sql = [
        "-- Auto-generated by database/scrape_provas.py",
        "-- Run AFTER courses_import.sql in Supabase SQL Editor.",
        "",
        "-- ── 1. Weights and minimum grades ────────────────────────────────",
        *update_lines,
        "",
        "-- ── 2. Exam requirements ─────────────────────────────────────────",
        "TRUNCATE course_requirements;",
    ]

    if req_rows:
        sql.append(
            "INSERT INTO course_requirements (course_id, exam_code, conjunto_id, weight) VALUES"
        )
        sql.append(",\n".join(req_rows) + ";")
    else:
        sql.append("-- No requirements found")

    sql.append("")
    sql.append(f"-- {len(update_lines)} courses updated, {len(req_rows)} requirement rows")
    return "\n".join(sql)


# ─── Main ─────────────────────────────────────────────────────────────────
def main():
    print(f"Loading vagas...")
    courses, uo_to_ies = load_vagas()
    print(f"  {len(courses)} unique (COD CURSO, COD UO) pairs")

    # Load existing cache
    cache: dict[str, dict] = {}
    if CACHE_FILE.exists():
        cache = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
        print(f"  Cache: {len(cache)} entries already done")

    to_scrape = [(codc, code, ies) for codc, code, ies in courses
                 if f"{codc}_{code}" not in cache]

    print(f"  To scrape: {len(to_scrape)} (est. {len(to_scrape) * DELAY / 60:.1f} min)")
    if not to_scrape:
        print("  Nothing new to scrape — regenerating SQL from cache.")

    scraped = errors = 0
    for i, (codc, code, _ies) in enumerate(to_scrape):
        key = f"{codc}_{code}"
        result = fetch(codc, code)

        if result:
            cache[key] = result
            if result.get("not_found"):
                pass  # silent
            else:
                scraped += 1
        else:
            cache[key] = {"codc": codc, "code": code, "error": True}
            errors += 1

        # Progress + periodic save
        if (i + 1) % 50 == 0 or (i + 1) == len(to_scrape):
            CACHE_FILE.write_text(
                json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            pct = (i + 1) / len(to_scrape) * 100 if to_scrape else 100
            print(f"  [{pct:5.1f}%] {i+1}/{len(to_scrape)} — ok:{scraped} err:{errors}")

        time.sleep(DELAY)

    # Final cache save
    CACHE_FILE.write_text(
        json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"\nGenerating SQL...")
    sql = generate_sql(cache, uo_to_ies)
    OUT_FILE.write_text(sql, encoding="utf-8")
    print(f"Written to {OUT_FILE}")
    print(f"\nRun order in Supabase SQL Editor:")
    print(f"  1. database/data/courses_import.sql")
    print(f"  2. database/data/provas_import.sql")


if __name__ == "__main__":
    main()
