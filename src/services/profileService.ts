import { findAllProfiles, findProfileById } from '../repositories/profileRepository';
import { Profile, ServiceResult } from '../types/common';

export const getAllProfiles = async (): Promise<ServiceResult<Profile[]>> => {
  try {
    const data = await findAllProfiles();
    return { data, error: null, statusCode: 200 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al obtener perfiles';
    console.error('[profileService.getAllProfiles]', message);
    return { data: null, error: 'Error al obtener los perfiles', statusCode: 500 };
  }
};

export const getProfileById = async (id: string): Promise<ServiceResult<Profile>> => {
  try {
    const data = await findProfileById(id);
    if (!data) {
      return { data: null, error: 'Perfil no encontrado', statusCode: 404 };
    }
    return { data, error: null, statusCode: 200 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al obtener perfil';
    console.error('[profileService.getProfileById]', message);
    return { data: null, error: 'Error al obtener el perfil', statusCode: 500 };
  }
};
