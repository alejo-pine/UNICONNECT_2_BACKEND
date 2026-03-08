import {
  completeOnboardingForProfile,
  createPendingOnboardingForProfile,
  findProgramsForOnboarding,
  getOnboardingStateByProfileId,
  OnboardingContactInput,
  OnboardingStepOneInput,
  OnboardingStepOneRecord,
  OnboardingStateRecord,
  ProgramOptionRecord,
  saveOnboardingContactForProfile,
  saveOnboardingStepOneForProfile,
} from '../repositories/onboardingRepository';
import { ServiceResult } from '../types/common';

export interface OnboardingStatus {
  needsOnboarding: boolean;
  isCompleted: boolean;
  completedAt: string | null;
  skippedAt: string | null;
}

export interface OnboardingStepOneData {
  profileId: string;
  career: string | null;
  semester: number | null;
  phoneNumber: string | null;
}

export interface OnboardingProgramOption {
  name: string;
}

const toOnboardingStatus = (state: OnboardingStateRecord | null): OnboardingStatus => {
  if (!state) {
    // Legacy users created before onboarding rollout should not be blocked.
    return {
      needsOnboarding: false,
      isCompleted: true,
      completedAt: null,
      skippedAt: null,
    };
  }

  return {
    needsOnboarding: state.onboarding_required,
    isCompleted: !state.onboarding_required,
    completedAt: state.onboarding_completed_at,
    skippedAt: state.onboarding_skipped_at,
  };
};

const toOnboardingStepOneData = (record: OnboardingStepOneRecord): OnboardingStepOneData => ({
  profileId: record.profile_id,
  career: record.career,
  semester: record.semester,
  phoneNumber: record.phone_number,
});

const toProgramOption = (record: ProgramOptionRecord): OnboardingProgramOption => ({
  name: record.name,
});

export const getOnboardingStatusByProfileId = async (
  profileId: string
): Promise<ServiceResult<OnboardingStatus>> => {
  try {
    const state = await getOnboardingStateByProfileId(profileId);
    return {
      data: toOnboardingStatus(state),
      error: null,
      statusCode: 200,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error getting onboarding status';
    console.error('[onboardingService.getOnboardingStatusByProfileId]', message);
    return {
      data: null,
      error: 'Error getting onboarding status',
      statusCode: 500,
    };
  }
};

export const completeOnboardingByProfileId = async (
  profileId: string,
  skipped: boolean
): Promise<ServiceResult<OnboardingStatus>> => {
  try {
    const state = await completeOnboardingForProfile(profileId, skipped);
    return {
      data: toOnboardingStatus(state),
      error: null,
      statusCode: 200,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error completing onboarding';
    console.error('[onboardingService.completeOnboardingByProfileId]', message);
    return {
      data: null,
      error: 'Error completing onboarding',
      statusCode: 500,
    };
  }
};

export const markNewProfileOnboardingRequired = async (
  profileId: string
): Promise<ServiceResult<OnboardingStatus>> => {
  try {
    const state = await createPendingOnboardingForProfile(profileId);
    return {
      data: toOnboardingStatus(state),
      error: null,
      statusCode: 201,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error creating onboarding state';
    console.error('[onboardingService.markNewProfileOnboardingRequired]', message);
    return {
      data: null,
      error: 'Error creating onboarding state',
      statusCode: 500,
    };
  }
};

export const saveOnboardingStepOneByProfileId = async (
  profileId: string,
  input: OnboardingStepOneInput
): Promise<ServiceResult<OnboardingStepOneData>> => {
  try {
    const record = await saveOnboardingStepOneForProfile(profileId, input);

    if (!record) {
      return {
        data: null,
        error: 'Profile not found',
        statusCode: 404,
      };
    }

    return {
      data: toOnboardingStepOneData(record),
      error: null,
      statusCode: 200,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error saving onboarding step 1';
    console.error('[onboardingService.saveOnboardingStepOneByProfileId]', message);
    return {
      data: null,
      error: 'Error saving onboarding step 1',
      statusCode: 500,
    };
  }
};

export const saveOnboardingContactByProfileId = async (
  profileId: string,
  input: OnboardingContactInput
): Promise<ServiceResult<OnboardingStepOneData>> => {
  try {
    const record = await saveOnboardingContactForProfile(profileId, input);

    if (!record) {
      return {
        data: null,
        error: 'Profile not found',
        statusCode: 404,
      };
    }

    return {
      data: toOnboardingStepOneData(record),
      error: null,
      statusCode: 200,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error saving onboarding contact';
    console.error('[onboardingService.saveOnboardingContactByProfileId]', message);
    return {
      data: null,
      error: 'Error saving onboarding contact',
      statusCode: 500,
    };
  }
};

export const getOnboardingPrograms = async (
  search?: string,
  limit = 20
): Promise<ServiceResult<OnboardingProgramOption[]>> => {
  try {
    const data = await findProgramsForOnboarding(search, limit);
    return {
      data: data.map(toProgramOption),
      error: null,
      statusCode: 200,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching onboarding programs';
    console.error('[onboardingService.getOnboardingPrograms]', message);
    return {
      data: null,
      error: 'Error fetching onboarding programs',
      statusCode: 500,
    };
  }
};
