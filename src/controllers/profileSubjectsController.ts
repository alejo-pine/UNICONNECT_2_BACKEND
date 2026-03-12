import { Request, Response } from 'express';
import * as service from '../services/profileSubjectsService';
import { getSubjectsInfoByProfile } from '../services/profileSubjectsService';
import { sendServiceResult } from '../utils/controller';
import { HttpError } from '../utils/httpError';

interface ProfileSubjectBody {
  profile_id?: unknown;
  subject_id?: unknown;
}

const parseNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};


export const getSubjectsByProfile = async (req: Request<{ profile_id: string }>, res: Response) => {
  const profile_id = parseNonEmptyString(req.params.profile_id);

  if (!profile_id) {
    throw new HttpError(400, 'profile_id es obligatorio');
  }

  const result = await getSubjectsInfoByProfile(profile_id);
  sendServiceResult(res, result, 200);
};


export const addSubjectToProfileController = async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as ProfileSubjectBody;
  const profile_id = parseNonEmptyString(body.profile_id);
  const subject_id = parseNonEmptyString(body.subject_id);

  if (!profile_id || !subject_id) {
    throw new HttpError(400, 'profile_id y subject_id son obligatorios');
  }

  const result = await service.addSubject(profile_id, subject_id);
  sendServiceResult(res, result);
};


export const removeSubjectFromProfileController = async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as ProfileSubjectBody;
  const profile_id = parseNonEmptyString(body.profile_id);
  const subject_id = parseNonEmptyString(body.subject_id);

  if (!profile_id || !subject_id) {
    throw new HttpError(400, 'profile_id y subject_id son obligatorios');
  }

  const result = await service.removeSubject(profile_id, subject_id);
  sendServiceResult(res, result);
};
