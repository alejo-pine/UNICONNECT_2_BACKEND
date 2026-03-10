import {
  createAuthProfile,
  findProfileByAuth0Id,
  findProfileByEmail,
  updateAuthProfileById,
} from '../repositories/authRepository';
import { ServiceResult } from '../types/common';

export interface SyncedAuthProfile {
  id: string;
  auth0_id: string;
  email: string;
  name: string;
}

export interface SyncAuthProfileInput {
  auth0Id: string;
  email: string;
  name: string;
}

export interface SyncAuthProfileData {
  profile: SyncedAuthProfile;
  created: boolean;
}

export const syncAuthProfileByIdentity = async (
  input: SyncAuthProfileInput
): Promise<ServiceResult<SyncAuthProfileData>> => {
  try {
    let resolvedProfile = await findProfileByAuth0Id(input.auth0Id);
    let created = false;

    if (!resolvedProfile) {
      resolvedProfile = await findProfileByEmail(input.email);
    }

    if (resolvedProfile) {
      const updates: Partial<Pick<SyncedAuthProfile, 'auth0_id' | 'email' | 'name'>> = {};

      if (resolvedProfile.auth0_id !== input.auth0Id) {
        updates.auth0_id = input.auth0Id;
      }

      if (resolvedProfile.email !== input.email) {
        updates.email = input.email;
      }

      if (resolvedProfile.name !== input.name) {
        updates.name = input.name;
      }

      if (Object.keys(updates).length > 0) {
        resolvedProfile = await updateAuthProfileById(resolvedProfile.id, updates);
      }
    } else {
      resolvedProfile = await createAuthProfile(input.auth0Id, input.email, input.name);
      created = true;
    }

    return {
      data: {
        profile: resolvedProfile,
        created,
      },
      error: null,
      statusCode: created ? 201 : 200,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error syncing auth profile';
    console.error('[authService.syncAuthProfileByIdentity]', message);
    return {
      data: null,
      error: 'Error syncing auth profile',
      statusCode: 500,
    };
  }
};
