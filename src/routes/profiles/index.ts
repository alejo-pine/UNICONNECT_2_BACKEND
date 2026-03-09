import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import {
	getProfiles,
	getProfileById,
	updateProfile,
	uploadAvatar,
} from '../../controllers/profilesController';

const router: Router = Router();

const avatarUpload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 8 * 1024 * 1024,
	},
});

const avatarUploadMiddleware = (req: Request, res: Response, next: NextFunction): void => {
	avatarUpload.fields([
		{ name: 'file', maxCount: 1 },
		{ name: 'avatar', maxCount: 1 },
		{ name: 'image', maxCount: 1 },
	])(req, res, (err: unknown): void => {
		if (!err) {
			next();
			return;
		}

		if (err instanceof multer.MulterError) {
			if (err.code === 'LIMIT_FILE_SIZE') {
				res.status(413).json({
					error: 'Archivo demasiado grande. Maximo permitido: 8MB',
					statusCode: 413,
				});
				return;
			}

			res.status(400).json({
				error: 'Error de carga multipart/form-data',
				statusCode: 400,
			});
			return;
		}

		next(err);
	});
};

// GET /api/profiles
router.get('/', getProfiles);

// GET /api/profiles/:id
router.get('/:id', getProfileById);

// PUT /api/profiles/:id
router.put('/:id', updateProfile);

// POST /api/profiles/:id/avatar
router.post('/:id/avatar', avatarUploadMiddleware, uploadAvatar);

// PUT /api/profiles/:id/avatar (compatibilidad con frontend actual)
router.put('/:id/avatar', avatarUploadMiddleware, uploadAvatar);

// PATCH /api/profiles/:id/avatar (compatibilidad adicional)
router.patch('/:id/avatar', avatarUploadMiddleware, uploadAvatar);

// POST /api/profiles/:id/photo (compatibilidad con frontend)
router.post('/:id/photo', avatarUploadMiddleware, uploadAvatar);

// PUT /api/profiles/:id/photo (compatibilidad con frontend)
router.put('/:id/photo', avatarUploadMiddleware, uploadAvatar);

// PATCH /api/profiles/:id/photo (compatibilidad con frontend)
router.patch('/:id/photo', avatarUploadMiddleware, uploadAvatar);

// POST /api/profiles/avatar/:id (compatibilidad con frontend)
router.post('/avatar/:id', avatarUploadMiddleware, uploadAvatar);

// PUT /api/profiles/avatar/:id (compatibilidad con frontend)
router.put('/avatar/:id', avatarUploadMiddleware, uploadAvatar);

// PATCH /api/profiles/avatar/:id (compatibilidad con frontend)
router.patch('/avatar/:id', avatarUploadMiddleware, uploadAvatar);

// POST /api/profiles/photo/:id (compatibilidad con frontend)
router.post('/photo/:id', avatarUploadMiddleware, uploadAvatar);

// PUT /api/profiles/photo/:id (compatibilidad con frontend)
router.put('/photo/:id', avatarUploadMiddleware, uploadAvatar);

// PATCH /api/profiles/photo/:id (compatibilidad con frontend)
router.patch('/photo/:id', avatarUploadMiddleware, uploadAvatar);

export default router;
