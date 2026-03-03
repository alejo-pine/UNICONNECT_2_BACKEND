import {
  findAllSubjects,
  findSubjectById,
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
