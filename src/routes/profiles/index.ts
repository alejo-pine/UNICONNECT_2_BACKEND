import { Router } from 'express';
import { getProfiles, getProfileById } from '../../controllers/profilesController';

const router: Router = Router();

// GET /api/profiles
router.get('/', getProfiles);

// GET /api/profiles/:id
router.get('/:id', getProfileById);

export default router;
