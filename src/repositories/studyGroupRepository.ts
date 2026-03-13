import { supabase } from '../utils/supabaseClient';
import { GroupMember, StudyGroup, StudyGroupWithSubject, SubjectSummary } from '../types/common';
import { eventLogger } from '../utils/eventLogger';

const STUDY_GROUPS_TABLE = 'study_group';
const GROUP_MEMBERS_TABLE = 'group_member';
const SUBJECTS_TABLE = 'subject';

/**
 * Create a new study group and add the creator as a member.
 * Implements rollback logic if member insertion fails.
 * 
 * Transaction-like behavior:
 * 1. Insert into study_group
 * 2. Insert into group_member
 * 3. If 2 fails, delete from study_group (rollback)
 */
export const createStudyGroup = async (
  name: string,
  description: string,
  subjectId: string,
  creatorId: string
): Promise<StudyGroup> => {
  try {
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
      // Rollback: Delete the study group if member insertion fails
      eventLogger.warn('studyGroupRepository.createStudyGroup', 'Member insertion failed, rolling back', {
        groupId,
        error: memberError.message,
      });

      const { error: deleteError } = await supabase
        .from(STUDY_GROUPS_TABLE)
        .delete()
        .eq('id', groupId);

      if (deleteError) {
        eventLogger.error('studyGroupRepository.createStudyGroup', 'Rollback failed, orphaned group', {
          groupId,
          deleteError: deleteError.message,
        });
      }

      throw new Error(`Failed to add creator as group member: ${memberError.message}`);
    }

    return studyGroupData as StudyGroup;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    eventLogger.error('studyGroupRepository.createStudyGroup', message, { creatorId, subjectId });
    throw err;
  }
};

/**
 * Verify that a subject exists (for validation purposes)
 */
export const verifySubjectExists = async (subjectId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from(SUBJECTS_TABLE)
      .select('id')
      .eq('id', subjectId)
      .maybeSingle();

    if (error && error.message !== 'no rows') {
      throw new Error(`Failed to verify subject: ${error.message}`);
    }

    return !!data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    eventLogger.error('studyGroupRepository.verifySubjectExists', message, { subjectId });
    throw err;
  }
};

/**
 * Fetch study groups for a specific profile via group_member join.
 * Includes subject details for each group.
 * 
 * Query Strategy:
 * 1. Select from group_member table where profile_id matches
 * 2. Join with study_group using group_id foreign key
 * 3. Join with subject using subject_id foreign key within study_group
 * 4. Map response to StudyGroupWithSubject with subject details
 */
export const findStudyGroupsByProfileId = async (
  profileId: string
): Promise<StudyGroupWithSubject[]> => {
  try {
    const { data, error } = await supabase
      .from(GROUP_MEMBERS_TABLE)
      .select(
        `
        study_group!group_id(
          id,
          name,
          description,
          subject_id,
          creator_id,
          created_at,
          subject!subject_id(
            id,
            name
          )
        )
        `
      )
      .eq('profile_id', profileId);

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    // Type-safe extraction and mapping
    // Note: Supabase returns arrays for all relations, even 1:1
    const rows = (data ?? []) as Array<{
      study_group: Array<StudyGroup & { subject: Array<SubjectSummary> }>;
    }>;

    const result = rows
      .flatMap((row) => row.study_group || [])
      .map((group) => ({
        ...group,
        subject: Array.isArray(group.subject) && group.subject.length > 0 ? group.subject[0] : undefined,
      })) as StudyGroupWithSubject[];

    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`findStudyGroupsByProfileId failed: ${message}`);
  }
};

/**
 * Fetch all study groups (public endpoint, optional pagination)
 * Includes subject details for each group.
 */
export const findAllStudyGroups = async (limit: number = 50): Promise<StudyGroupWithSubject[]> => {
  try {
    const { data, error } = await supabase
      .from(STUDY_GROUPS_TABLE)
      .select(
        `
        id,
        name,
        description,
        subject_id,
        creator_id,
        created_at,
        subject!subject_id(
          id,
          name
        )
        `
      )
      .limit(limit);

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    // Map to normalize subject array to single object or undefined
    const result = (data ?? []).map((group: any) => ({
      ...group,
      subject: Array.isArray(group.subject) && group.subject.length > 0 ? group.subject[0] : undefined,
    })) as StudyGroupWithSubject[];

    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`findAllStudyGroups failed: ${message}`);
  }
};
