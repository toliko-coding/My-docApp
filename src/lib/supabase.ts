import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True once real Supabase credentials are present. The app must never fake
 * data when this is false — screens should render an explicit "not
 * configured" empty state instead (see i18n `emptyStates.notConfigured*`).
 *
 * Only the public anon key ever ships in the client bundle. RLS policies
 * (see supabase/migrations) are what actually keep one user's data private
 * from another — the anon key alone grants no access. The service_role key
 * must never be used here; it stays server-side only (Edge Functions).
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
