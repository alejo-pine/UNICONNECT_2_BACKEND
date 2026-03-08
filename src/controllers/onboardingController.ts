import { Request, Response } from 'express';
import {
  completeOnboardingByProfileId,
  getOnboardingPrograms,
  getOnboardingStatusByProfileId,
  saveOnboardingContactByProfileId,
  saveOnboardingStepOneByProfileId,
} from '../services/onboardingService';
import { AuthenticatedRequest } from '../types/common';

interface CompleteOnboardingBody {
  skipped?: boolean;
}

interface SaveOnboardingStepOneBody {
  career?: unknown;
  semester?: unknown;
  phone_number?: unknown;
  phoneNumber?: unknown;
}

interface SaveOnboardingContactBody {
  phone_number?: unknown;
  phoneNumber?: unknown;
}

interface OnboardingProgramsQuery {
  search?: string;
  limit?: string;
}

interface StepOneValidationErrors {
  career?: string;
  semester?: string;
  phone_number?: string;
}

const parseContactBody = (
  body: SaveOnboardingContactBody
): { phoneNumber: string } | null => {
  const rawPhoneCandidate =
    typeof body.phone_number === 'string'
      ? body.phone_number
      : typeof body.phoneNumber === 'string'
        ? body.phoneNumber
        : '';

  const rawPhone = rawPhoneCandidate.trim();

  if (!rawPhone) {
    return null;
  }

  return { phoneNumber: rawPhone };
};

export const getOnboardingStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const profileId = (req as AuthenticatedRequest).user.id;

  const result = await getOnboardingStatusByProfileId(profileId);

  if (result.error) {
    res.status(result.statusCode).json({
      error: result.error,
      statusCode: result.statusCode,
    });
    return;
  }

  res.status(200).json({ data: result.data });
};

export const getPrograms = async (
  req: Request<unknown, unknown, unknown, OnboardingProgramsQuery>,
  res: Response
): Promise<void> => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const limitRaw = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 20;
  const limit = Number.isInteger(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 20;

  const result = await getOnboardingPrograms(search || undefined, limit);

  if (result.error) {
    res.status(result.statusCode).json({
      error: result.error,
      statusCode: result.statusCode,
    });
    return;
  }

  const isEmpty = (result.data ?? []).length === 0;

  res.status(200).json({
    data: result.data,
    message: isEmpty
      ? 'No existen programas academicos para la busqueda realizada.'
      : undefined,
  });
};

export const completeOnboarding = async (
  req: Request<unknown, unknown, CompleteOnboardingBody>,
  res: Response
): Promise<void> => {
  const profileId = (req as AuthenticatedRequest).user.id;
  const skipped = req.body?.skipped === true;

  const result = await completeOnboardingByProfileId(profileId, skipped);

  if (result.error) {
    res.status(result.statusCode).json({
      error: result.error,
      statusCode: result.statusCode,
    });
    return;
  }

  res.status(200).json({ data: result.data });
};

export const saveOnboardingStepOne = async (
  req: Request<unknown, unknown, SaveOnboardingStepOneBody>,
  res: Response
): Promise<void> => {
  const profileId = (req as AuthenticatedRequest).user.id;
  const validationErrors: StepOneValidationErrors = {};

  const rawCareer = typeof req.body?.career === 'string' ? req.body.career.trim() : '';
  const rawSemester =
    typeof req.body?.semester === 'number' || typeof req.body?.semester === 'string'
      ? Number(req.body.semester)
      : NaN;
  const rawPhoneCandidate =
    typeof req.body?.phone_number === 'string'
      ? req.body.phone_number
      : typeof req.body?.phoneNumber === 'string'
        ? req.body.phoneNumber
        : '';
  const rawPhone = rawPhoneCandidate.trim();

  if (!rawCareer) {
    validationErrors.career = 'La carrera es obligatoria';
  }

  if (!Number.isInteger(rawSemester) || rawSemester < 1 || rawSemester > 10) {
    validationErrors.semester = 'El semestre debe ser un numero entero entre 1 y 10';
  }

  if (!rawPhone) {
    validationErrors.phone_number = 'El contacto es obligatorio';
  }

  if (Object.keys(validationErrors).length > 0) {
    res.status(400).json({
      error: 'Debes completar los campos obligatorios del paso 1.',
      statusCode: 400,
      validationErrors,
    });
    return;
  }

  const result = await saveOnboardingStepOneByProfileId(profileId, {
    career: rawCareer,
    semester: rawSemester,
    phoneNumber: rawPhone,
  });

  if (result.error) {
    res.status(result.statusCode).json({
      error: result.error,
      statusCode: result.statusCode,
    });
    return;
  }

  res.status(200).json({ data: result.data });
};

export const saveOnboardingContact = async (
  req: Request<unknown, unknown, SaveOnboardingContactBody>,
  res: Response
): Promise<void> => {
  const profileId = (req as AuthenticatedRequest).user.id;
  const parsedBody = parseContactBody(req.body ?? {});

  if (!parsedBody) {
    res.status(400).json({
      error: 'El contacto es obligatorio',
      statusCode: 400,
      validationErrors: {
        phone_number: 'El contacto es obligatorio',
      },
    });
    return;
  }

  const result = await saveOnboardingContactByProfileId(profileId, {
    phoneNumber: parsedBody.phoneNumber,
  });

  if (result.error) {
    res.status(result.statusCode).json({
      error: result.error,
      statusCode: result.statusCode,
    });
    return;
  }

  res.status(200).json({ data: result.data });
};
