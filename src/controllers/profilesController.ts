import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/common';
import {
  getAllProfiles,
  getProfileById as fetchProfileById,
  uploadAvatarForProfile,
  updateProfile as updateProfileService,
} from '../services/profileService';
import { sendServiceResult } from '../utils/controller';

export const getProfiles = async (_req: Request, res: Response): Promise<void> => {
  const result = await getAllProfiles();
  sendServiceResult(res, result, 200);
};

export const getProfileById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;

  const result = await fetchProfileById(id);
  sendServiceResult(res, result, 200);
};

export const updateProfile = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;
  const profileData = req.body; // Aquí llegan los datos desde el frontend

  const result = await updateProfileService(id, profileData);
  sendServiceResult(res, result, 200);
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
    sendServiceResult(res, result);
    return;
  }

  res.status(200).json({ success: true, data: result.data });
};
