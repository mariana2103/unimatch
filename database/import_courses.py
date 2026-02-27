"""
DGES Course Data Importer — stdlib only, no pip required
=========================================================
Merges médias.csv + vagas.csv → generates courses_import.sql

Usage:
    python3 database/import_courses.py

Output:
    database/data/courses_import.sql  ← paste into Supabase SQL Editor
"""

import csv, json, re, sys
from pathlib import Path

BASE   = Path(__file__).parent
MEDIAS = BASE / "data" / "médias.csv"
VAGAS  = BASE / "data" / "vagas.csv"
OUT    = BASE / "data" / "courses_import.sql"

# ─── Distrito by CodigoEstabelecimento (COD IES) ───────────────────────────
# Built from the actual institution list in your data files.
DISTRITO_MAP: dict[str, str] = {
    "0100": "Açores",
    "0200": "Faro",
    "0300": "Aveiro",
    "0400": "Castelo Branco",   # UBI is in Covilhã, Castelo Branco district
    "0500": "Coimbra",
    "0600": "Évora",
    "0900": "Lisboa",           # Universidade Nova de Lisboa
    "1000": "Braga",            # Universidade do Minho
    "1100": "Porto",
    "1200": "Vila Real",        # Universidade de Trás-os-Montes
    "1300": "Madeira",
    "1500": "Lisboa",           # Universidade de Lisboa
    "3020": "Beja",
    "3030": "Braga",            # Instituto Politécnico do Cávado e do Ave
    "3040": "Bragança",
    "3050": "Castelo Branco",
    "3060": "Coimbra",
    "3090": "Guarda",
    "3100": "Leiria",
    "3110": "Lisboa",           # Instituto Politécnico de Lisboa
    "3120": "Portalegre",
    "3130": "Porto",            # Instituto Politécnico do Porto
    "3140": "Santarém",
    "3150": "Setúbal",
    "3160": "Viana do Castelo",
    "3180": "Viseu",
    "3240": "Santarém",         # Instituto Politécnico de Tomar
    "6800": "Lisboa",           # ISCTE
    "7002": "Lisboa",           # Escola Superior de Enfermagem de Lisboa
    "7105": "Lisboa",           # Escola Superior Náutica (Paço d'Arcos)
    "7110": "Lisboa",           # Escola de Hotelaria do Estoril
}

# ─── CNAEF 3-digit code → area ─────────────────────────────────────────────
# Standard Classificação Nacional de Áreas de Educação e Formação.
# Maps to the AREAS list in lib/constants.ts.
def cnaef_to_area(code: str) -> str:
    try:
        c = int(code)
    except (ValueError, TypeError):
        return "Outros"

    # Education & Sport
    if 140 <= c <= 149 or c == 813:
        return "Educação e Desporto"

    # Arts & Design
    if 210 <= c <= 219:
        return "Artes e Design"

    # Humanities / Social sciences / Law / Communications
    if 221 <= c <= 229 or c == 310 or 319 <= c <= 329 or 380 <= c <= 389 \
            or 760 <= c <= 769 or 860 <= c <= 869:
        return "Direito, Ciências Sociais e Humanas"

    # Economics, Management, Accounting, Tourism
    if 311 <= c <= 318 or 340 <= c <= 349 or c in (811, 812):
        return "Economia, Gestão e Contabilidade"

    # Life sciences / Biology / Environment / Health
    if 420 <= c <= 429 or 580 <= c <= 589 or 620 <= c <= 649 \
            or 720 <= c <= 729 or 850 <= c <= 859:
        return "Ciências da Vida e Saúde"

    # Exact sciences (math, physics, chemistry)
    if 440 <= c <= 459:
        return "Ciências Exatas e da Natureza"

    # Computing & Data
    if 460 <= c <= 489:
        return "Informática e Dados"

    # Engineering, Architecture, Transport
    if 520 <= c <= 549 or 840 <= c <= 849:
        return "Engenharia e Tecnologia"

    return "Outros"

# ─── Helpers ───────────────────────────────────────────────────────────────
def natureza_to_tipo(natureza: str) -> str:
    n = natureza.strip().lower()
    if "priv" in n or "concord" in n or "cooper" in n:
        return "privada"
    return "publica"

def tipo_instituicao_to_tipo(tipo: str) -> str:
    """Convert vagas.csv 'SUBSISTEMA' column ("Público"/"Privado") to DB tipo."""
    t = tipo.strip().lower()
    if "priv" in t or "concord" in t or "cooper" in t:
        return "privada"
    return "publica"

