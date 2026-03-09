import {
  findAllProfiles,
  findProfileById,
  updateProfileAvatarUrl,
  updateProfileById,
  uploadProfileAvatar,
} from '../repositories/profileRepository';
import { Profile, ServiceResult } from '../types/common';

const ALLOWED_AVATAR_MIME_TYPES = new Set<string>([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export interface UploadAvatarInput {
  readonly buffer: Buffer;
  readonly mimeType: string;
}

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
    // Exclude immutable field from UPDATE payload.
    const { created_at, ...dataToUpdate }: Partial<Profile> = profileData;

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

export const uploadAvatarForProfile = async (
  profileId: string,
  authenticatedProfileId: string,
  file: UploadAvatarInput
): Promise<ServiceResult<{ url: string }>> => {
  try {
    if (profileId !== authenticatedProfileId) {
      return {
        data: null,
        error: 'No autorizado para actualizar este avatar',
        statusCode: 403,
      };
    }

    const normalizedMimeType = file.mimeType.toLowerCase();
    if (!ALLOWED_AVATAR_MIME_TYPES.has(normalizedMimeType)) {
      return {
        data: null,
        error: 'Formato de imagen no soportado',
        statusCode: 400,
      };
    }

    const profile = await findProfileById(profileId);
    if (!profile) {
      return {
        data: null,
        error: 'Profile not found',
        statusCode: 404,
      };
    }

    const publicUrl = await uploadProfileAvatar(profileId, file.buffer, normalizedMimeType);
    await updateProfileAvatarUrl(profileId, publicUrl);

    return {
      data: { url: publicUrl },
      error: null,
      statusCode: 200,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error uploading avatar';
    console.error(`[profileService.uploadAvatarForProfile] ID: ${profileId} | Error:`, message);

    return {
      data: null,
      error: 'Error interno del servidor al subir avatar',
      statusCode: 500,
    };
  }
};
