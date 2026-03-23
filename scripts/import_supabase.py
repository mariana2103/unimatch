#!/usr/bin/env python3
"""
Supabase Import Script (v2)
===========================
Sources of truth (in priority order):
  1. dados_dges/iesip_vagas_2026-2027_pares_ies_cursos_16.02.2026v2_.xlsx
       → master course list for 2026/27 (1 696 rows; defines what goes in DB)
  2. dados_dges/iesip_vagas_2026-2027_nota_ultimo_colocado_1afase_2025_16.02.2026_.xlsx
       → nota último colocado 2025 (1ª fase) on 0-200 scale
  3. dados_dges/dges_vagascna_nota_ult_colocado_1afase2024_2025_17.02.2025.xlsx
       → nota 2024 (fallback) + vagas 2025
  4. scripts/cache/<url>
       → provas de ingresso, pesos, notas mínimas, district, historical grades

Behaviour:
  - Any course NOT in the 2026 pares file is DELETED from Supabase.
  - Courses in the 2026 pares file are upserted (insert new / update existing).
  - Match key: (nome, instituicao_nome) — same as before.
  - nota_ultimo_colocado stored 0-20 in DB (×10 in UI).
  - history entries also stored 0-20.

Setup:
    export SUPABASE_URL=https://xxxx.supabase.co
    export SUPABASE_SERVICE_KEY=your-service-role-key

Usage:
    python import_supabase.py           # live run
    python import_supabase.py --dry-run # preview only
"""

import os
import sys
import re
import math
import uuid
import logging
from collections import Counter
from pathlib import Path

import openpyxl
from bs4 import BeautifulSoup
from supabase import create_client, Client

# ── Config ────────────────────────────────────────────────────────────────────

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
DRY_RUN      = "--dry-run" in sys.argv
FRESH        = "--fresh"   in sys.argv

ROOT       = Path(__file__).parent.parent
DATA_DIR   = ROOT / "dados_dges"
CACHE_DIR  = Path(__file__).parent / "cache"

PARES_FILE    = DATA_DIR / "iesip_vagas_2026-2027_pares_ies_cursos_16.02.2026v2_.xlsx"
NOTA_FILE     = DATA_DIR / "iesip_vagas_2026-2027_nota_ultimo_colocado_1afase_2025_16.02.2026_.xlsx"
NOTA2024_FILE = DATA_DIR / "dges_vagascna_nota_ult_colocado_1afase2024_2025_17.02.2025.xlsx"

DETAIL_URL = "https://www.dges.gov.pt/guias/detcursopi.asp?codc={codc}&code={code}"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

if not DRY_RUN and (not SUPABASE_URL or not SUPABASE_KEY):
    log.error("Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.")
    sys.exit(1)

# ── CNAEF → app area ──────────────────────────────────────────────────────────

AREA_MAP = [
    ((480, 489), "Informática e Dados"),
    ((500, 539), "Engenharia e Tecnologia"),
    ((540, 599), "Engenharia e Tecnologia"),
    ((720, 729), "Ciências da Vida e Saúde"),
    ((640, 649), "Ciências da Vida e Saúde"),
    ((420, 429), "Ciências da Vida e Saúde"),
    ((430, 469), "Ciências Exatas e da Natureza"),
    ((340, 349), "Economia, Gestão e Contabilidade"),
    ((380, 389), "Direito, Ciências Sociais e Humanas"),
    ((310, 319), "Direito, Ciências Sociais e Humanas"),
    ((220, 229), "Direito, Ciências Sociais e Humanas"),
    ((100, 109), "Educação e Desporto"),
    ((810, 819), "Educação e Desporto"),
    ((210, 219), "Artes e Design"),
    ((200, 299), "Artes e Design"),
]

def cnaef_to_area(code) -> str:
    try:
        c = int(code)
    except (ValueError, TypeError):
        return ""
    for (lo, hi), area in AREA_MAP:
        if lo <= c <= hi:
            return area
    return ""

# ── Value helpers ─────────────────────────────────────────────────────────────

def _s(v) -> str:
    s = str(v).strip() if v is not None else ""
    return "" if s in ("None", "nan") else s

def _f(v) -> float | None:
    if v is None or v == "":
        return None
    try:
        f = float(v)
        return None if math.isnan(f) else f
    except (TypeError, ValueError):
        return None

