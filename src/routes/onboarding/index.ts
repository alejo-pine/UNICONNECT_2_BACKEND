import { Router } from 'express';
import {
  completeOnboarding,
  getPrograms,
  getOnboardingStatus,
  saveOnboardingContact,
  saveOnboardingStepOne,
} from '../../controllers/onboardingController';

const router: Router = Router();

// GET /api/onboarding/status
router.get('/status', getOnboardingStatus);

// GET /api/onboarding/programs?search=ingenieria&limit=20
router.get('/programs', getPrograms);

// POST /api/onboarding/complete
router.post('/complete', completeOnboarding);

// POST /api/onboarding/step-1
router.post('/step-1', saveOnboardingStepOne);

// PATCH /api/onboarding/step-1/contact
router.patch('/step-1/contact', saveOnboardingContact);

export default router;
