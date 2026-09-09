import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  { auth: { persistSession: false, autoRefreshToken: false } }
)

// bolt-website (মূল marketplace) — শুধু server-side-এ ব্যবহার হবে।
// service_role key RLS বাইপাস করে, তাই প্রতিটা staff-এর আলাদা
// bolt-website admin account লাগবে না — control-room-এর নিজের
// লগইনই যথেষ্ট (এই client ব্রাউজারে কখনো পাঠানো হবে না)।
const boltUrl = process.env.BOLT_SUPABASE_URL || 'https://ttvmzwjrxmzayaqmzbac.supabase.co'
const boltServiceKey = process.env.BOLT_SUPABASE_SERVICE_ROLE_KEY ?? ''

export const boltAdmin = createClient(
  boltUrl,
  boltServiceKey || 'placeholder-key',
  { auth: { persistSession: false, autoRefreshToken: false } }
)
