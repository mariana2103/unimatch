'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveYearlyGrade(formData: { 
  userId: string, 
  subject: string, 
  year: number, 
  grade: number 
}) {
  const supabase = createClient()
  
  const { data, error } = await (await supabase)
    .from('user_grades')
    .upsert({
      user_id: formData.userId,
      subject_name: formData.subject,
      year_level: formData.year, // 10, 11 ou 12
      grade: formData.grade,
    }, {
      onConflict: 'user_id, subject_name, year_level'
    })

  if (error) throw new Error(error.message)
  
  revalidatePath('/dashboard/notas')
  return { success: true }
}

export async function getFavorites(userId: string) {
  const supabase =createClient()
  const { data, error } = await (await supabase)
    .from('favorites')
    .select('*, courses(*)')
    .eq('user_id', userId)
    
  return data
}