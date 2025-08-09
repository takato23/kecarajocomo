import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

/**
 * Supabase Auth Service
 * Replaces NextAuth with Supabase Auth
 */

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // Handle cookies in middleware/server components
          }
        }
      }
    }
  )
}

/**
 * Get authenticated user (replaces getServerSession)
 */
export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

/**
 * Get user profile with preferences
 */
export async function getUserProfile() {
  const user = await getUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select(`
      *,
      preferences:user_preferences(*)
    `)
    .eq('id', user.id)
    .single()

  return profile
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const supabase = await createClient()
  return supabase.auth.signInWithPassword({ email, password })
}

/**
 * Sign up new user
 */
export async function signUp(email: string, password: string, metadata?: any) {
  const supabase = await createClient()
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  })
}

/**
 * Sign out current user
 */
export async function signOut() {
  const supabase = await createClient()
  return supabase.auth.signOut()
}

/**
 * Get session (for client components)
 */
export async function getSession() {
  const supabase = await createClient()
  return supabase.auth.getSession()
}

/**
 * Refresh session
 */
export async function refreshSession() {
  const supabase = await createClient()
  return supabase.auth.refreshSession()
}

/**
 * Update user profile
 */
export async function updateProfile(updates: any) {
  const user = await getUser()
  if (!user) throw new Error('Not authenticated')

  const supabase = await createClient()
  return supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', user.id)
}

/**
 * Protected route wrapper
 */
export async function withAuth<T extends (...args: any[]) => any>(
  handler: T
): Promise<T> {
  return (async (...args: Parameters<T>) => {
    const user = await getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }
    return handler(...args)
  }) as T
}