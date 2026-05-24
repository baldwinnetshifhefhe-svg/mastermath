// Supabase client for the web app — same project the mobile app talks to.
// Auth state persists in window.localStorage, which the Supabase JS SDK
// uses by default in browsers, so no extra wiring is needed.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL  = 'https://yhmnjjkwwthnfgqeodjc.supabase.co';
const SUPABASE_ANON = 'sb_publishable_sC3PaMZP1oLWcX9wt65lXA_uVRbMfek';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: false,
  },
});