def _i(v) -> int | None:
    f = _f(v)
    return None if f is None else int(f)

def nota_to_db(v) -> float | None:
    """Convert 0-200 scale → 0-20 for DB storage."""
    f = _f(v)
    return None if f is None else round(f / 10, 2)

# ── Cache lookup ──────────────────────────────────────────────────────────────

def _cache_path(cod_curso: str, cod_uo: str) -> Path:
    url = DETAIL_URL.format(codc=cod_curso, code=cod_uo)
    key = re.sub(r"[^\w]", "_", url)[:180]
    return CACHE_DIR / key

def read_cache(cod_curso: str, cod_uo: str) -> bytes | None:
    p = _cache_path(cod_curso, cod_uo)
    return p.read_bytes() if p.exists() else None

# ── Excel loaders ─────────────────────────────────────────────────────────────

def _xlsx_rows(path: Path, sheet: str, header_row: int = 0) -> list[dict]:
    wb = openpyxl.load_workbook(str(path), data_only=True, read_only=True)
    ws = wb[sheet]
    rows = list(ws.iter_rows(values_only=True))
    wb.close()
    if len(rows) <= header_row:
        return []
    headers = rows[header_row]
    return [
        dict(zip(headers, r))
        for r in rows[header_row + 1:]
        if any(v is not None for v in r)
    ]

def load_pares() -> list[dict]:
    rows = _xlsx_rows(PARES_FILE, "PUB_PRIV26272", header_row=0)
    log.info("Pares file: %d courses.", len(rows))
    return rows

def load_notas_2025() -> dict[tuple[str, str], dict]:
    """(cod_uo, cod_curso) → {nota, vagas_2025, vagas_2026} from the 2025 nota file."""
    nota_col  = "NOTA ULTIMO COLOCADO REGIME GERAL DE ACESSO 2025/2026"
    vagas25_col = "REGIME GERAL DE ACESSO  2025/2026"
    vagas26_col = "REGIME GERAL DE ACESSO  2026/2027"
    rows = _xlsx_rows(NOTA_FILE, "Concurso Nacional", header_row=0)
    out: dict[tuple[str, str], dict] = {}
    for r in rows:
        uo    = _s(r.get("COD UO"))
        curso = _s(r.get("COD CURSO"))
        if not uo or not curso:
            continue
        out[(uo, curso)] = {
            "nota":      _f(r.get(nota_col)),
            "vagas_25":  _i(r.get(vagas25_col)),
            "vagas_26":  _i(r.get(vagas26_col)),
        }
    log.info("Nota-2025 file: %d entries.", len(out))
    return out

def load_notas_2024() -> dict[tuple[str, str], dict]:
    """(cod_inst, cod_curso) → {nota, vagas_2024, vagas_2025} from old vagascna file."""
    nota_col   = "Nota último colocado 1ª Fase 2024 (cont. geral)"
    vagas24_col = "Vagas 2024"
    vagas25_col = "Vagas 2025"
    rows = _xlsx_rows(NOTA2024_FILE, "Nacional", header_row=3)
    out: dict[tuple[str, str], dict] = {}
    for r in rows:
        inst  = _s(r.get("Código Instit."))
        curso = _s(r.get("Código Curso"))
        if not inst or not curso:
            continue
        out[(inst, curso)] = {
            "nota":      _f(r.get(nota_col)),
            "vagas_24":  _i(r.get(vagas24_col)),
            "vagas_25":  _i(r.get(vagas25_col)),
        }
    log.info("Nota-2024 file: %d entries.", len(out))
    return out

# ── HTML detail page parser ───────────────────────────────────────────────────

def _sections(soup: BeautifulSoup) -> dict[str, list]:
    out: dict[str, list] = {}
    for h2 in soup.find_all("h2"):
        title = h2.get_text(strip=True)
        siblings = []
        for sib in h2.next_siblings:
            if getattr(sib, "name", None) == "h2":
                break
            siblings.append(sib)
        out[title] = siblings
    return out

def _sec_text(sections: dict, fragment: str) -> str:
    for k, v in sections.items():
        if fragment.lower() in k.lower():
            return " ".join(
                n.get_text(" ", strip=True) if hasattr(n, "get_text") else str(n).strip()
                for n in v
            ).strip()
    return ""

