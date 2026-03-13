import { Response } from 'express';
import { AuthenticatedRequest } from '../types/common';
import { createStudyGroupService, getMyStudyGroupsService, getAllStudyGroupsService } from '../services/studyGroupService';
import { sendServiceResult } from '../utils/controller';
import { eventLogger } from '../utils/eventLogger';
import { HttpError } from '../utils/httpError';

/**
 * POST /api/study-groups
 * Create a new study group.
 * 
 * Requires authentication (token must be provided).
 * Body: { name: string, description: string, subject_id: string }
 * 
 * Returns: 201 with created study group object, or error status code
 */
export const createStudyGroup = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Verify user is authenticated
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    const result = await createStudyGroupService(req.body, req.user.id);
    sendServiceResult(res, result, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    eventLogger.error('studyGroupController.createStudyGroup', message, {
      userId: req.user?.id,
    });

    if (err instanceof HttpError) {
      res.status(err.statusCode).json({
        error: err.message,
        statusCode: err.statusCode,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal server error',
      statusCode: 500,
    });
  }
};

/**
 * GET /api/study-groups/my-groups
 * Returns the list of study groups for the authenticated user.
 */
export const getMyStudyGroups = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Authentication required');
    }

    const result = await getMyStudyGroupsService(req.user.id);
    sendServiceResult(res, result, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    eventLogger.error('studyGroupController.getMyStudyGroups', message, {
      userId: req.user?.id,
    });

    if (err instanceof HttpError) {
      res.status(err.statusCode).json({
        error: err.message,
        statusCode: err.statusCode,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal server error',
      statusCode: 500,
    });
  }
};

/**
 * GET /api/study-groups
 * Returns all public study groups (for discovery/browsing).
 * Optional query param: ?limit=50
 */
export const getAllStudyGroups = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const limitRaw = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 50;
    const limit = !isNaN(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 500) : 50;

    const result = await getAllStudyGroupsService(limit);
    sendServiceResult(res, result, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    eventLogger.error('studyGroupController.getAllStudyGroups', message);

    if (err instanceof HttpError) {
      res.status(err.statusCode).json({
        error: err.message,
        statusCode: err.statusCode,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal server error',
      statusCode: 500,
    });
  }
};
