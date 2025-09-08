// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anon) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;

// 토큰이 바뀔 때마다 Realtime에도 반영
supabase.auth.onAuthStateChange((_evt, session) => {
  const token = session?.access_token || "";
  supabase.realtime.setAuth(token);
});
