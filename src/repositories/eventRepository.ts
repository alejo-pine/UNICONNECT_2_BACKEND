import { eventDatabaseHandler } from '../config/eventDatabaseHandler';
import { eventLogger } from '../utils/eventLogger';
import { EventCardSummary, EventDetail } from '../types/common';

const TABLE = 'event';

export interface FindAllEventsOptions {
  limit?: number;
}

/**
 * Returns chronological events for homepage cards.
 */
export const findAllEvents = async (
  options: FindAllEventsOptions = {}
): Promise<EventCardSummary[]> => {
  const { limit = 20 } = options;
  const db = eventDatabaseHandler.getClient();

  const { data, error } = await db
    .from(TABLE)
    .select('id, title, description, image_url, faculty, event_date, event_time')
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true })
    .limit(limit);

  if (error) {
    eventLogger.error('eventRepository.findAllEvents', 'Supabase query failed', {
      limit,
      error: error.message,
    });
    throw new Error(error.message);
  }

  eventLogger.info('eventRepository.findAllEvents', 'Events fetched', {
    limit,
    count: data?.length ?? 0,
  });

  return (data ?? []) as EventCardSummary[];
};

/**
 * Returns complete event data by id for event detail screen.
 */
export const findEventById = async (id: string): Promise<EventDetail | null> => {
  const db = eventDatabaseHandler.getClient();

  const { data, error } = await db
    .from(TABLE)
    .select(
      'id, profile_id, title, description, image_url, event_date, event_time, location, category, faculty, created_at, profile:profile_id(name)'
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      eventLogger.warn('eventRepository.findEventById', 'Event not found', { id });
      return null;
    }

    eventLogger.error('eventRepository.findEventById', 'Supabase query failed', {
      id,
      error: error.message,
    });
    throw new Error(error.message);
  }

  const row = data as Omit<EventDetail, 'organizer_name'> & {
    profile?: { name?: string | null } | Array<{ name?: string | null }> | null;
  };

  const { profile, ...eventData } = row;
  const profileData = Array.isArray(profile) ? profile[0] : profile;

  const result = {
    ...eventData,
    organizer_name: profileData?.name ?? null,
  };

  eventLogger.info('eventRepository.findEventById', 'Event fetched by id', { id });

  return result;
};
