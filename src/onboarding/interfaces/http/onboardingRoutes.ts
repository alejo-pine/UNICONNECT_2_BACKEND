import { Router } from 'express';
import { asyncHandler } from '../../../utils/controller';
import {
  completeOnboarding,
  getOnboardingStatus,
  getPrograms,
  saveOnboardingContact,
  saveOnboardingStepOne,
} from './onboardingController';

const router: Router = Router();

router.get('/status', asyncHandler(getOnboardingStatus));
router.get('/programs', asyncHandler(getPrograms));
router.post('/complete', asyncHandler(completeOnboarding));
router.post('/step-1', asyncHandler(saveOnboardingStepOne));
router.patch('/step-1/contact', asyncHandler(saveOnboardingContact));

export default router;
