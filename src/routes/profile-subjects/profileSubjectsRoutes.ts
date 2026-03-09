import { Router } from 'express';
import { getSubjectsByProfile, addSubjectToProfileController, removeSubjectFromProfileController } from '../../controllers/profileSubjectsController';
import { asyncHandler } from '../../utils/controller';

const router = Router();


router.get('/:profile_id', asyncHandler(getSubjectsByProfile));

router.post('/', asyncHandler(addSubjectToProfileController));
router.delete('/', asyncHandler(removeSubjectFromProfileController));

export default router;
