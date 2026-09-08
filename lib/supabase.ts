import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const boltUrl = process.env.BOLT_SUPABASE_URL ?? ''
const boltServiceKey = process.env.BOLT_SUPABASE_SERVICE_ROLE_KEY ?? ''

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  { auth: { persistSession: false, autoRefreshToken: false } }
)

// control-room-এর নিজের project (disputes/payouts/reports/audit_log/settings)
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-key',
  { auth: { persistSession: false, autoRefreshToken: false } }
)

// bolt-website-এর project (আসল marketplace orders/listings)
export const boltAdmin = createClient(
  boltUrl || 'https://placeholder.supabase.co',
  boltServiceKey || 'placeholder-key',
  { auth: { persistSession: false, autoRefreshToken: false } }
)
