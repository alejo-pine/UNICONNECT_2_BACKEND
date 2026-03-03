
import { Router } from 'express';
import { getMateriasByPerfil, addMateriaToPerfilController, removeMateriaFromPerfilController } from '../../controllers/perfilMateriaController';

const router = Router();


router.get('/:profile_id', getMateriasByPerfil);

router.post('/', addMateriaToPerfilController);
router.delete('/', removeMateriaFromPerfilController);

export default router;