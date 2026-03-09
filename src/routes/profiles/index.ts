import { NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import {
	getProfiles,
	getProfileById,
	updateProfile,
	uploadAvatar,
} from '../../controllers/profilesController';
import { asyncHandler } from '../../utils/controller';

const router: Router = Router();

const avatarUpload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 8 * 1024 * 1024,
	},
});

const runAvatarUpload = (req: Request, res: Response): Promise<void> =>
	new Promise((resolve, reject) => {
		avatarUpload.fields([
			{ name: 'file', maxCount: 1 },
			{ name: 'avatar', maxCount: 1 },
			{ name: 'image', maxCount: 1 },
		])(req, res, (err: unknown): void => {
			if (err) {
				reject(err);
				return;
			}

			resolve();
		});
	});

const avatarUploadMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		await runAvatarUpload(req, res);
		next();
	} catch (err: unknown) {
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
	}
};

// GET /api/profiles
router.get('/', asyncHandler(getProfiles));

// GET /api/profiles/:id
router.get('/:id', asyncHandler(getProfileById));

// PUT /api/profiles/:id
router.put('/:id', asyncHandler(updateProfile));

// POST /api/profiles/:id/avatar
router.post('/:id/avatar', avatarUploadMiddleware, asyncHandler(uploadAvatar));

// PUT /api/profiles/:id/avatar (compatibilidad con frontend actual)
router.put('/:id/avatar', avatarUploadMiddleware, asyncHandler(uploadAvatar));

// PATCH /api/profiles/:id/avatar (compatibilidad adicional)
router.patch('/:id/avatar', avatarUploadMiddleware, asyncHandler(uploadAvatar));

// POST /api/profiles/:id/photo (compatibilidad con frontend)
router.post('/:id/photo', avatarUploadMiddleware, asyncHandler(uploadAvatar));

// PUT /api/profiles/:id/photo (compatibilidad con frontend)
router.put('/:id/photo', avatarUploadMiddleware, asyncHandler(uploadAvatar));

// PATCH /api/profiles/:id/photo (compatibilidad con frontend)
router.patch('/:id/photo', avatarUploadMiddleware, asyncHandler(uploadAvatar));

// POST /api/profiles/avatar/:id (compatibilidad con frontend)
router.post('/avatar/:id', avatarUploadMiddleware, asyncHandler(uploadAvatar));

// PUT /api/profiles/avatar/:id (compatibilidad con frontend)
router.put('/avatar/:id', avatarUploadMiddleware, asyncHandler(uploadAvatar));

// PATCH /api/profiles/avatar/:id (compatibilidad con frontend)
router.patch('/avatar/:id', avatarUploadMiddleware, asyncHandler(uploadAvatar));

// POST /api/profiles/photo/:id (compatibilidad con frontend)
router.post('/photo/:id', avatarUploadMiddleware, asyncHandler(uploadAvatar));

// PUT /api/profiles/photo/:id (compatibilidad con frontend)
router.put('/photo/:id', avatarUploadMiddleware, asyncHandler(uploadAvatar));

// PATCH /api/profiles/photo/:id (compatibilidad con frontend)
router.patch('/photo/:id', avatarUploadMiddleware, asyncHandler(uploadAvatar));

export default router;
