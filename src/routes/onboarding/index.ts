import { Router } from 'express';
import {
  completeOnboarding,
  getOnboardingStatus,
} from '../../controllers/onboardingController';

const router: Router = Router();

// GET /api/onboarding/status
router.get('/status', getOnboardingStatus);

// POST /api/onboarding/complete
router.post('/complete', completeOnboarding);

export default router;
