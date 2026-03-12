import {
  findAllEvents,
  findEventById,
  FindAllEventsOptions,
} from '../repositories/eventRepository';
import { EventCardSummary, EventDetail, ServiceResult } from '../types/common';
import { eventLogger } from '../utils/eventLogger';

export const getAllEvents = async (
  options: FindAllEventsOptions = {}
): Promise<ServiceResult<EventCardSummary[]>> => {
  try {
    const data = await findAllEvents(options);
    return { data, error: null, statusCode: 200 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching events';
    eventLogger.error('eventService.getAllEvents', message);
    return { data: null, error: 'Error fetching events', statusCode: 500 };
  }
};

export const getEventById = async (id: string): Promise<ServiceResult<EventDetail>> => {
  try {
    const data = await findEventById(id);
    if (!data) {
      eventLogger.warn('eventService.getEventById', 'Event not found', { id });
      return { data: null, error: 'Event not found', statusCode: 404 };
    }
    return { data, error: null, statusCode: 200 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching event';
    eventLogger.error('eventService.getEventById', message, { id });
    return { data: null, error: 'Error fetching event', statusCode: 500 };
  }
};
