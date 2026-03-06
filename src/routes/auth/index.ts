import { Request, Response, Router } from 'express';
import { syncAuthProfile } from '../../controllers/authController';

const router: Router = Router();

const requireJsonContentType = (
	req: Request,
	res: Response,
	next: (error?: unknown) => void
): void => {
	if (!req.is('application/json')) {
		res.status(415).json({
			error: 'Content-Type debe ser application/json',
			statusCode: 415,
		});
		return;
	}
	next();
};

router.get('/status', (req: Request, res: Response): void => {
	res.status(200).json({
		message: 'Autenticación manejada por Supabase',
	});
});

router.post('/sync', requireJsonContentType, syncAuthProfile);

export default router;
