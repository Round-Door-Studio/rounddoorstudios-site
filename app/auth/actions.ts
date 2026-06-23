'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signIn(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) return { error: error.message }

  const redirectTo = (formData.get('redirectTo') as string) || '/library'
  redirect(redirectTo)
}

export async function signUp(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const fullName = formData.get('fullName') as string

  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: { data: { full_name: fullName } },
  })

  if (error) return { error: error.message }

  redirect('/library')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
