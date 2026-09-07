import { createClient } from '@supabase/supabase-js'

// পুরনো/সাধারণ ব্যবহার (client component + supabase-sync.ts এখনো এটা ব্যবহার করে)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// শুধু server-side (Server Action/Route Handler)-এ ব্যবহার করবেন — RLS বাইপাস করে
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)
