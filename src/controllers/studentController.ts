import { RequestHandler } from 'express';
import { AuthenticatedRequest } from '../types/common';
import { getClassmatesBySubject } from '../services/studentService';
import { sendServiceResult } from '../utils/controller';

/**
 * GET /api/students/classmates/:subjectId
 * Returns flat profile cards of every student enrolled in the given subject,
 * excluding the currently authenticated user.
 */
export const getClassmates: RequestHandler<{ subjectId: string }> = async (
  req,
  res
): Promise<void> => {
  const { subjectId } = req.params;
  const currentProfileId = (req as unknown as AuthenticatedRequest).user.id;

  const result = await getClassmatesBySubject(subjectId, currentProfileId);
  sendServiceResult(res, result, 200);
};
