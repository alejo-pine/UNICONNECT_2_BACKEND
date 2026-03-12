import {
  findAllEvents,
  findEventById,
  FindAllEventsOptions,
} from '../repositories/eventRepository';
import { EventCardSummary, EventDetail, ServiceResult } from '../types/common';

export const getAllEvents = async (
  options: FindAllEventsOptions = {}
): Promise<ServiceResult<EventCardSummary[]>> => {
  try {
    const data = await findAllEvents(options);
    return { data, error: null, statusCode: 200 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching events';
    console.error('[eventService.getAllEvents]', message);
    return { data: null, error: 'Error fetching events', statusCode: 500 };
  }
};

export const getEventById = async (id: string): Promise<ServiceResult<EventDetail>> => {
  try {
    const data = await findEventById(id);
    if (!data) {
      return { data: null, error: 'Event not found', statusCode: 404 };
    }
    return { data, error: null, statusCode: 200 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching event';
    console.error('[eventService.getEventById]', message);
    return { data: null, error: 'Error fetching event', statusCode: 500 };
  }
};
