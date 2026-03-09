import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/common';
import {
  getAllProfiles,
  getProfileById as fetchProfileById,
  uploadAvatarForProfile,
  updateProfile as updateProfileService, // <--- Añadir esta
} from '../services/profileService';

export const getProfiles = async (req: Request, res: Response): Promise<void> => {
  const result = await getAllProfiles();

  if (result.error) {
    res.status(result.statusCode).json({ error: result.error, statusCode: result.statusCode });
    return;
  }

  res.status(200).json({ data: result.data });
};

export const getProfileById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;

  const result = await fetchProfileById(id);

  if (result.error) {
    res.status(result.statusCode).json({ error: result.error, statusCode: result.statusCode });
    return;
  }

  res.status(200).json({ data: result.data });
};

export const updateProfile = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;
  const profileData = req.body; // Aquí llegan los datos desde el frontend

  const result = await updateProfileService(id, profileData);

  if (result.error) {
    res.status(result.statusCode).json({ error: result.error, statusCode: result.statusCode });
    return;
  }

  res.status(200).json({ data: result.data });
};

type AvatarFilesPayload = {
  [key: string]: Express.Multer.File[];
};

export const uploadAvatar = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;
  const authenticatedProfileId = (req as unknown as AuthenticatedRequest).user?.id;

  const files = req.files as AvatarFilesPayload | undefined;
  const selectedFile = files?.file?.[0] ?? files?.avatar?.[0] ?? files?.image?.[0];

  if (!selectedFile) {
    res.status(400).json({
      error: 'Archivo requerido en multipart/form-data (file/avatar/image)',
      statusCode: 400,
    });
    return;
  }

  if (!authenticatedProfileId) {
    res.status(401).json({ error: 'Token de autenticacion requerido', statusCode: 401 });
    return;
  }

  const result = await uploadAvatarForProfile(id, authenticatedProfileId, {
    buffer: selectedFile.buffer,
    mimeType: selectedFile.mimetype,
  });

  if (result.error) {
    res.status(result.statusCode).json({ error: result.error, statusCode: result.statusCode });
    return;
  }

  res.status(200).json({ success: true, data: result.data });
};
