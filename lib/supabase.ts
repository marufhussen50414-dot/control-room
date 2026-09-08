import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[supabase] NEXT_PUBLIC_SUPABASE_URL বা NEXT_PUBLIC_SUPABASE_ANON_KEY missing — Vercel env vars চেক করুন।'
  )
}

// খালি string দিয়ে হলেও client তৈরি হবে, পুরো পেজ crash করবে না —
// শুধু যেসব ফাংশন আসলে supabase কল করবে, সেগুলোতে error লগ হবে
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-key',
  { auth: { persistSession: false } }
)
