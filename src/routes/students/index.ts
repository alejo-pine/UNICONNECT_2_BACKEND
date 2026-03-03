import { Router } from 'express';
import { getClassmates } from '../../controllers/studentController';

const router: Router = Router();

// GET /api/students/classmates/:subjectId
router.get('/classmates/:subjectId', getClassmates);

export default router;
