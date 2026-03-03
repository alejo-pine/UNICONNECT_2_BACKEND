import { Request, Response } from 'express';
import * as service from '../services/perfilMateriaService';
import { getMateriasInfoByPerfil } from '../services/perfilMateriaService';

export const getMateriasByPerfil = async (req: Request<{ id_perfil: string }>, res: Response) => {
  const { id_perfil } = req.params;
  const result = await getMateriasInfoByPerfil(id_perfil);
  if (result.error) {
    res.status(result.statusCode).json({ error: result.error });
    return;
  }
  res.status(200).json({ data: result.data });
};

export const addMateriaToPerfilController = async (req: Request, res: Response) => {
  const { id_perfil, id_materia } = req.body;
  const result = await service.addMateria(id_perfil, id_materia);
  if (result.error) {
    res.status(result.statusCode).json({ error: result.error });
    return;
  }
  res.status(result.statusCode).json({ data: result.data });
};

export const removeMateriaFromPerfilController = async (req: Request, res: Response) => {
  const { id_perfil, id_materia } = req.body;
  const result = await service.removeMateria(id_perfil, id_materia);
  if (result.error) {
    res.status(result.statusCode).json({ error: result.error });
    return;
  }
  res.status(result.statusCode).json({ data: result.data });
};

export const addMateria = async (req: Request, res: Response) => {
  const { id_perfil, id_materia } = req.body;
  const result = await service.addMateria(id_perfil, id_materia);
  res.status(result.statusCode).json(result.error ? { error: result.error } : { data: result.data });
};

export const removeMateria = async (req: Request, res: Response) => {
  const { id_perfil, id_materia } = req.body;
  const result = await service.removeMateria(id_perfil, id_materia);
  res.status(result.statusCode).json(result.error ? { error: result.error } : { data: result.data });
};