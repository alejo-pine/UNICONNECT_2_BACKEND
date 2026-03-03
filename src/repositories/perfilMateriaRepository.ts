import { supabase } from '../utils/supabaseClient';

const TABLE = 'perfil_materia';

export const findMateriasByPerfil = async (id_perfil: string) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id_materia, fecha_creacion')
    .eq('id_perfil', id_perfil);

  if (error) throw new Error(error.message);
  return data ?? [];
};

export const addMateriaToPerfil = async (id_perfil: string, id_materia: string) => {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([{ id_perfil, id_materia }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const removeMateriaFromPerfil = async (id_perfil: string, id_materia: string) => {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id_perfil', id_perfil)
    .eq('id_materia', id_materia);

  if (error) throw new Error(error.message);
  return true;
};

export const findMateriasInfoByPerfil = async (id_perfil: string) => {
  const { data, error } = await supabase
    .from('perfil_materia')
    .select(`
      id_materia,
      materia (
        id,
        nombre,
        codigo,
        programa,
        fecha_creacion
      )
    `)
    .eq('id_perfil', id_perfil);

  if (error) throw new Error(error.message);

  // Devuelve solo la información de la materia
  return (data ?? []).map((row: any) => row.materia);
};