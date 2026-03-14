import { Request, Response } from 'express';
import { getAllSubjects, getSubjectById as fetchSubjectById, getMySubjects as fetchMySubjects } from '../services/subjectService';
import { sendServiceResult } from '../utils/controller';
import { AuthenticatedRequest } from '../types/common';

/**
 * GET /api/subjects
 * Query params: ?search=keyword&limit=20
 * Returns a lightweight list of subjects for autocomplete dropdowns.
 */
export const getSubjects = async (req: Request, res: Response): Promise<void> => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
  const programFromProgram =
    typeof req.query.program === 'string' ? req.query.program.trim() : undefined;
  const programFromCareer =
    typeof req.query.career === 'string' ? req.query.career.trim() : undefined;
  const program = (programFromProgram || programFromCareer || '').trim() || undefined;
  const limitRaw =
    typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
  const limit = limitRaw !== undefined && !isNaN(limitRaw) ? limitRaw : 20;

  const result = await getAllSubjects({
    search: search || undefined,
    limit,
    program,
  });
  sendServiceResult(res, result, 200);
};

/**
 * GET /api/subjects/:id
 * Returns the full subject record for a given id.
 */
export const getSubjectById = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  const result = await fetchSubjectById(id);
  sendServiceResult(res, result, 200);
};

/**
 * GET /api/subjects/my-subjects
 * Returns only the subjects enrolled by the authenticated user.
 * Requires authentication (token must be provided).
 * profile_id is extracted from JWT token (req.user.id).
 */
export const getMySubjects = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Verify user is authenticated
    if (!req.user?.id) {
      console.warn('[getMySubjects] No user ID in request');
      res.status(401).json({
        error: 'Authentication required',
        statusCode: 401,
      });
      return;
    }

    console.log('[getMySubjects] Fetching subjects for user:', req.user.id);
    const result = await fetchMySubjects(req.user.id);
    console.log('[getMySubjects] Service result:', result);
    
    sendServiceResult(res, result, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[subjectController.getMySubjects]', message, { userId: req.user?.id });

    res.status(500).json({
      error: 'Internal server error',
      statusCode: 500,
    });
  }
};
