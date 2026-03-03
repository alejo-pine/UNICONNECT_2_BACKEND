import { Router } from 'express';
import { getSubjects, getSubjectById } from '../../controllers/subjectController';

const router: Router = Router();

// GET /api/subjects?search=keyword&limit=20
router.get('/', getSubjects);

// GET /api/subjects/:id
router.get('/:id', getSubjectById);

export default router;
