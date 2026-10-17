import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

/**
 * Check if actual Supabase credentials are provided
 */
export function isSupabaseConfigured() {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.trim().length > 0 &&
    !supabaseUrl.includes('your-project') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.trim().length > 0 &&
    !supabaseAnonKey.includes('your-anon-key')
  )
}

/**
 * Check if offline demo mode is explicitly forced or in automated test environment
 */
export function isOfflineDemoForced() {
  return (
    import.meta.env.VITE_ENABLE_OFFLINE_DEMO === 'true' ||
    import.meta.env.MODE === 'test' ||
    (typeof process !== 'undefined' && process?.env?.NODE_ENV === 'test')
  )
}

/**
 * Initialized Supabase client (only created if configured)
 */
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null
