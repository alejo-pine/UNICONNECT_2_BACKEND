import { supabase } from '../utils/supabaseClient';

const TABLE = 'profile';

export interface OnboardingStateRecord {
  profile_id: string;
  onboarding_required: boolean;
  onboarding_completed_at: string | null;
  onboarding_skipped_at: string | null;
}

const SELECT_FIELDS =
  'id, onboarding_required, onboarding_completed_at, onboarding_skipped_at';

export const getOnboardingStateByProfileId = async (
  profileId: string
): Promise<OnboardingStateRecord | null> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_FIELDS)
    .eq('id', profileId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    profile_id: data.id as string,
    onboarding_required: Boolean(data.onboarding_required),
    onboarding_completed_at: (data.onboarding_completed_at as string | null) ?? null,
    onboarding_skipped_at: (data.onboarding_skipped_at as string | null) ?? null,
  };
};

export const createPendingOnboardingForProfile = async (
  profileId: string
): Promise<OnboardingStateRecord> => {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      onboarding_required: true,
      onboarding_completed_at: null,
      onboarding_skipped_at: null,
    })
    .eq('id', profileId)
    .select(SELECT_FIELDS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    profile_id: data.id as string,
    onboarding_required: Boolean(data.onboarding_required),
    onboarding_completed_at: (data.onboarding_completed_at as string | null) ?? null,
    onboarding_skipped_at: (data.onboarding_skipped_at as string | null) ?? null,
  };
};

export const completeOnboardingForProfile = async (
  profileId: string,
  skipped: boolean
): Promise<OnboardingStateRecord> => {
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      onboarding_required: false,
      onboarding_completed_at: nowIso,
      onboarding_skipped_at: skipped ? nowIso : null,
    })
    .eq('id', profileId)
    .select(SELECT_FIELDS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    profile_id: data.id as string,
    onboarding_required: Boolean(data.onboarding_required),
    onboarding_completed_at: (data.onboarding_completed_at as string | null) ?? null,
    onboarding_skipped_at: (data.onboarding_skipped_at as string | null) ?? null,
  };
};
