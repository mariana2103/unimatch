'use server'
import { createServerSupabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function saveSubjectGrade(formData: any) {
  const supabase = createServerSupabase()
  
  const { data, error } = await supabase
    .from('user_grades')
    .upsert({
      user_id: formData.userId,
      subject_name: formData.subject,
      grade_10: formData.g10,
      grade_11: formData.g11,
      grade_12: formData.g12,
    })

  if (error) throw new Error(error.message)
  
  revalidatePath('/perfil') // Atualiza a página automaticamente
  return data
}

export async function getFavorites(userId: string) {
  const supabase = createServerSupabase()
  const { data, error } = await supabase
    .from('favorites')
    .select('*, courses(*)')
    .eq('user_id', userId)
    
  return data
}