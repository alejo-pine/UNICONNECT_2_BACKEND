import { Request, Response } from 'express';
import { getAllSubjects, getSubjectById as fetchSubjectById } from '../services/subjectService';

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

  if (result.error) {
    res.status(result.statusCode).json({ error: result.error, statusCode: result.statusCode });
    return;
  }

  res.status(200).json({ data: result.data });
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

  if (result.error) {
    res.status(result.statusCode).json({ error: result.error, statusCode: result.statusCode });
    return;
  }

  res.status(200).json({ data: result.data });
};
