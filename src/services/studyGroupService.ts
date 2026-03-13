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

/**
 * Service to handle study group creation.
 * Validates DTO, checks subject existence, and creates the group.
 */
export const createStudyGroupService = async (
  dto: CreateStudyGroupDTO,
  creatorId: string
): Promise<ServiceResult<StudyGroupResponse>> => {
  try {
    // Validate required fields are present and not empty
    if (!dto.name || typeof dto.name !== 'string' || !dto.name.trim()) {
      return {
        data: null,
        error: 'Field "name" is required and must be a non-empty string',
        statusCode: 400,
      };
    }

    if (!dto.description || typeof dto.description !== 'string' || !dto.description.trim()) {
      return {
        data: null,
        error: 'Field "description" is required and must be a non-empty string',
        statusCode: 400,
      };
    }

    if (!dto.subject_id || typeof dto.subject_id !== 'string' || !dto.subject_id.trim()) {
      return {
        data: null,
        error: 'Field "subject_id" is required and must be a non-empty string',
        statusCode: 400,
      };
    }

    // Verify subject exists
    const subjectExists = await verifySubjectExists(dto.subject_id);
    if (!subjectExists) {
      eventLogger.warn('studyGroupService.createStudyGroupService', 'Subject not found', {
        subjectId: dto.subject_id,
      });
      return {
        data: null,
        error: 'Subject does not exist',
        statusCode: 400,
      };
    }

    // Create the study group with transactional member insert
    const studyGroup = await createStudyGroup(
      dto.name.trim(),
      dto.description.trim(),
      dto.subject_id,
      creatorId
    );

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
