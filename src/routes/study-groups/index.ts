import { Router } from 'express';
import { createStudyGroup, getMyStudyGroups, getAllStudyGroups } from '../../controllers/studyGroupController';
import { asyncHandler } from '../../utils/controller';
import authMiddleware from '../../middlewares/auth';
import { AuthenticatedRequest } from '../../types/common';

const router: Router = Router();

// GET /api/study-groups
// Returns all public study groups (discovery/browsing)
// Optional query: ?limit=50
router.get(
  '/',
  asyncHandler((req, res) => getAllStudyGroups(req as AuthenticatedRequest, res))
);

// GET /api/study-groups/my-groups
// Returns study groups for the authenticated user
router.get(
  '/my-groups',
  authMiddleware,
  asyncHandler((req, res) => getMyStudyGroups(req as AuthenticatedRequest, res))
);

// POST /api/study-groups
// Creates a new study group (requires authentication)
router.post(
  '/',
  authMiddleware,
  asyncHandler((req, res) => createStudyGroup(req as AuthenticatedRequest, res))
);

export default router;
