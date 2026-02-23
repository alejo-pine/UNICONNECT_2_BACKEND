import { Request, Response } from 'express';
import {
  getAllMaterias,
  getMateriaById as fetchMateriaById,
} from '../services/materiaService';

export const getMaterias = async (req: Request, res: Response): Promise<void> => {
  const result = await getAllMaterias();

  if (result.error) {
    res.status(result.statusCode).json({ error: result.error, statusCode: result.statusCode });
    return;
  }

  res.status(200).json({ data: result.data });
};

export const getMateriaById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;

  const result = await fetchMateriaById(id);

  if (result.error) {
    res.status(result.statusCode).json({ error: result.error, statusCode: result.statusCode });
    return;
  }

  res.status(200).json({ data: result.data });
};
