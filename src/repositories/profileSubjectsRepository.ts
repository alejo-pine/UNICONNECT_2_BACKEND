import { supabase } from '../utils/supabaseClient';

const TABLE = 'profile_subject';


export const findSubjectsByProfile = async (profile_id: string) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('subject_id, created_at')
    .eq('profile_id', profile_id);

  if (error) throw new Error(error.message);
  return data ?? [];
};


export const addSubjectToProfile = async (profile_id: string, subject_id: string) => {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([{ profile_id, subject_id }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};


export const removeSubjectFromProfile = async (profile_id: string, subject_id: string) => {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('profile_id', profile_id)
    .eq('subject_id', subject_id);

  if (error) throw new Error(error.message);
  return true;
};


export const findSubjectsInfoByProfile = async (profile_id: string) => {
  const { data, error } = await supabase
    .from('profile_subject')
    .select(`
      subject_id,
      subject (
        id,
        name,
        code,
        program,
        created_at
      )
    `)
    .eq('profile_id', profile_id);

  if (error) throw new Error(error.message);

  // Devuelve solo la información de la materia
  return (data ?? []).map((row: any) => row.subject);
};
