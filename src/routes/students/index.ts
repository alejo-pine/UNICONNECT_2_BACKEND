import { Router } from 'express';
import { getClassmates } from '../../controllers/studentController';
import { asyncHandler } from '../../utils/controller';

const router: Router = Router();

// GET /api/students/classmates/:subjectId
router.get('/classmates/:subjectId', asyncHandler(getClassmates));

export default router;
