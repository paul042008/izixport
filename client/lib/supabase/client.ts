// client/lib/supabase/client.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase environment variables are missing!");
}

export const supabase = createSupabaseClient(supabaseUrl!, supabaseAnonKey!);

// Export the function for components
export function createClient() {
  return supabase;
}