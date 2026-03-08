import { supabase } from '../utils/supabaseClient';

const PROFILE_FIELDS =
  'id, auth0_id, email, name, avatar_url, career, semester, phone_number, created_at';

export interface AuthProfileRecord {
  id: string;
  auth0_id: string;
  email: string;
  name: string;
}

type AuthProfileUpdates = Partial<Pick<AuthProfileRecord, 'auth0_id' | 'email' | 'name'>>;

export const findProfileByAuth0Id = async (
  auth0Id: string
): Promise<AuthProfileRecord | null> => {
  const { data, error } = await supabase
    .from('profile')
    .select(PROFILE_FIELDS)
    .eq('auth0_id', auth0Id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as AuthProfileRecord | null) ?? null;
};

export const findProfileByEmail = async (email: string): Promise<AuthProfileRecord | null> => {
  const { data, error } = await supabase
    .from('profile')
    .select(PROFILE_FIELDS)
    .eq('email', email)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as AuthProfileRecord | null) ?? null;
};

export const updateAuthProfileById = async (
  profileId: string,
  updates: AuthProfileUpdates
): Promise<AuthProfileRecord> => {
  const { data, error } = await supabase
    .from('profile')
    .update(updates)
    .eq('id', profileId)
    .select(PROFILE_FIELDS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as AuthProfileRecord;
};

export const createAuthProfile = async (
  auth0Id: string,
  email: string,
  name: string
): Promise<AuthProfileRecord> => {
  const { data, error } = await supabase
    .from('profile')
    .insert({
      auth0_id: auth0Id,
      email,
      name,
    })
    .select(PROFILE_FIELDS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as AuthProfileRecord;
};
