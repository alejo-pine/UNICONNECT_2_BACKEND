import { Request, Response } from 'express';
import * as service from '../services/profileSubjectsService';
import { getSubjectsInfoByProfile } from '../services/profileSubjectsService';


export const getSubjectsByProfile = async (req: Request<{ profile_id: string }>, res: Response) => {
  const { profile_id } = req.params;
  const result = await getSubjectsInfoByProfile(profile_id);
  if (result.error) {
    res.status(result.statusCode).json({ error: result.error });
    return;
  }
  res.status(200).json({ data: result.data });
};


export const addSubjectToProfileController = async (req: Request, res: Response) => {
  const { profile_id, subject_id } = req.body;
  const result = await service.addSubject(profile_id, subject_id);
  if (result.error) {
    res.status(result.statusCode).json({ error: result.error });
    return;
  }
  res.status(result.statusCode).json({ data: result.data });
};


export const removeSubjectFromProfileController = async (req: Request, res: Response) => {
  const { profile_id, subject_id } = req.body;
  const result = await service.removeSubject(profile_id, subject_id);
  if (result.error) {
    res.status(result.statusCode).json({ error: result.error });
    return;
  }
  res.status(result.statusCode).json({ data: result.data });
};
