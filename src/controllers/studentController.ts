import { RequestHandler } from 'express';
import { AuthenticatedRequest } from '../types/common';
import { getClassmatesBySubject } from '../services/studentService';

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

  if (result.error) {
    res.status(result.statusCode).json({ error: result.error, statusCode: result.statusCode });
    return;
  }

  res.status(200).json({ data: result.data });
};
