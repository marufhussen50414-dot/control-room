import { createClient } from '@supabase/supabase-js';

// This connects to the MAIN marketplace website's Supabase project —
// a completely separate project from Control Room's own database
// (lib/supabase.ts). Nothing here ever touches Control Room's own
// tables; it only reads/writes the real site's `profiles` and `orders`.
const mainSiteUrl =
  process.env.NEXT_PUBLIC_MAIN_SITE_SUPABASE_URL ||
  'https://ttvmzwjrxmzayaqmzbac.supabase.co';

// This is a "publishable" key — safe to ship to the browser by design,
// the same way the main site itself uses it. Real authorization for
// admin actions comes from Postgres Row Level Security (see the
// `is_admin()` policies), not from keeping this key secret.
const mainSiteAnonKey =
  process.env.NEXT_PUBLIC_MAIN_SITE_SUPABASE_ANON_KEY ||
  'sb_publishable_A3ibWBQD4tIZXTJKwLY-Rg_qLSGn9wM';

export const mainSiteSupabase = createClient(mainSiteUrl, mainSiteAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    // Needed so a Google OAuth redirect landing back on this app gets
    // its session parsed and stored automatically.
    detectSessionInUrl: true,
    flowType: 'pkce',
    // A distinct storage key so this session never collides with
    // anything else Control Room stores in localStorage.
    storageKey: 'gamehaatbd_main_site_auth',
  },
});
