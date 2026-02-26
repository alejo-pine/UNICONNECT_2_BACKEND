import { Router } from 'express';
import { getProfiles, getProfileById, updateProfile } from '../../controllers/profilesController';

const router: Router = Router();

// GET /api/profiles
router.get('/', getProfiles);

// GET /api/profiles/:id
router.get('/:id', getProfileById);

// PUT /api/profiles/:id
router.put('/:id', updateProfile);

export default router;
