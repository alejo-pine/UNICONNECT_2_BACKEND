import { supabase } from '../utils/supabaseClient';
import { ClassmateProfile } from '../types/common';

const PIVOT_TABLE = 'profile_subject';

/**
 * Queries the profile_subject pivot table filtered by subjectId, joins the
 * related profile data, and returns a flat array of classmate profiles.
 * The currently logged-in profile is excluded from the results.
 */
export const findClassmatesBySubject = async (
  subjectId: string,
  currentProfileId: string
): Promise<ClassmateProfile[]> => {
  const { data, error } = await supabase
    .from(PIVOT_TABLE)
    .select('profile:profile_id(id, name, career, semester, avatar_url)')
    .eq('subject_id', subjectId)
    .neq('profile_id', currentProfileId);

  if (error) throw new Error(error.message);

  // Flatten the nested profile object produced by the Supabase FK join
  return (data ?? [])
    .map((row: any) => row.profile)
    .filter(Boolean) as ClassmateProfile[];
};
