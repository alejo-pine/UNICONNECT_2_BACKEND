import { supabase } from '../utils/supabaseClient';
import { Materia } from '../types/common';

const TABLE = 'materia';

export const findAllMaterias = async (): Promise<Materia[]> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, nombre, codigo, programa, fecha_creacion')
    .order('nombre', { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []) as Materia[];
};

export const findMateriaById = async (id: string): Promise<Materia | null> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, nombre, codigo, programa, fecha_creacion')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // no rows found
    throw new Error(error.message);
  }

  return data as Materia;
};
