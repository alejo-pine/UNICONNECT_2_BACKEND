import { Request, Response } from 'express';
import {
  getAllProfiles,
  getProfileById as fetchProfileById,
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
