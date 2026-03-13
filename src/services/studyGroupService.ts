import {
  CreateStudyGroupDTO,
  ServiceResult,
  StudyGroupResponse,
  StudyGroupWithSubject,
} from '../types/common';
import {
  createStudyGroup,
  findStudyGroupsByProfileId,
  verifySubjectExists,
} from '../repositories/studyGroupRepository';
import { eventLogger } from '../utils/eventLogger';
import { HttpError } from '../utils/httpError';

/**
 * Service to handle study group creation.
 * Validates DTO, checks subject existence, and creates the group.
 */
export const createStudyGroupService = async (
  body: unknown,
  creatorId: string
): Promise<ServiceResult<StudyGroupResponse>> => {
  try {
    // Validate that body is an object
    if (typeof body !== 'object' || body === null) {
      throw new HttpError(400, 'Request body must be a JSON object');
    }

    const { name, description, subject_id } = body as Record<string, unknown>;

    // Validate required fields are present and not empty
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new HttpError(400, 'Field "name" is required and must be a non-empty string');
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      throw new HttpError(400, 'Field "description" is required and must be a non-empty string');
    }

    if (!subject_id || typeof subject_id !== 'string' || !subject_id.trim()) {
      throw new HttpError(400, 'Field "subject_id" is required and must be a non-empty string');
    }

    const dto: CreateStudyGroupDTO = {
      name: name.trim(),
      description: description.trim(),
      subject_id: subject_id.trim(),
    };

    // Verify subject exists
    const subjectExists = await verifySubjectExists(dto.subject_id);
    if (!subjectExists) {
      eventLogger.warn('studyGroupService.createStudyGroupService', 'Subject not found', {
        subjectId: dto.subject_id,
      });
      throw new HttpError(400, 'Subject does not exist');
    }

    // Create the study group with transactional member insert
    const studyGroup = await createStudyGroup(dto.name, dto.description, dto.subject_id, creatorId);

    eventLogger.info('studyGroupService.createStudyGroupService', 'Study group created', {
      groupId: studyGroup.id,
      creatorId,
      subjectId: dto.subject_id,
    });

    // Return response with is_admin = true since creator is the admin
    const response: StudyGroupResponse = {
      ...studyGroup,
      is_admin: true,
    };

    return {
      data: response,
      error: null,
      statusCode: 201,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    eventLogger.error('studyGroupService.createStudyGroupService', message, {
      creatorId,
    });

    if (err instanceof HttpError) {
      return {
        data: null,
        error: err.message,
        statusCode: err.statusCode,
      };
    }

    // Check for database constraint errors
    if (message.includes('violates unique constraint') || message.includes('UNIQUE')) {
      return {
        data: null,
        error: 'A study group with this name already exists',
        statusCode: 400,
      };
    }

    return {
      data: null,
      error: 'Failed to create study group',
      statusCode: 500,
    };
  }
};

export const getMyStudyGroupsService = async (
  profileId: string
): Promise<ServiceResult<StudyGroupResponse[]>> => {
  try {
    const data: StudyGroupWithSubject[] = await findStudyGroupsByProfileId(profileId);

    return {
      data: data.map((group) => ({ ...group, is_admin: group.creator_id === profileId })),
      error: null,
      statusCode: 200,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch study groups';
    eventLogger.error('studyGroupService.getMyStudyGroupsService', message, {
      profileId,
    });

    return {
      data: null,
      error: 'Failed to fetch study groups',
      statusCode: 500,
    };
  }
};
