'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Profile } from '@/lib/types'

type ProfileUpdate = Partial<Pick<Profile, 'distrito_residencia' | 'contingente_especial' | 'course_group'>>

export async function updateProfileAction(userId: string, data: ProfileUpdate) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/perfil')
  return { success: true }
}

export async function getProfileAction(userId: string): Promise<Profile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return null
  return data
}