def _sec_nodes(sections: dict, fragment: str) -> list:
    for k, v in sections.items():
        if fragment.lower() in k.lower():
            return v
    return []

def _to_float(v) -> float | None:
    if v is None:
        return None
    try:
        s = str(v).strip().replace(",", ".")
        f = float(re.sub(r"[^\d.]", "", s))
        return f if f > 0 else None
    except Exception:
        return None

def parse_detail(raw: bytes) -> dict:
    """Parse a cached DGES detail page. Returns extracted fields."""
    try:
        soup = BeautifulSoup(raw, "lxml")
    except Exception:
        return {}

    sections = _sections(soup)
    detail: dict = {}

    # ── District from address line ────────────────────────────────────────────
    addr = _sec_text(sections, "Endere")
    m = re.search(
        r"\d{4}-\d{3}\s+([A-ZÁÉÍÓÚÂÊÔÃÕÀÇ][A-ZÁÉÍÓÚÂÊÔÃÕÀÇ a-záéíóúâêôãõàç]{2,40}?)"
        r"(?:\s*\bMap|\s*\bTel|\s*<|\s*$)",
        addr,
    )
    if m:
        detail["distrito"] = m.group(1).strip().title()

    # ── Provas de ingresso ────────────────────────────────────────────────────
    provas_nodes = _sec_nodes(sections, "Provas de Ingresso")
    provas: list[dict] = []
    if provas_nodes:
        frag = BeautifulSoup("".join(str(n) for n in provas_nodes), "lxml")
        for br in frag.find_all("br"):
            br.replace_with("\n")
        conjunto_id = 1
        for line in frag.get_text().splitlines():
            clean = line.replace("\xa0", " ").strip()
            if not clean or clean.lower().startswith("um dos"):
                continue
            if re.fullmatch(r"ou", clean, re.IGNORECASE):
                conjunto_id += 1
                continue
            m2 = re.match(r"^(\d{2})\s+(.+)$", clean)
            if m2:
                provas.append({
                    "conjunto_id": conjunto_id,
                    "code":        m2.group(1),
                    "name":        m2.group(2).strip(),
                })
    detail["provas"] = provas

    # ── Classificações mínimas ────────────────────────────────────────────────
    cmin = _sec_text(sections, "Classif")
    m = re.search(r"candidatura:\s*(\d+(?:[.,]\d)?)\s*pontos?", cmin)
    if m:
        detail["nota_minima_p_ingresso"] = float(m.group(1).replace(",", "."))
    m = re.search(r"[Pp]rovas? de ingresso:\s*(\d+(?:[.,]\d)?)\s*pontos?", cmin)
    if m:
        detail["nota_minima_prova"] = float(m.group(1).replace(",", "."))

    # ── Fórmula de cálculo ────────────────────────────────────────────────────
    formula = _sec_text(sections, "rmula")
    m = re.search(r"secund[aá]rio:\s*(\d+)\s*%", formula)
    if m:
        detail["peso_secundario"] = int(m.group(1)) / 100
    m = re.search(r"[Pp]rovas? de ingresso:\s*(\d+)\s*%", formula)
    if m:
        detail["peso_exames"] = int(m.group(1)) / 100

    # ── Historical grades from stats table (0-200 scale on page) ─────────────
    stats_nodes = _sec_nodes(sections, "Dados Estat")
    if stats_nodes:
        stats_soup = BeautifulSoup("".join(str(n) for n in stats_nodes), "lxml")
        table = stats_soup.find("table")
        if table:
            trows = table.find_all("tr")
            if len(trows) >= 3:
                year_cells = [
                    td.get_text(strip=True)
                    for td in trows[0].find_all(["td", "th"])
                ]
                col_map: dict[int, tuple[int, int]] = {}
                col_idx = 1
                for yc in year_cells[1:]:
                    if re.match(r"\d{4}", yc):
                        yr = int(yc)
                        for fase in (1, 2):
                            col_map[col_idx] = (yr, fase)
                            col_idx += 1
                for data_row in trows[2:]:
                    cells = [
                        td.get_text(strip=True)
                        for td in data_row.find_all(["td", "th"])
                    ]
                    if not cells:
                        continue
                    label = cells[0]
                    # Vagas row
                    if label == "Vagas":
                        for ci, (yr, fase) in col_map.items():
                            if ci < len(cells) and cells[ci]:
                                v = _i(cells[ci])
                                if v is not None:
                                    detail[f"vagas_{yr}_f{fase}"] = v
                    # Nota último colocado row
                    if "ltimo Colocado" in label or "ltimo colocado" in label:
                        for ci, (yr, fase) in col_map.items():
                            if ci < len(cells) and cells[ci]:
                                v = _to_float(cells[ci].replace(",", "."))
                                if v is not None:
                                    detail[f"nota_{yr}_f{fase}"] = v  # 0-200

    return detail