def make_id(cod_ies: str, cod_uo: str, cod_curso: str) -> str:
    return f"{cod_ies.zfill(4)}_{cod_uo.zfill(4)}_{cod_curso.zfill(4)}"

YEARS = [2019, 2020, 2021, 2022, 2023, 2024]

def to_float(s: str) -> float:
    """Parse float with comma or dot decimal separator (Portuguese CSVs use comma)."""
    return float(s.replace(",", "."))

def build_history(row: dict) -> list | None:
    entries = []
    for year in YEARS:
        nota = row.get(f"NotaIngressoMedia{year}", "").strip()
        try:
            nota_f = to_float(nota)
            if nota_f == 0:
                continue
            entries.append({"year": year, "nota": nota_f})
        except (ValueError, TypeError):
            pass
    return entries if entries else None

def esc(val) -> str:
    """SQL string literal escape."""
    if val is None:
        return "NULL"
    return "'" + str(val).replace("'", "''") + "'"

def num(val) -> str:
    if val is None or val == "":
        return "NULL"
    try:
        return str(float(val))
    except (ValueError, TypeError):
        return "NULL"

# ─── Load files ────────────────────────────────────────────────────────────
def load_medias() -> list[dict]:
    with open(MEDIAS, encoding="utf-8-sig") as f:
        # Skip 4 junk header rows from the DGES portal export
        for _ in range(4):
            f.readline()
        return list(csv.DictReader(f))

