import { Request, Response } from 'express';
import { getAllEvents, getEventById as fetchEventById } from '../services/eventService';
import { sendServiceResult } from '../utils/controller';

/**
 * GET /api/events
 * Query params: ?limit=20
 * Returns chronological list of events for homepage cards.
 */
export const getEvents = async (req: Request, res: Response): Promise<void> => {
  const limitRaw =
    typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
  const limit = limitRaw !== undefined && !isNaN(limitRaw) ? limitRaw : 20;

  const result = await getAllEvents({ limit });
  sendServiceResult(res, result, 200);
};

/**
 * GET /api/events/:id
 * Returns the full event record for a given id.
 */
export const getEventById = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  const result = await fetchEventById(id);
  sendServiceResult(res, result, 200);
};
