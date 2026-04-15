import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ormnjvmapbexmbwadnrb.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ybW5qdm1hcGJleG1id2FkbnJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODkzODAsImV4cCI6MjA5MTY2NTM4MH0.uVCm6nLfU23rHHwsYyvsHD4xeo7VMCATEHWGuoUZuEk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DbWordProgress {
  user_id: string;
  word_id: string;
  confidence: number;
  last_seen_at: string;
}

export interface DbEpisode {
  id: string;
  level: string;
  target_words: string[];
  content: Record<string, unknown>;
  is_generated: boolean;
  created_at: string;
}

// ─── Word progress ─────────────────────────────────────────────────────────────

export async function upsertWordProgress(
  userId: string,
  wordId: string,
  confidence: number
): Promise<void> {
  await supabase.from('word_progress').upsert(
    {
      user_id: userId,
      word_id: wordId,
      confidence,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,word_id' }
  );
}

export async function fetchWordProgress(userId: string): Promise<DbWordProgress[]> {
  const { data } = await supabase
    .from('word_progress')
    .select('*')
    .eq('user_id', userId);
  return data ?? [];
}

// ─── Episodes ──────────────────────────────────────────────────────────────────

export async function fetchGeneratedEpisodes(): Promise<DbEpisode[]> {
  const { data } = await supabase
    .from('episodes')
    .select('*')
    .eq('is_generated', true)
    .order('created_at', { ascending: false });
  return data ?? [];
}

// location_id는 level 컬럼에 저장됨 (Edge Function에서 level: locationId로 insert)
export async function fetchEpisodesForLocation(locationId: string): Promise<DbEpisode[]> {
  const { data } = await supabase
    .from('episodes')
    .select('*')
    .eq('is_generated', true)
    .eq('level', locationId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function fetchEpisodeById(id: string): Promise<DbEpisode | null> {
  const { data } = await supabase
    .from('episodes')
    .select('*')
    .eq('id', id)
    .single();
  return data ?? null;
}
