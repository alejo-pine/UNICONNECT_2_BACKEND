import { findAllMaterias, findMateriaById } from '../repositories/materiaRepository';
import { Materia, ServiceResult } from '../types/common';

export const getAllMaterias = async (): Promise<ServiceResult<Materia[]>> => {
  try {
    const data = await findAllMaterias();
    return { data, error: null, statusCode: 200 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al obtener materias';
    console.error('[materiaService.getAllMaterias]', message);
    return { data: null, error: 'Error al obtener las materias', statusCode: 500 };
  }
};

export const getMateriaById = async (id: string): Promise<ServiceResult<Materia>> => {
  try {
    const data = await findMateriaById(id);
    if (!data) {
      return { data: null, error: 'Materia no encontrada', statusCode: 404 };
    }
    return { data, error: null, statusCode: 200 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al obtener materia';
    console.error('[materiaService.getMateriaById]', message);
    return { data: null, error: 'Error al obtener la materia', statusCode: 500 };
  }
};
