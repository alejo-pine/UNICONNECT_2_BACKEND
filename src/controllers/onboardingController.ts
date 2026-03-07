import { Request, Response } from 'express';
import {
  completeOnboardingByProfileId,
  getOnboardingStatusByProfileId,
} from '../services/onboardingService';
import { AuthenticatedRequest } from '../types/common';

interface CompleteOnboardingBody {
  skipped?: boolean;
}

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
