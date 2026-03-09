import { Router } from 'express';
import { getSubjects, getSubjectById } from '../../controllers/subjectController';
import { asyncHandler } from '../../utils/controller';

const router: Router = Router();

// GET /api/subjects?search=keyword&limit=20
router.get('/', asyncHandler(getSubjects));

// GET /api/subjects/:id
router.get('/:id', asyncHandler(getSubjectById));

export default router;
