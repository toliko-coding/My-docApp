import { supabase } from '@/lib/supabase';
import type { Category } from '@/types/database';

/** System categories (user_id null) plus this user's own custom categories, sorted for display. */
export async function listCategories(userId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}
