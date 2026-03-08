import * as repo from '../repositories/profileSubjectsRepository';
import { findSubjectsInfoByProfile } from '../repositories/profileSubjectsRepository';
import { ServiceResult, Subject } from '../types/common';

interface ProfileSubjectRecord {
  subject_id: string;
  created_at: string;
}

interface ProfileSubjectRelation {
  profile_id: string;
  subject_id: string;
}

const mapErrorMessage = (err: unknown, fallback: string): string =>
  err instanceof Error && err.message ? err.message : fallback;

export const getSubjectsByProfile = async (
  profile_id: string
): Promise<ServiceResult<ProfileSubjectRecord[]>> => {
  try {
    const data = await repo.findSubjectsByProfile(profile_id);
    return { data, error: null, statusCode: 200 };
  } catch (err: unknown) {
    return {
      data: null,
      error: mapErrorMessage(err, 'Error fetching subjects by profile'),
      statusCode: 500,
    };
  }
};


export const addSubject = async (
  profile_id: string,
  subject_id: string
): Promise<ServiceResult<ProfileSubjectRelation>> => {
  try {
    const data = await repo.addSubjectToProfile(profile_id, subject_id);
    return { data, error: null, statusCode: 201 };
  } catch (err: unknown) {
    return {
      data: null,
      error: mapErrorMessage(err, 'Error adding subject to profile'),
      statusCode: 500,
    };
  }
};


export const removeSubject = async (
  profile_id: string,
  subject_id: string
): Promise<ServiceResult<boolean>> => {
  try {
    await repo.removeSubjectFromProfile(profile_id, subject_id);
    return { data: true, error: null, statusCode: 200 };
  } catch (err: unknown) {
    return {
      data: null,
      error: mapErrorMessage(err, 'Error removing subject from profile'),
      statusCode: 500,
    };
  }
};


export const getSubjectsInfoByProfile = async (
  profile_id: string
): Promise<ServiceResult<Subject[]>> => {
  try {
    const subjects = await findSubjectsInfoByProfile(profile_id);
    return { data: subjects, error: null, statusCode: 200 };
  } catch (err: unknown) {
    return {
      data: null,
      error: mapErrorMessage(err, 'Error fetching full subject info by profile'),
      statusCode: 500,
    };
  }
};
