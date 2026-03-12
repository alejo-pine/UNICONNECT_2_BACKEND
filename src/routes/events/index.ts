import { Router } from 'express';
import { getEvents, getEventById } from '../../controllers/eventController';
import { asyncHandler } from '../../utils/controller';

const router: Router = Router();

// GET /api/events?limit=20
router.get('/', asyncHandler(getEvents));

// GET /api/events/:id
router.get('/:id', asyncHandler(getEventById));

export default router;
