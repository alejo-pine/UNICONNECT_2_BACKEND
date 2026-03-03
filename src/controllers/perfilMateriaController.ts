import { Request, Response } from 'express';
import * as service from '../services/perfilMateriaService';
import { getMateriasInfoByPerfil } from '../services/perfilMateriaService';


export const getMateriasByPerfil = async (req: Request<{ profile_id: string }>, res: Response) => {
  const { profile_id } = req.params;
  const result = await getMateriasInfoByPerfil(profile_id);
  if (result.error) {
    res.status(result.statusCode).json({ error: result.error });
    return;
  }
  res.status(200).json({ data: result.data });
};


export const addMateriaToPerfilController = async (req: Request, res: Response) => {
  const { profile_id, subject_id } = req.body;
  const result = await service.addMateria(profile_id, subject_id);
  if (result.error) {
    res.status(result.statusCode).json({ error: result.error });
    return;
  }
  res.status(result.statusCode).json({ data: result.data });
};


export const removeMateriaFromPerfilController = async (req: Request, res: Response) => {
  const { profile_id, subject_id } = req.body;
  const result = await service.removeMateria(profile_id, subject_id);
  if (result.error) {
    res.status(result.statusCode).json({ error: result.error });
    return;
  }
  res.status(result.statusCode).json({ data: result.data });
};


// Métodos antiguos eliminados porque ya no corresponden a la nueva estructura