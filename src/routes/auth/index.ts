import { Request, Response, Router } from 'express';
import { syncAuthProfile } from '../../controllers/authController';
import { requireAuth0Jwt } from '../../middlewares/auth0Jwt';
import { asyncHandler } from '../../utils/controller';
import { HttpError } from '../../utils/httpError';

const router: Router = Router();

const requireJsonContentType = (
	req: Request,
	res: Response,
	next: (error?: unknown) => void
): void => {
	if (!req.is('application/json')) {
		next(new HttpError(415, 'Content-Type debe ser application/json'));
		return;
	}
	next();
};

router.get('/status', (req: Request, res: Response): void => {
	res.status(200).json({
		message: 'Autenticación manejada por Supabase',
	});
});

router.post('/sync', requireJsonContentType, requireAuth0Jwt, asyncHandler(syncAuthProfile));

export default router;
