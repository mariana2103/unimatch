import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { EXAM_SUBJECTS } from '@/lib/constants'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const FAKE_COURSE_BLOCKLIST = [
  'Faculdade de Medicina e Ciências Biomédicas',
]

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = searchParams.get('q') ?? ''
  const area = searchParams.get('area') ?? ''
  const district = searchParams.get('district') ?? ''
  const tipo = searchParams.get('tipo') ?? ''
  const exam = searchParams.get('exam') ?? ''
  const page = parseInt(searchParams.get('page') ?? '0', 10)
  const limit = parseInt(searchParams.get('limit') ?? '48', 10)

  // Exam code equivalences (DGES treats these as the same for admission)
  const EXAM_EQUIVALENCES: Record<string, string[]> = {
    '16': ['16', '19'], // Matemática → also Matemática A
    '17': ['17', '19'], // MACS → also Matemática A
    '19': ['16', '17', '19'], // Matemática A → Matemática, MACS, Matemática A
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  let query = supabase
    .from('courses')
    .select(`
      id, nome, instituicao_nome, distrito, area, tipo, vagas,
      nota_ultimo_colocado, nota_ultimo_colocado_f2,
      peso_secundario, peso_exames,
      nota_minima_p_ingresso, nota_minima_prova,
      link_oficial, history,
      course_requirements(exam_code, weight, conjunto_id)
    `, { count: 'exact' })
    .not('instituicao_nome', 'in', `(${FAKE_COURSE_BLOCKLIST.map(s => `"${s}"`).join(',')})`)

  if (q.trim()) {
    const searchTerm = q.trim()
    query = query.or(
      `nome.ilike.%${searchTerm}%,instituicao_nome.ilike.%${searchTerm}%,area.ilike.%${searchTerm}%`
    )
  }

  if (area) query = query.eq('area', area)
  if (district) query = query.eq('distrito', district)
  if (tipo) query = query.eq('tipo', tipo)

  // Fetch more to account for exam post-filtering
  const fetchLimit = exam ? 400 : limit
  query = query.limit(fetchLimit)

  query = query
    .order('nome', { ascending: true })
    .range(page * limit, (page + 1) * limit - 1)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const courses = (data ?? []).map((row: any) => ({
    id: row.id,
    nome: row.nome,
    instituicao: row.instituicao_nome,
    distrito: row.distrito,
    area: row.area,
    tipo: row.tipo,
    vagas: row.vagas,
    notaUltimoColocado:    row.nota_ultimo_colocado    != null ? row.nota_ultimo_colocado    * 10 : null,
    notaUltimoColocadoF2:  row.nota_ultimo_colocado_f2 != null ? row.nota_ultimo_colocado_f2 * 10 : null,
    pesoSecundario: row.peso_secundario,
    pesoExame: row.peso_exames,
    notaMinima:     row.nota_minima_p_ingresso ?? null,
    notaMinimProva: row.nota_minima_prova      ?? null,
    provasIngresso: (row.course_requirements ?? []).map((r: any) => ({
      code: r.exam_code,
      name: EXAM_SUBJECTS.find((e: any) => e.code === r.exam_code)?.name ?? r.exam_code,
      weight: r.weight,
      conjunto_id: r.conjunto_id ?? 1,
    })),
    historico: row.history
      ? row.history.map((h: any) => ({
          year:     h.year,
          nota_f1:  h.nota_f1 != null ? h.nota_f1 * 10 : (h.nota != null ? h.nota * 10 : null),
          nota_f2:  h.nota_f2 != null ? h.nota_f2 * 10 : null,
          vagas_f1: h.vagas_f1 ?? null,
          vagas_f2: h.vagas_f2 ?? null,
        }))
      : null,
    link_oficial: row.link_oficial,
  }))

  // Apply exam filter with equivalences
  let filteredCourses = courses
  if (exam) {
    const eqCodes = EXAM_EQUIVALENCES[exam] ?? [exam]
    filteredCourses = courses.filter(c =>
      c.provasIngresso.some((p: { code: string }) => eqCodes.includes(p.code))
    )
  }

  const total = exam ? filteredCourses.length : (count ?? 0)
  const paginatedCourses = filteredCourses.slice(0, limit)

  return NextResponse.json({ courses: paginatedCourses, total })
}