# ── History builder ───────────────────────────────────────────────────────────

def build_history(
    detail: dict,
    data_2025: dict | None,
    data_2024: dict | None,
    vagas_2026: int | None,
) -> list[dict] | None:
    """Build history array with notas (0-20) and vagas per phase per year."""
    hist = []
    for yr in (2023, 2024, 2025):
        # Notas: HTML stats table first (0-200 → ÷10), then Excel fallbacks
        f1 = nota_to_db(detail.get(f"nota_{yr}_f1"))
        f2 = nota_to_db(detail.get(f"nota_{yr}_f2"))
        if yr == 2025 and f1 is None and data_2025:
            f1 = nota_to_db(data_2025.get("nota"))
        if yr == 2024 and f1 is None and data_2024:
            f1 = nota_to_db(data_2024.get("nota"))

        # Vagas: HTML first, then Excel fallbacks
        vf1 = detail.get(f"vagas_{yr}_f1")
        vf2 = detail.get(f"vagas_{yr}_f2")
        if yr == 2025 and vf1 is None and data_2025:
            vf1 = data_2025.get("vagas_25")
        if yr == 2024 and vf1 is None and data_2024:
            vf1 = data_2024.get("vagas_24")
        if yr == 2024 and vf1 is None and data_2025:
            vf1 = data_2025.get("vagas_25")  # nota file also has 2025/2026 vagas

        if f1 is not None or f2 is not None or vf1 is not None:
            hist.append({
                "year":     yr,
                "nota_f1":  f1,
                "nota_f2":  f2,
                "vagas_f1": vf1,
                "vagas_f2": vf2,
            })

    # Add 2026 vagas as the current year entry (no nota yet — season not over)
    if vagas_2026 is not None:
        hist.append({"year": 2026, "nota_f1": None, "nota_f2": None, "vagas_f1": vagas_2026, "vagas_f2": None})

    return hist if hist else None

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    if DRY_RUN:
        log.info("DRY RUN — no writes.")

    sb: Client | None = None
    if not DRY_RUN:
        sb = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Load all data sources
    pares        = load_pares()
    notas_2025   = load_notas_2025()
    notas_2024   = load_notas_2024()

    # Wipe all existing data when --fresh is passed
    if FRESH and sb is not None:
        log.info("--fresh: deleting ALL existing courses and requirements...")
        sb.table("course_requirements").delete().neq("course_id", "").execute()
        sb.table("courses").delete().neq("id", "").execute()
        log.info("Wiped. Starting clean import.")

    # Fetch existing courses from DB (skip in dry run and after --fresh wipe)
    existing: dict[tuple[str, str], str] = {}   # (nome, inst) → id
    if sb is not None and not FRESH:
        log.info("Fetching existing courses from Supabase...")
        page = 0
        while True:
            res = (
                sb.table("courses")
                .select("id,nome,instituicao_nome")
                .range(page * 1000, page * 1000 + 999)
                .execute()
            )
            for r in res.data:
                existing[(_s(r["nome"]), _s(r["instituicao_nome"]))] = r["id"]
            if len(res.data) < 1000:
                break
            page += 1
        log.info("Existing courses in DB: %d", len(existing))

    # ── Build 2026 course records ─────────────────────────────────────────────
    courses_2026: dict[tuple[str, str], dict] = {}
    no_cache = 0

    for row in pares:
        nome      = _s(row.get("CURSO"))
        inst_nome = _s(row.get("IES UO"))
        if not nome or not inst_nome:
            continue

        cod_uo    = _s(row.get("COD UO"))
        cod_curso = _s(row.get("COD CURSO"))

        # Tipo: SUBSISTEMA (Público/Privado) is authoritative
        tipo = "privada" if _s(row.get("SUBSISTEMA")).lower() == "privado" else "publica"

        # Area from CNAEF code
        area = cnaef_to_area(row.get("COD CNAEF"))

        # Vagas 2026 — general admission regime
        vagas = _i(row.get("REGIME GERAL DE ACESSO"))

        # Excel lookup dicts
        data_2025 = notas_2025.get((cod_uo, cod_curso))
        data_2024 = notas_2024.get((cod_uo, cod_curso))

        # HTML detail page (provas, pesos, district, historical grades + vagas)
        raw    = read_cache(cod_curso, cod_uo)
        detail = parse_detail(raw) if raw else {}
        if not raw:
            no_cache += 1

        # nota_ultimo_colocado: 2025 f1 from HTML → Excel 2025 → Excel 2024
        nota_uc_raw = (
            detail.get("nota_2025_f1")
            or (data_2025 and data_2025.get("nota"))
            or (data_2024 and data_2024.get("nota"))
        )
        nota_uc = nota_to_db(nota_uc_raw)

        # nota_ultimo_colocado_f2: most recent 2ª fase from HTML
        nota_f2_raw = detail.get("nota_2025_f2") or detail.get("nota_2024_f2")
        nota_f2 = nota_to_db(nota_f2_raw)

        history = build_history(detail, data_2025, data_2024, vagas)

        payload = {
            "nome":                    nome,
            "instituicao_nome":        inst_nome,
            "tipo":                    tipo,
            "area":                    area,
            "distrito":                detail.get("distrito", ""),
            "vagas":                   vagas,
            "nota_ultimo_colocado":    nota_uc,
            "nota_ultimo_colocado_f2": nota_f2,
            "peso_secundario":         detail.get("peso_secundario"),
            "peso_exames":             detail.get("peso_exames"),
            "nota_minima_p_ingresso":  detail.get("nota_minima_p_ingresso"),
            "nota_minima_prova":       detail.get("nota_minima_prova"),
            "history":                 history,
        }

        courses_2026[(nome, inst_nome)] = {
            "payload": payload,
            "provas":  detail.get("provas", []),
        }

    log.info(
        "Built %d courses from 2026 data (%d missing cached HTML).",
        len(courses_2026),
        no_cache,
    )

    # ── Delete courses NOT in 2026 vagas ──────────────────────────────────────
    to_delete = [eid for key, eid in existing.items() if key not in courses_2026]
    log.info("Courses to DELETE (not in 2026 vagas): %d", len(to_delete))
    if to_delete and not DRY_RUN:
        for i in range(0, len(to_delete), 100):
            batch = to_delete[i : i + 100]
            sb.table("course_requirements").delete().in_("course_id", batch).execute()
            sb.table("courses").delete().in_("id", batch).execute()
        log.info("Deleted %d stale courses.", len(to_delete))

    # ── Upsert 2026 courses ───────────────────────────────────────────────────
    inserted = updated = 0

    for (nome, inst_nome), data in courses_2026.items():
        payload = data["payload"]
        provas  = data["provas"]
        curso_id = existing.get((nome, inst_nome))

        # Strip None values so we don't clobber existing DB data for missing fields
        clean = {k: v for k, v in payload.items() if v is not None}

        if DRY_RUN:
            if curso_id:
                updated += 1
            else:
                inserted += 1
            continue

        if curso_id:
            sb.table("courses").update(clean).eq("id", curso_id).execute()
            updated += 1
        else:
            clean["id"] = str(uuid.uuid4())
            res = sb.table("courses").insert(clean).execute()
            if res.data:
                curso_id = res.data[0]["id"]
                existing[(nome, inst_nome)] = curso_id
            inserted += 1

        # Replace course requirements if we have HTML data
        if curso_id and provas:
            sb.table("course_requirements").delete().eq("course_id", curso_id).execute()
            conj_sizes = Counter(p["conjunto_id"] for p in provas)
            reqs = [
                {
                    "course_id":   curso_id,
                    "exam_code":   p["code"],
                    "conjunto_id": int(p["conjunto_id"]),
                    "weight":      round(1.0 / conj_sizes[p["conjunto_id"]], 4),
                }
                for p in provas
            ]
            sb.table("course_requirements").insert(reqs).execute()

    log.info("Done — inserted: %d  updated: %d  deleted: %d", inserted, updated, len(to_delete))
    if DRY_RUN:
        log.info("(dry run — no data was written)")


if __name__ == "__main__":
    main()
