import {
  findAllSubjects,
  findSubjectById,
  findMySubjects,
  FindAllSubjectsOptions,
} from '../repositories/subjectRepository';
import { Subject, SubjectSummary, ServiceResult } from '../types/common';

export const getAllSubjects = async (
  options: FindAllSubjectsOptions = {}
): Promise<ServiceResult<SubjectSummary[]>> => {
  try {
    const data = await findAllSubjects(options);
    return { data, error: null, statusCode: 200 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching subjects';
    console.error('[subjectService.getAllSubjects]', message);
    return { data: null, error: 'Error fetching subjects', statusCode: 500 };
  }
};

export const getSubjectById = async (id: string): Promise<ServiceResult<Subject>> => {
  try {
    const data = await findSubjectById(id);
    if (!data) {
      return { data: null, error: 'Subject not found', statusCode: 404 };
    }
    return { data, error: null, statusCode: 200 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching subject';
    console.error('[subjectService.getSubjectById]', message);
    return { data: null, error: 'Error fetching subject', statusCode: 500 };
  }
};

/**
 * Get subjects enrolled by the authenticated user.
 * Queries profile_subject table with inner join to subject.
 */
export const getMySubjects = async (
  profileId: string
): Promise<ServiceResult<SubjectSummary[]>> => {
  try {
    if (!profileId || typeof profileId !== 'string' || !profileId.trim()) {
      console.warn('[getMySubjects] Invalid profileId:', profileId);
      return {
        data: null,
        error: 'Profile ID is required and must be a non-empty string',
        statusCode: 400,
      };
    }

    console.log('[subjectService.getMySubjects] Calling repository for profileId:', profileId);
    const data = await findMySubjects(profileId);
    console.log('[subjectService.getMySubjects] Repository returned:', data.length, 'subjects');
    
    return { data, error: null, statusCode: 200 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching enrolled subjects';
    console.error('[subjectService.getMySubjects]', message, { profileId });
    return { data: null, error: 'Error fetching enrolled subjects', statusCode: 500 };
  }
};
