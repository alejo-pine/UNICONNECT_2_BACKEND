import { supabase } from '../utils/supabaseClient';

const TABLE = 'profile';
const SUBJECT_TABLE = 'subject';

export interface OnboardingStateRecord {
  profile_id: string;
  onboarding_required: boolean;
  onboarding_completed_at: string | null;
  onboarding_skipped_at: string | null;
}

export interface OnboardingStepOneInput {
  career: string;
  semester: number;
  phoneNumber: string;
}

export interface OnboardingContactInput {
  phoneNumber: string;
}

export interface ProgramOptionRecord {
  name: string;
}

export interface OnboardingStepOneRecord {
  profile_id: string;
  career: string | null;
  semester: number | null;
  phone_number: string | null;
}

const SELECT_FIELDS =
  'id, onboarding_required, onboarding_completed_at, onboarding_skipped_at';

const STEP_ONE_FIELDS = 'id, career, semester, phone_number';

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

export const saveOnboardingStepOneForProfile = async (
  profileId: string,
  input: OnboardingStepOneInput
): Promise<OnboardingStepOneRecord | null> => {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      career: input.career,
      semester: input.semester,
      phone_number: input.phoneNumber,
    })
    .eq('id', profileId)
    .select(STEP_ONE_FIELDS)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    profile_id: data.id as string,
    career: (data.career as string | null) ?? null,
    semester: (data.semester as number | null) ?? null,
    phone_number: (data.phone_number as string | null) ?? null,
  };
};

export const saveOnboardingContactForProfile = async (
  profileId: string,
  input: OnboardingContactInput
): Promise<OnboardingStepOneRecord | null> => {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      phone_number: input.phoneNumber,
    })
    .eq('id', profileId)
    .select(STEP_ONE_FIELDS)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    profile_id: data.id as string,
    career: (data.career as string | null) ?? null,
    semester: (data.semester as number | null) ?? null,
    phone_number: (data.phone_number as string | null) ?? null,
  };
};

export const findProgramsForOnboarding = async (
  search?: string,
  limit = 20
): Promise<ProgramOptionRecord[]> => {
  let query = supabase
    .from(SUBJECT_TABLE)
    .select('program')
    .not('program', 'is', null)
    .order('program', { ascending: true })
    .limit(limit * 5);

  if (search) {
    query = query.ilike('program', `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const unique = new Set<string>();
  for (const row of data ?? []) {
    const value = typeof row.program === 'string' ? row.program.trim() : '';
    if (value) {
      unique.add(value);
    }
  }

  return Array.from(unique)
    .sort((a, b) => a.localeCompare(b))
    .slice(0, limit)
    .map((name) => ({ name }));
};
