import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import {
  getOnboardingStatusByProfileId,
  markNewProfileOnboardingRequired,
} from '../services/onboardingService';
import { syncAuthProfileByIdentity, SyncedAuthProfile } from '../services/authService';
import { HttpError } from '../utils/httpError';

type RequestContextSource = Pick<Request, 'method' | 'path' | 'get'>;

interface Auth0UserInfo {
  sub?: string;
  email?: string;
  name?: string;
}

const buildRequestContext = (req: RequestContextSource): Record<string, string | undefined> => ({
  requestId: req.get('x-request-id'),
  method: req.method,
  path: req.path,
  origin: req.get('origin'),
  host: req.get('host'),
  forwardedHost: req.get('x-forwarded-host'),
  forwardedProto: req.get('x-forwarded-proto'),
  userAgent: req.get('user-agent'),
});

const emitSessionToken = (profile: SyncedAuthProfile): string => {
  const nowSeconds = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      sub: profile.id,
      auth0_id: profile.auth0_id,
      email: profile.email,
      name: profile.name,
      iat: nowSeconds,
      type: 'session',
    },
    env.supabaseJwtSecret,
    {
      algorithm: 'HS256',
      expiresIn: '7d',
      issuer: env.backendPublicUrl ?? 'uniconnect-backend',
      audience: 'uniconnect-mobile',
    }
  );
};

const extractAuthorizationToken = (authorization?: string): string | null => {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }
  const token = authorization.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
};

const getUserInfoUrl = (): string | null => {
  if (env.auth0Domain) {
    return `https://${env.auth0Domain}/userinfo`;
  }

  if (env.auth0Issuer) {
    return new URL('userinfo', env.auth0Issuer).toString();
  }

  return null;
};

const fetchAuth0UserInfo = async (token: string): Promise<Auth0UserInfo> => {
  const userInfoUrl = getUserInfoUrl();
  if (!userInfoUrl) {
    throw new Error('Auth0 no configurado');
  }

  const response = await fetch(userInfoUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Fallo al obtener userinfo: ${response.status}`);
  }

  return (await response.json()) as Auth0UserInfo;
};

const resolveNeedsOnboarding = async (
  profileId: string,
  created: boolean
): Promise<boolean> => {
  if (created) {
    const onboardingCreationResult = await markNewProfileOnboardingRequired(profileId);
    if (onboardingCreationResult.error) {
      throw new Error(onboardingCreationResult.error);
    }
    return true;
  }

  const onboardingStatusResult = await getOnboardingStatusByProfileId(profileId);

  if (onboardingStatusResult.error || !onboardingStatusResult.data) {
    throw new Error(onboardingStatusResult.error ?? 'Failed to get onboarding status');
  }

  return onboardingStatusResult.data.needsOnboarding;
};

export const syncAuthProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const requestContext = buildRequestContext(req);
  const accessToken = extractAuthorizationToken(req.headers.authorization);
  if (!accessToken) {
    throw new HttpError(401, 'Token de autenticacion requerido');
  }

  let userInfo: Auth0UserInfo;
  try {
    userInfo = await fetchAuth0UserInfo(accessToken);
  } catch (error: unknown) {
    console.error('[authController.syncAuthProfile] Error al consultar /userinfo', {
      message: error instanceof Error ? error.message : 'Error desconocido',
      ...requestContext,
      error,
    });
    throw new HttpError(502, 'No se pudo obtener el perfil desde Auth0');
  }

  const normalizedAuth0Id = typeof userInfo.sub === 'string' ? userInfo.sub.trim() : '';
  const normalizedEmail =
    typeof userInfo.email === 'string' ? userInfo.email.trim().toLowerCase() : '';
  const normalizedName = typeof userInfo.name === 'string' ? userInfo.name.trim() : '';

  if (!normalizedAuth0Id || !normalizedEmail || !normalizedName) {
    throw new HttpError(401, 'Token invalido');
  }

  const syncResult = await syncAuthProfileByIdentity({
    auth0Id: normalizedAuth0Id,
    email: normalizedEmail,
    name: normalizedName,
  });

  if (syncResult.error || !syncResult.data) {
    console.error('[authController.syncAuthProfile] Auth sync service error', {
      message: syncResult.error,
      ...requestContext,
    });

    throw new HttpError(syncResult.statusCode, 'Error interno del servidor al sincronizar autenticacion', {
      code: 'AUTH_SYNC_FAILED',
    });
  }

  const resolvedProfile: SyncedAuthProfile = syncResult.data.profile;
  const created = syncResult.data.created;

  const needsOnboarding = await resolveNeedsOnboarding(resolvedProfile.id, created);
  const token = emitSessionToken(resolvedProfile);
  const responseStatus = created ? 201 : 200;

  console.info('[authController.syncAuthProfile] Response sent', {
    ...requestContext,
    userId: resolvedProfile.id,
    tokenIssued: Boolean(token),
    statusCode: responseStatus,
    created,
    needsOnboarding,
  });

  res.status(responseStatus).json({
    token,
    userId: resolvedProfile.id,
    email: resolvedProfile.email,
    name: resolvedProfile.name,
    needsOnboarding,
    data: {
      access_token: token,
      user_id: resolvedProfile.id,
      needs_onboarding: needsOnboarding,
    },
  });
};
