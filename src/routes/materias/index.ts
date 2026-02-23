import { Router } from 'express';
import { getMaterias, getMateriaById } from '../../controllers/materiasController';

const router: Router = Router();

// GET /api/materias
router.get('/', getMaterias);

// GET /api/materias/:id
router.get('/:id', getMateriaById);

export default router;
