import { Response } from 'express';
import { AuthenticatedRequest } from '../types/common';
import { getCompanerosByMateria } from '../services/studentService';

export const getCompaneros = async (
  req: AuthenticatedRequest & { params: { id_materia: string } },
  res: Response
): Promise<void> => {
  const { id_materia } = req.params;
  const idPerfilActual = req.user.id;

  const result = await getCompanerosByMateria(id_materia, idPerfilActual);

  if (result.error) {
    res.status(result.statusCode).json({ error: result.error, statusCode: result.statusCode });
    return;
  }

  res.status(200).json({ data: result.data });
};
