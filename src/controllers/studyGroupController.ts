import { Response } from 'express';
import { AuthenticatedRequest, CreateStudyGroupDTO } from '../types/common';
import { createStudyGroupService, getMyStudyGroupsService } from '../services/studyGroupService';
import { sendServiceResult } from '../utils/controller';
import { eventLogger } from '../utils/eventLogger';

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
      res.status(401).json({
        error: 'Authentication required',
        statusCode: 401,
      });
      return;
    }

    const { name, description, subject_id } = req.body;

    // Validate that body is an object
    if (typeof req.body !== 'object' || req.body === null) {
      res.status(400).json({
        error: 'Request body must be a JSON object',
        statusCode: 400,
      });
      return;
    }

    const dto: CreateStudyGroupDTO = {
      name,
      description,
      subject_id,
    };

    const result = await createStudyGroupService(dto, req.user.id);

    // sendServiceResult handles both success and error responses
    sendServiceResult(res, result, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    eventLogger.error('studyGroupController.createStudyGroup', message, {
      userId: req.user?.id,
    });

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
      res.status(401).json({
        error: 'Authentication required',
        statusCode: 401,
      });
      return;
    }

    const result = await getMyStudyGroupsService(req.user.id);
    sendServiceResult(res, result, 200);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    eventLogger.error('studyGroupController.getMyStudyGroups', message, {
      userId: req.user?.id,
    });

    res.status(500).json({
      error: 'Internal server error',
      statusCode: 500,
    });
  }
};
