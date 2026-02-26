import { supabase } from '../utils/supabaseClient';
import { CompaneroResult } from '../types/common';

const TABLE = 'perfil_materia';

export const findCompanerosByMateria = async (
  idMateria: string,
  idPerfilActual: string
): Promise<CompaneroResult[]> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id_perfil')
    .eq('id_materia', idMateria)
    .neq('id_perfil', idPerfilActual);

  if (error) throw new Error(error.message);

  return (data ?? []) as CompaneroResult[];
};
