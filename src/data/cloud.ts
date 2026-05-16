import { supabase } from './supabase';
import { coerceData } from './repository';
import type { AppData } from './types';

const TABLE = 'user_data';

// Loads the signed-in user's whole library. Returns null if they have
// no cloud row yet (first sign-in).
export async function fetchCloudData(
  userId: string,
): Promise<AppData | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(TABLE)
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return coerceData((data.data ?? {}) as Partial<AppData>);
}

export async function saveCloudData(
  userId: string,
  appData: AppData,
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from(TABLE).upsert({
    user_id: userId,
    data: appData,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
