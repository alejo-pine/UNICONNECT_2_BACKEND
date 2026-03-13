import { Router } from 'express';
import { getSubjects, getSubjectById, getMySubjects } from '../../controllers/subjectController';
import { asyncHandler } from '../../utils/controller';
import authMiddleware from '../../middlewares/auth';
import { AuthenticatedRequest } from '../../types/common';

const router: Router = Router();

// GET /api/subjects?search=keyword&limit=20
router.get('/', asyncHandler(getSubjects));

// GET /api/subjects/my-subjects
// Returns subjects enrolled by the authenticated user
router.get('/my-subjects', authMiddleware, asyncHandler((req, res) => 
  getMySubjects(req as AuthenticatedRequest, res)
));

// GET /api/subjects/:id
router.get('/:id', asyncHandler(getSubjectById));

export default router;
