import { Router } from 'express';
import { getSubjectsByProfile, addSubjectToProfileController, removeSubjectFromProfileController } from '../../controllers/profileSubjectsController';

const router = Router();


router.get('/:profile_id', getSubjectsByProfile);

router.post('/', addSubjectToProfileController);
router.delete('/', removeSubjectFromProfileController);

export default router;
