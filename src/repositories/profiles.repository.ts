import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

/** Always exists once signed in — handle_new_user() seeds one row per auth user on signup. */
export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}

export type ProfilePatch = Partial<Pick<Profile, 'full_name' | 'currency'>>;

export async function updateProfile(userId: string, patch: ProfilePatch): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').update(patch).eq('id', userId).select('*').single();
  if (error) throw error;
  return data;
}
