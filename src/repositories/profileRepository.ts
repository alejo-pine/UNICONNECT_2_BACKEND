import { supabase } from '../utils/supabaseClient';
import { env } from '../config/env';
import { Profile } from '../types/common';

const TABLE = 'profile';
let avatarsBucketChecked = false;

export const findAllProfiles = async (): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, name, email, avatar_url, career, semester, phone_number, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []) as Profile[];
};

export const findProfileById = async (id: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, name, email, avatar_url, career, semester, phone_number, created_at')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // no rows found
    throw new Error(error.message);
  }

  return data as Profile;
};

export const findPublicProfileById = async (id: string) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      name,
      avatar_url,
      career,
      semester,
      phone_number,
      profile_subject (
        subject (
          name
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }

  return data;
};

export const updateProfileById = async (id: string, updates: Partial<Profile>): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Profile;
};

const resolveFileExtensionFromMime = (mimeType: string): string => {
  const normalized = mimeType.toLowerCase();

  if (normalized === 'image/jpeg' || normalized === 'image/jpg') return 'jpg';
  if (normalized === 'image/png') return 'png';
  if (normalized === 'image/webp') return 'webp';
  if (normalized === 'image/heic') return 'heic';
  if (normalized === 'image/heif') return 'heif';

  return 'jpg';
};

const isBucketNotFoundError = (message?: string): boolean => {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes('bucket not found') || normalized.includes('not found');
};

const ensureAvatarsBucket = async (): Promise<void> => {
  if (avatarsBucketChecked) {
    return;
  }

  const bucketName = env.supabaseAvatarsBucket;
  const { data, error } = await supabase.storage.getBucket(bucketName);

  if (!error && data) {
    avatarsBucketChecked = true;
    return;
  }

  if (error && !isBucketNotFoundError(error.message)) {
    throw new Error(error.message);
  }

  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: true,
  });

  if (createError) {
    // If another process created it meanwhile, continue safely.
    const alreadyExists = createError.message.toLowerCase().includes('already exists');
    if (!alreadyExists) {
      throw new Error(createError.message);
    }
  }

  avatarsBucketChecked = true;
};

export const uploadProfileAvatar = async (
  profileId: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> => {
  await ensureAvatarsBucket();

  const extension = resolveFileExtensionFromMime(mimeType);
  const objectPath = `${profileId}/avatar_${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(env.supabaseAvatarsBucket)
    .upload(objectPath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
      cacheControl: '3600',
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage
    .from(env.supabaseAvatarsBucket)
    .getPublicUrl(objectPath);

  if (!data.publicUrl) {
    throw new Error('No se pudo resolver la URL publica del avatar');
  }

  return data.publicUrl;
};

export const updateProfileAvatarUrl = async (id: string, avatarUrl: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ avatar_url: avatarUrl })
    .eq('id', id)
    .select('id, name, email, avatar_url, career, semester, phone_number, created_at')
    .single();

  if (error) throw new Error(error.message);
  return data as Profile;
};