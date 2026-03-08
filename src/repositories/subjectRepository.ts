import { supabase } from '../utils/supabaseClient';
import { Subject, SubjectSummary } from '../types/common';

const TABLE = 'subject';

export interface FindAllSubjectsOptions {
  search?: string;
  limit?: number;
  program?: string;
}

/**
 * Returns a lightweight list of subjects (id + name only) for autocomplete.
 * Supports optional keyword search and pagination via limit.
 */
export const findAllSubjects = async (
  options: FindAllSubjectsOptions = {}
): Promise<SubjectSummary[]> => {
  const { search, limit = 20, program } = options;

  let query = supabase
    .from(TABLE)
    .select('id, name')
    .order('name', { ascending: true })
    .limit(limit);

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  if (program) {
    // Match subjects by academic program/career selected in onboarding.
    query = query.ilike('program', program);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (data ?? []) as SubjectSummary[];
};

/**
 * Returns a single subject by its primary key. Returns null when not found.
 */
export const findSubjectById = async (id: string): Promise<Subject | null> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, name, code, program, created_at')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // no rows found
    throw new Error(error.message);
  }

  return data as Subject;
};
