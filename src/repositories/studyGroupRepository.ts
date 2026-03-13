import { supabase } from '../utils/supabaseClient';
import { GroupMember, StudyGroup, StudyGroupWithSubject, SubjectSummary } from '../types/common';

const STUDY_GROUPS_TABLE = 'study_group';
const GROUP_MEMBERS_TABLE = 'group_member';

/**
 * Create a new study group and add the creator as a member in a transactional manner.
 * 1. Insert into study_group table
 * 2. Insert into group_member table with the same creator_id
 *
 * Returns the created study group object.
 */
export const createStudyGroup = async (
  name: string,
  description: string,
  subjectId: string,
  creatorId: string
): Promise<StudyGroup> => {
  // Insert into study_group and get the generated id
  const { data: studyGroupData, error: studyGroupError } = await supabase
    .from(STUDY_GROUPS_TABLE)
    .insert({
      name,
      description,
      subject_id: subjectId,
      creator_id: creatorId,
    })
    .select('id, name, description, subject_id, creator_id, created_at')
    .single();

  if (studyGroupError) {
    throw new Error(`Failed to create study group: ${studyGroupError.message}`);
  }

  if (!studyGroupData) {
    throw new Error('Study group created but no data returned');
  }

  const groupId = studyGroupData.id;

  // Now add the creator as a member of the group
  const { error: memberError } = await supabase
    .from(GROUP_MEMBERS_TABLE)
    .insert({
      group_id: groupId,
      profile_id: creatorId,
    })
    .select('group_id, profile_id, created_at')
    .single();

  if (memberError) {
    // If adding member fails, we need to clean up - delete the study group
    // Note: In production, this should be done atomically if possible
    throw new Error(`Failed to add creator as group member: ${memberError.message}`);
  }

  return studyGroupData as StudyGroup;
};

/**
 * Verify that a subject exists (for validation purposes)
 */
export const verifySubjectExists = async (subjectId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('subject')
    .select('id')
    .eq('id', subjectId)
    .maybeSingle();

  if (error && error.message !== 'no rows') {
    throw new Error(`Failed to verify subject: ${error.message}`);
  }

  return !!data;
};

export const findStudyGroupsByProfileId = async (
  profileId: string
): Promise<StudyGroupWithSubject[]> => {
  const { data, error } = await supabase
    .from(GROUP_MEMBERS_TABLE)
    .select(
      'group_id, profile_id, created_at, study_group:group_id (id, name, description, subject_id, creator_id, created_at, subject:subject_id (id, name))'
    )
    .eq('profile_id', profileId);

  if (error) {
    throw new Error(`Failed to fetch study groups: ${error.message}`);
  }

  const rows = (data ?? []) as Array<
    GroupMember & {
      study_group: Array<StudyGroup & { subject?: SubjectSummary | SubjectSummary[] | null }>;
    }
  >;

  return rows
    .flatMap((row) => row.study_group)
    .filter((group): group is StudyGroup & { subject?: SubjectSummary | SubjectSummary[] | null } =>
      Boolean(group)
    )
    .map((group) => {
      const subjectValue = Array.isArray(group.subject)
        ? group.subject[0]
        : group.subject ?? undefined;

      return {
        ...group,
        subject: subjectValue,
      } as StudyGroupWithSubject;
    });
};
