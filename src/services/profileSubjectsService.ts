import * as repo from '../repositories/profileSubjectsRepository';
import { findSubjectsInfoByProfile } from '../repositories/profileSubjectsRepository';


export const getSubjectsByProfile = async (profile_id: string) => {
  try {
    const data = await repo.findSubjectsByProfile(profile_id);
    return { data, error: null, statusCode: 200 };
  } catch (err: any) {
    return { data: null, error: err.message, statusCode: 500 };
  }
};


export const addSubject = async (profile_id: string, subject_id: string) => {
  try {
    const data = await repo.addSubjectToProfile(profile_id, subject_id);
    return { data, error: null, statusCode: 201 };
  } catch (err: any) {
    return { data: null, error: err.message, statusCode: 500 };
  }
};


export const removeSubject = async (profile_id: string, subject_id: string) => {
  try {
    await repo.removeSubjectFromProfile(profile_id, subject_id);
    return { data: true, error: null, statusCode: 200 };
  } catch (err: any) {
    return { data: null, error: err.message, statusCode: 500 };
  }
};


export const getSubjectsInfoByProfile = async (profile_id: string) => {
  try {
    const subjects = await findSubjectsInfoByProfile(profile_id);
    return { data: subjects, error: null, statusCode: 200 };
  } catch (err: any) {
    return { data: null, error: err.message, statusCode: 500 };
  }
};
