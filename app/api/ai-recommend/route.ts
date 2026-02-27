import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

export const maxDuration = 30

const AREAS = [
  'Artes e Design',
  'Ciências da Vida e Saúde',
  'Ciências Exatas e da Natureza',
  'Direito, Ciências Sociais e Humanas',
  'Economia, Gestão e Contabilidade',
  'Educação e Desporto',
  'Engenharia e Tecnologia',
  'Informática e Dados',
]

const schema = z.object({
  areaWeights: z
    .record(z.string(), z.number().min(0).max(1))
    .describe(
      `Relevance score (0-1) for each course area. Only include areas from this list: ${AREAS.join(', ')}. Higher = more relevant to the student.`,
    ),
  keywords: z
    .array(z.string())
    .max(20)
    .describe(
      'Portuguese keywords from course names or disciplines that match the student. Examples: "engenharia", "medicina", "programação", "design", "psicologia"',
    ),
  summary: z
    .string()
    .max(200)
    .describe('One sentence in Portuguese summarizing the student profile and what kind of course suits them'),
})

export async function POST(req: Request) {
  try {
    const { answers } = await req.json() as {
      answers: {
        interests: string
        environment: string
        social: string
        subjects: string
        career_values: string
      }
    }

    const prompt = `Analisa o perfil deste estudante português e devolve pesos de relevância para as áreas de curso universitário, palavras-chave relevantes, e um resumo do perfil.

RESPOSTAS DO QUESTIONÁRIO:
1. Interesses e paixões: "${answers.interests}"
2. Ambiente de trabalho preferido: "${answers.environment}"
3. Preferência social (equipa vs individual): "${answers.social}"
4. Disciplinas favoritas: "${answers.subjects}"
5. O que valoriza na carreira: "${answers.career_values}"

ÁREAS DISPONÍVEIS (só podes usar estas):
${AREAS.map(a => `- ${a}`).join('\n')}

Devolve pesos de 0 a 1 para cada área com base nas respostas acima (0 = nada relevante, 1 = muito relevante).
Inclui também palavras-chave em português que correspondam a cursos relevantes para este estudante.`

    const { object } = await generateObject({
      model: anthropic('claude-haiku-4-5-20251001'),
      schema,
      prompt,
    })

    return Response.json(object)
  } catch (error) {
    console.error('ai-recommend error:', error)
    return Response.json({ error: 'Falha ao gerar recomendações' }, { status: 500 })
  }
}
