import { createClient } from '@supabase/supabase-js'

// Server-side only — service_role key, RLS bypass করে সব data দেখতে পারবে
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)
