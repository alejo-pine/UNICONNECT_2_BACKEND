import * as repo from '../repositories/perfilMateriaRepository';
import { findMateriasInfoByPerfil } from '../repositories/perfilMateriaRepository';

export const getMateriasByPerfil = async (id_perfil: string) => {
  try {
    const data = await repo.findMateriasByPerfil(id_perfil);
    return { data, error: null, statusCode: 200 };
  } catch (err: any) {
    return { data: null, error: err.message, statusCode: 500 };
  }
};

export const addMateria = async (id_perfil: string, id_materia: string) => {
  try {
    const data = await repo.addMateriaToPerfil(id_perfil, id_materia);
    return { data, error: null, statusCode: 201 };
  } catch (err: any) {
    return { data: null, error: err.message, statusCode: 500 };
  }
};

export const removeMateria = async (id_perfil: string, id_materia: string) => {
  try {
    await repo.removeMateriaFromPerfil(id_perfil, id_materia);
    return { data: true, error: null, statusCode: 200 };
  } catch (err: any) {
    return { data: null, error: err.message, statusCode: 500 };
  }
};

export const getMateriasInfoByPerfil = async (id_perfil: string) => {
  try {
    const materias = await findMateriasInfoByPerfil(id_perfil);
    return { data: materias, error: null, statusCode: 200 };
  } catch (err: any) {
    return { data: null, error: err.message, statusCode: 500 };
  }
};