def load_vagas() -> dict[tuple, dict]:
    """Returns dict keyed by (COD IES, COD CURSO) → row (with accumulated TOTAL VAGAS)."""
    result: dict[tuple, dict] = {}
    with open(VAGAS, encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            key = (row["COD IES"].strip(), row["COD CURSO"].strip())
            # Accumulate vagas (a course can appear multiple times for different regimes)
            if key in result:
                try:
                    result[key]["TOTAL VAGAS"] = str(
                        int(result[key]["TOTAL VAGAS"]) + int(row["TOTAL VAGAS"])
                    )
                except (ValueError, KeyError):
                    pass
            else:
                result[key] = row
    return result


def load_vagas_full() -> list[dict]:
    """Returns ALL rows from vagas.csv (deduplicated by COD IES + COD UO + COD CURSO)."""
    seen: set[tuple] = set()
    rows: list[dict] = []
    with open(VAGAS, encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            key = (row["COD IES"].strip(), row["COD UO"].strip(), row["COD CURSO"].strip())
            if key not in seen:
                seen.add(key)
                rows.append(row)
    return rows

# ─── Main ──────────────────────────────────────────────────────────────────
def main():
    print(f"Reading {MEDIAS}...")
    medias = load_medias()
    print(f"  {len(medias)} rows")

    print(f"Reading {VAGAS}...")
    vagas = load_vagas()
    vagas_full = load_vagas_full()
    print(f"  {len(vagas)} unique courses in vagas")

    rows_sql: list[str] = []
    warnings: list[str] = []
    skipped = 0
    seen_ids: set[str] = set()

    for row in medias:
        cod_ies   = row.get("CodigoEstabelecimento", "").strip()
        cod_uo    = row.get("CodigoUnidadeOrganica", "").strip()
        cod_curso = row.get("CodigoCurso", "").strip()
        nome      = row.get("NomeCurso", "").strip()
        instituicao = row.get("Estabelecimento", "").strip()
        natureza  = row.get("Natureza", "")

        if not cod_ies or not cod_curso or not nome:
            skipped += 1
            continue

        course_id = make_id(cod_ies, cod_uo, cod_curso)
        tipo      = natureza_to_tipo(natureza)

        # ── Historia ──
        history   = build_history(row)
        nota_2024 = row.get("NotaIngressoMedia2024", "").strip()
        try:
            nota_corte = to_float(nota_2024) if nota_2024 and to_float(nota_2024) > 0 else None
        except ValueError:
            nota_corte = None

        # ── Join vagas ──
        vaga_row  = vagas.get((cod_ies, cod_curso))
        vagas_val = None
        cnaef     = ""
        if vaga_row:
            try:
                vagas_val = int(vaga_row.get("TOTAL VAGAS", ""))
            except (ValueError, TypeError):
                pass
            cnaef = vaga_row.get("COD CNAEF", "").strip()

        # ── Distrito ──
        distrito = DISTRITO_MAP.get(cod_ies, "Outros")
        if distrito == "Outros":
            warnings.append(f"  No distrito for COD IES={cod_ies} ({instituicao})")

        # ── Area ──
        area = cnaef_to_area(cnaef) if cnaef else "Outros"
        if area == "Outros":
            warnings.append(f"  No CNAEF mapping for course={nome!r} (CNAEF={cnaef!r})")

        # ── History JSON ──
        history_sql = (
            esc(json.dumps(history, ensure_ascii=False)) + "::jsonb"
            if history else "NULL"
        )

        rows_sql.append(
            f"  ({esc(course_id)}, {esc(nome)}, {esc(instituicao)}, {esc(tipo)}, "
            f"{num(nota_corte)}, "
            f"{esc(distrito)}, {esc(area)}, "
            f"NULL, NULL, "          # peso_secundario, peso_exames — need provas file
            f"95.0, "                # nota_minima_p_ingresso default
            f"{vagas_val if vagas_val is not None else 'NULL'}, "
            f"{history_sql})"
        )
        seen_ids.add(course_id)

    # ── Courses in vagas.csv not found in médias.csv (e.g. private institutions) ──
    vagas_only = 0
    for vrow in vagas_full:
        cod_ies   = vrow.get("COD IES", "").strip()
        cod_uo    = vrow.get("COD UO", "").strip()
        cod_curso = vrow.get("COD CURSO", "").strip()
        if not cod_ies or not cod_curso:
            continue
        course_id = make_id(cod_ies, cod_uo, cod_curso)
        if course_id in seen_ids:
            continue  # already emitted from médias

        nome        = vrow.get("CURSO", "").strip()
        instituicao = vrow.get("IES", "").strip()
        tipo        = tipo_instituicao_to_tipo(vrow.get("SUBSISTEMA", ""))
        cnaef       = vrow.get("COD CNAEF", "").strip()
        try:
            vagas_val = int(vrow.get("TOTAL VAGAS", ""))
        except (ValueError, TypeError):
            vagas_val = None

        distrito = DISTRITO_MAP.get(cod_ies, "Outros")
        area     = cnaef_to_area(cnaef) if cnaef else "Outros"

        rows_sql.append(
            f"  ({esc(course_id)}, {esc(nome)}, {esc(instituicao)}, {esc(tipo)}, "
            f"NULL, "                # nota_ultimo_colocado — no médias for private
            f"{esc(distrito)}, {esc(area)}, "
            f"NULL, NULL, "
            f"95.0, "
            f"{vagas_val if vagas_val is not None else 'NULL'}, "
            f"NULL)"                 # no history
        )
        seen_ids.add(course_id)
        vagas_only += 1

    # ── Write SQL ──
    sql_lines = [
        "-- Auto-generated by database/import_courses.py",
        "-- Paste into Supabase SQL Editor and run.",
        "",
        "INSERT INTO courses (",
        "  id, nome, instituicao_nome, tipo, nota_ultimo_colocado,",
        "  distrito, area, peso_secundario, peso_exames,",
        "  nota_minima_p_ingresso, vagas, history",
        ") VALUES",
        ",\n".join(rows_sql),
        "ON CONFLICT (id) DO UPDATE SET",
        "  nome                 = EXCLUDED.nome,",
        "  instituicao_nome     = EXCLUDED.instituicao_nome,",
        "  nota_ultimo_colocado = EXCLUDED.nota_ultimo_colocado,",
        "  distrito             = EXCLUDED.distrito,",
        "  area                 = EXCLUDED.area,",
        "  vagas                = EXCLUDED.vagas,",
        "  history              = EXCLUDED.history;",
        "",
        f"-- Rows: {len(rows_sql)}, Skipped: {skipped}",
    ]

    OUT.write_text("\n".join(sql_lines), encoding="utf-8")

    print(f"\nWritten to {OUT}")
    print(f"  Inserted/updated: {len(rows_sql)} courses ({len(rows_sql) - vagas_only} from médias + {vagas_only} vagas-only), skipped: {skipped}")

    if warnings:
        unique_warnings = sorted(set(warnings))
        print(f"\n  {len(unique_warnings)} warnings (missing mappings):")
        for w in unique_warnings[:15]:
            print(w)
        if len(unique_warnings) > 15:
            print(f"  ... and {len(unique_warnings) - 15} more")

    print("\nSTILL MISSING (need separate DGES file 'Provas de Ingresso'):")
    print("  - peso_secundario / peso_exames")
    print("  - nota_minima_p_ingresso (using default 95.0 for now)")
    print("  - course_requirements table (exam codes per course)")

if __name__ == "__main__":
    main()
