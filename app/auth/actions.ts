'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  const data = {
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  // Send welcome email (don't block signup if email fails)
  try {
    const { sendWelcomeEmail, sendAdminNotification } = await import('@/lib/email')
    await Promise.all([
      sendWelcomeEmail({ userEmail: email, userName: name }),
      sendAdminNotification({ userEmail: email, userName: name }),
    ])
  } catch (emailError) {
    console.error('Error sending signup emails:', emailError)
    // Continue with signup even if email fails
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  return { success: true }
}
