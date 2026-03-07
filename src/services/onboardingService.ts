import {
  completeOnboardingForProfile,
  createPendingOnboardingForProfile,
  getOnboardingStateByProfileId,
  OnboardingStateRecord,
} from '../repositories/onboardingRepository';
import { ServiceResult } from '../types/common';

export interface OnboardingStatus {
  needsOnboarding: boolean;
  isCompleted: boolean;
  completedAt: string | null;
  skippedAt: string | null;
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
