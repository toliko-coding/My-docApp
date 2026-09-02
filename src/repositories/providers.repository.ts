import { supabase } from '@/lib/supabase';
import type { Provider } from '@/types/database';
import { normalizeProviderName } from '@/utils/category';

/** System providers plus this user's own, matching a typed prefix — powers the autocomplete in the bill form. */
export async function searchProviders(userId: string, query: string): Promise<Provider[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .ilike('normalized_name', `%${normalizeProviderName(trimmed)}%`)
    .order('is_system', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data ?? [];
}

/**
 * Generic provider-learning mechanism: reuses an existing provider (system or
 * this user's own) matching the normalized name, or creates a new
 * user-scoped one on the fly. Not hardcoded to any fixed provider list.
 */
export async function findOrCreateProvider(
  userId: string,
  name: string,
  defaultCategoryId?: string | null,
): Promise<Provider> {
  const normalized = normalizeProviderName(name);

  const { data: existing, error: findError } = await supabase
    .from('providers')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .eq('normalized_name', normalized)
    .limit(1)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing;

  const { data: created, error: createError } = await supabase
    .from('providers')
    .insert({
      user_id: userId,
      name: name.trim(),
      normalized_name: normalized,
      default_category_id: defaultCategoryId ?? null,
      is_system: false,
    })
    .select('*')
    .single();

  if (createError) throw createError;
  return created;
}
