'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { UserGrade } from '@/lib/types'

interface AddGradeInput {
  userId: string
  subject: string
  year: 10 | 11 | 12
  grade: number
}

export async function addGradeAction(input: AddGradeInput): Promise<UserGrade> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_grades')
    .upsert(
      {
        user_id: input.userId,
        subject_name: input.subject,
        year_level: input.year,
        grade: input.grade,
      },
      { onConflict: 'user_id, subject_name, year_level' }
    )
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/perfil')
  return data
}

export async function removeGradeAction(gradeId: string, userId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('user_grades')
    .delete()
    .eq('id', gradeId)
    .eq('user_id', userId) // safety: only delete own grades

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/perfil')
}

export async function getGradesAction(userId: string): Promise<UserGrade[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_grades')
    .select('*')
    .eq('user_id', userId)
    .order('year_level', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}
