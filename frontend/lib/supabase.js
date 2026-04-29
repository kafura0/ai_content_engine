import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// DEV_MODE = true when Supabase is not configured (local prototype)
export const DEV_MODE = !url || !key

export const supabase = DEV_MODE ? null : createClient(url, key)

export async function getAuthHeader() {
  if (DEV_MODE || !supabase) return {}
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return {}
  return { Authorization: `Bearer ${session.access_token}` }
}
