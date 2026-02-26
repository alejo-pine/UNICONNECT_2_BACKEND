import { findCompanerosByMateria } from '../repositories/studentRepository';
import { CompaneroResult, ServiceResult } from '../types/common';

export const getCompanerosByMateria = async (
  idMateria: string,
  idPerfilActual: string
): Promise<ServiceResult<CompaneroResult[]>> => {
  try {
    const data = await findCompanerosByMateria(idMateria, idPerfilActual);
    return { data, error: null, statusCode: 200 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al obtener compañeros';
    console.error('[studentService.getCompanerosByMateria]', message);
    return { data: null, error: 'Error al obtener los compañeros de la materia', statusCode: 500 };
  }
};
