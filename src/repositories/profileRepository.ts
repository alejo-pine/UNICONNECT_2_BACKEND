import { supabase } from '../utils/supabaseClient';
import { Profile } from '../types/common';

const TABLE = 'perfil';

export const findAllProfiles = async (): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id_perfil, carrera, semestre, celular, fecha_creacion')
    .order('fecha_creacion', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []) as Profile[];
};

export const findProfileById = async (id: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id_perfil, carrera, semestre, celular, fecha_creacion')
    .eq('id_perfil', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // no rows found
    throw new Error(error.message);
  }

  return data as Profile;
};

export const updateProfileById = async (id: string, updates: Partial<Profile>): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq('id_perfil', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Profile;
};