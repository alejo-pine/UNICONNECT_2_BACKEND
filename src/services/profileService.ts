import { findAllProfiles, findProfileById, updateProfileById } from '../repositories/profileRepository';
import { Profile, ServiceResult } from '../types/common';

export const getAllProfiles = async (): Promise<ServiceResult<Profile[]>> => {
  try {
    const data = await findAllProfiles();
    return { data, error: null, statusCode: 200 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching profiles';
    console.error('[profileService.getAllProfiles]', message);
    return { data: null, error: 'Error fetching profiles', statusCode: 500 };
  }
};

export const getProfileById = async (id: string): Promise<ServiceResult<Profile>> => {
  try {
    const data = await findProfileById(id);
    if (!data) {
      return { data: null, error: 'Profile not found', statusCode: 404 };
    }
    return { data, error: null, statusCode: 200 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching profile';
    console.error('[profileService.getProfileById]', message);
    return { data: null, error: 'Error fetching profile', statusCode: 500 };
  }
};

export const updateProfile = async (id: string, profileData: Partial<Profile>): Promise<ServiceResult<Profile>> => {
  try {
    // 1. Extraemos los campos sensibles que NO deben enviarse en el UPDATE de Supabase
    // para evitar errores de integridad o de "column not found"
    const { id_perfil, fecha_creacion, ...dataToUpdate } = profileData as any;

    // 2. Llamamos al repositorio para ejecutar la actualización
    const updatedData = await updateProfileById(id, dataToUpdate);
    
    // 3. Verificamos si se encontró y actualizó el registro
    if (!updatedData) {
      return { 
        data: null, 
        error: 'No se encontró el perfil para actualizar', 
        statusCode: 404 
      };
    }

    // 4. Retornamos el perfil actualizado con éxito
    return { 
      data: updatedData, 
      error: null, 
      statusCode: 200 
    };

  } catch (err: unknown) {
    // 5. Gestión de errores detallada
    const message = err instanceof Error ? err.message : 'Error desconocido al actualizar';
    console.error(`[profileService.updateProfile] ID: ${id} | Error:`, message);

    return { 
      data: null, 
      error: 'Error interno del servidor al intentar actualizar el perfil', 
      statusCode: 500 
    };
  }
};
