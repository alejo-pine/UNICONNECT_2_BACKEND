import { supabase } from '../utils/supabaseClient';
import { Profile } from '../types/common';

const TABLE = 'profile';

export const findAllProfiles = async (): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, name, email, avatar_url, career, semester, phone_number, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []) as Profile[];
};

export const findProfileById = async (id: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, name, email, avatar_url, career, semester, phone_number, created_at')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // no rows found
    throw new Error(error.message);
  }

  return data as Profile;
};
