'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { UserExam } from '@/lib/types'

interface AddExamInput {
  userId: string
  examCode: string
  grade: number
  examYear: number
}

export async function addExamAction(input: AddExamInput): Promise<UserExam> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_exams')
    .upsert(
      {
        user_id: input.userId,
        exam_code: input.examCode,
        grade: input.grade,
        exam_year: input.examYear,
      },
      { onConflict: 'user_id, exam_code, exam_year' }
    )
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/perfil')
  return data
}

export async function removeExamAction(examId: string, userId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('user_exams')
    .delete()
    .eq('id', examId)
    .eq('user_id', userId) // safety: only delete own exams

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/perfil')
}

export async function getExamsAction(userId: string): Promise<UserExam[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_exams')
    .select('*')
    .eq('user_id', userId)
    .order('exam_code', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}
