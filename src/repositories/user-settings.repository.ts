import { supabase } from '@/lib/supabase';
import type { UserSettings } from '@/types/database';

/** Matches the column defaults in supabase/migrations/0001_init.sql — used when no row exists yet (no signup trigger seeds one). */
export function defaultUserSettings(userId: string): UserSettings {
  return {
    user_id: userId,
    theme: 'system',
    notifications_enabled: true,
    reminder_days_before: [7, 3, 1, 0],
    push_token: null,
    created_at: '',
    updated_at: '',
  };
}

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data ?? defaultUserSettings(userId);
}

export type UserSettingsPatch = Partial<Pick<UserSettings, 'theme' | 'notifications_enabled' | 'reminder_days_before'>>;

export async function updateUserSettings(userId: string, patch: UserSettingsPatch): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
