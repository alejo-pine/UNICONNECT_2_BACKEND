import { supabase } from '../utils/supabaseClient';
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

  const { data, error } = await supabase
    .from(TABLE)
    .select('id, title, description, image_url, faculty, event_date, event_time')
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []) as EventCardSummary[];
};

/**
 * Returns complete event data by id for event detail screen.
 */
export const findEventById = async (id: string): Promise<EventDetail | null> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      'id, profile_id, title, description, image_url, event_date, event_time, location, category, faculty, created_at, profile:profile_id(name)'
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }

  const row = data as Omit<EventDetail, 'organizer_name'> & {
    profile?: { name?: string | null } | Array<{ name?: string | null }> | null;
  };

  const { profile, ...eventData } = row;
  const profileData = Array.isArray(profile) ? profile[0] : profile;

  return {
    ...eventData,
    organizer_name: profileData?.name ?? null,
  };
};
