import { findClassmatesBySubject } from '../repositories/studentRepository';
import { ClassmateProfile, ServiceResult } from '../types/common';

export const getClassmatesBySubject = async (
  subjectId: string,
  currentProfileId: string
): Promise<ServiceResult<ClassmateProfile[]>> => {
  try {
    const data = await findClassmatesBySubject(subjectId, currentProfileId);
    return { data, error: null, statusCode: 200 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching classmates';
    console.error('[studentService.getClassmatesBySubject]', message);
    return { data: null, error: 'Error fetching classmates for subject', statusCode: 500 };
  }
};
