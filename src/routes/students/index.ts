import { Router } from 'express';
import { getCompaneros } from '../../controllers/studentController';

const router: Router = Router();

// GET /api/students/companeros/:id_materia
router.get('/companeros/:id_materia', getCompaneros);

export default router;
