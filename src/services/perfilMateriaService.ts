import * as repo from '../repositories/perfilMateriaRepository';
import { findMateriasInfoByPerfil } from '../repositories/perfilMateriaRepository';


export const getMateriasByPerfil = async (profile_id: string) => {
  try {
    const data = await repo.findMateriasByPerfil(profile_id);
    return { data, error: null, statusCode: 200 };
  } catch (err: any) {
    return { data: null, error: err.message, statusCode: 500 };
  }
};


export const addMateria = async (profile_id: string, subject_id: string) => {
  try {
    const data = await repo.addMateriaToPerfil(profile_id, subject_id);
    return { data, error: null, statusCode: 201 };
  } catch (err: any) {
    return { data: null, error: err.message, statusCode: 500 };
  }
};


export const removeMateria = async (profile_id: string, subject_id: string) => {
  try {
    await repo.removeMateriaFromPerfil(profile_id, subject_id);
    return { data: true, error: null, statusCode: 200 };
  } catch (err: any) {
    return { data: null, error: err.message, statusCode: 500 };
  }
};


export const getMateriasInfoByPerfil = async (profile_id: string) => {
  try {
    const materias = await findMateriasInfoByPerfil(profile_id);
    return { data: materias, error: null, statusCode: 200 };
  } catch (err: any) {
    return { data: null, error: err.message, statusCode: 500 };
  }
};