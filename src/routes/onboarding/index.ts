import { Router } from 'express';
import {
  completeOnboarding,
  getPrograms,
  getOnboardingStatus,
  saveOnboardingContact,
  saveOnboardingStepOne,
} from '../../controllers/onboardingController';
import { asyncHandler } from '../../utils/controller';

const router: Router = Router();

// GET /api/onboarding/status
router.get('/status', asyncHandler(getOnboardingStatus));

// GET /api/onboarding/programs?search=ingenieria&limit=20
router.get('/programs', asyncHandler(getPrograms));

// POST /api/onboarding/complete
router.post('/complete', asyncHandler(completeOnboarding));

// POST /api/onboarding/step-1
router.post('/step-1', asyncHandler(saveOnboardingStepOne));

// PATCH /api/onboarding/step-1/contact
router.patch('/step-1/contact', asyncHandler(saveOnboardingContact));

export default router;
