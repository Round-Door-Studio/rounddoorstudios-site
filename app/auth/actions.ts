'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function signIn(_: unknown, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) return { error: error.message }

  const raw = (formData.get('redirectTo') as string) || '/'
  const redirectTo = raw.startsWith('/auth/') ? '/library' : raw
  const sep = redirectTo.includes('?') ? '&' : '?'
  redirect(`${redirectTo}${sep}welcome=1`)
}

export async function signUp(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  if (password.length < 8 || !/\d/.test(password)) {
    return { error: 'Password must be at least 8 characters and include 1 number.' }
  }

  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: { data: { full_name: formData.get('fullName') as string } },
  })

  if (error) return { error: error.message }

  const raw = (formData.get('redirectTo') as string) || '/'
  const redirectTo = raw.startsWith('/auth/') ? '/library' : raw
  const sep = redirectTo.includes('?') ? '&' : '?'
  redirect(`${redirectTo}${sep}welcome=1`)
}

export async function signOut(formData: FormData) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const redirectTo = (formData.get('redirectTo') as string) || '/'
  redirect(redirectTo)
}

export async function requestPasswordReset(_: unknown, formData: FormData) {
  try {
    const supabase = await createClient()
    const email = formData.get('email') as string
    const headersList = await headers()

    // `origin` header isn't always sent for server action POSTs — fall back to host
    const origin =
      headersList.get('origin') ||
      (() => {
        const host = headersList.get('x-forwarded-host') || headersList.get('host') || ''
        const proto = headersList.get('x-forwarded-proto') || 'https'
        return host ? `${proto}://${host}` : ''
      })()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
    })

    if (error) {
      const msg = error.message
      return { error: (msg && msg !== '{}' && msg !== '[]') ? msg : 'Unable to send reset email. Please try again later.' }
    }
    return { success: true as const }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}

export async function updatePassword(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  if (password.length < 8 || !/\d/.test(password)) {
    return { error: 'Password must be at least 8 characters and include 1 number.' }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }
  return { success: true as const }
}
