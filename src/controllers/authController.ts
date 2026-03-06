import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../utils/supabaseClient';
import { env } from '../config/env';

const PROFILE_FIELDS =
  'id, auth0_id, email, name, avatar_url, career, semester, phone_number, created_at';

interface ProfileRecord {
  id: string;
  auth0_id: string;
  email: string;
  name: string;
}

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

const emitSessionToken = (profile: ProfileRecord): string => {
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

export const syncAuthProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const requestContext = buildRequestContext(req);

  try {
    const accessToken = extractAuthorizationToken(req.headers.authorization);
    if (!accessToken) {
      res.status(401).json({
        error: 'Token de autenticacion requerido',
        statusCode: 401,
      });
      return;
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

      res.status(502).json({
        error: 'No se pudo obtener el perfil desde Auth0',
        statusCode: 502,
      });
      return;
    }

    const normalizedAuth0Id = typeof userInfo.sub === 'string' ? userInfo.sub.trim() : '';
    const normalizedEmail =
      typeof userInfo.email === 'string' ? userInfo.email.trim().toLowerCase() : '';
    const normalizedName = typeof userInfo.name === 'string' ? userInfo.name.trim() : '';

    if (!normalizedAuth0Id || !normalizedEmail || !normalizedName) {
      res.status(401).json({
        error: 'Token invalido',
        statusCode: 401,
      });
      return;
    }

    const { data: profileByAuth0Id, error: profileByAuth0IdError } = await supabase
      .from('profile')
      .select(PROFILE_FIELDS)
      .eq('auth0_id', normalizedAuth0Id)
      .maybeSingle();

    if (profileByAuth0IdError) {
      console.error('[authController.syncAuthProfile] Supabase SELECT error', {
        message: profileByAuth0IdError.message,
        details: profileByAuth0IdError.details,
        hint: profileByAuth0IdError.hint,
        code: profileByAuth0IdError.code,
        ...requestContext,
        error: profileByAuth0IdError,
      });
      throw new Error(profileByAuth0IdError.message);
    }

    let resolvedProfile = profileByAuth0Id as ProfileRecord | null;
    let created = false;

    if (!resolvedProfile) {
      const { data: profileByEmail, error: profileByEmailError } = await supabase
        .from('profile')
        .select(PROFILE_FIELDS)
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (profileByEmailError) {
        console.error('[authController.syncAuthProfile] Supabase SELECT by email error', {
          message: profileByEmailError.message,
          details: profileByEmailError.details,
          hint: profileByEmailError.hint,
          code: profileByEmailError.code,
          ...requestContext,
          error: profileByEmailError,
        });
        throw new Error(profileByEmailError.message);
      }

      resolvedProfile = profileByEmail as ProfileRecord | null;
    }

    if (resolvedProfile) {
      const updates: Partial<Pick<ProfileRecord, 'auth0_id' | 'email' | 'name'>> = {};

      if (resolvedProfile.auth0_id !== normalizedAuth0Id) {
        updates.auth0_id = normalizedAuth0Id;
      }

      if (resolvedProfile.email !== normalizedEmail) {
        updates.email = normalizedEmail;
      }

      if (resolvedProfile.name !== normalizedName) {
        updates.name = normalizedName;
      }

      if (Object.keys(updates).length > 0) {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profile')
          .update(updates)
          .eq('id', resolvedProfile.id)
          .select(PROFILE_FIELDS)
          .single();

        if (updateError) {
          console.error('[authController.syncAuthProfile] Supabase UPDATE error', {
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint,
            code: updateError.code,
            ...requestContext,
            error: updateError,
          });
          throw new Error(updateError.message);
        }

        resolvedProfile = updatedProfile as ProfileRecord;
      }
    } else {
      const { data: createdProfile, error: insertError } = await supabase
        .from('profile')
        .insert({
          auth0_id: normalizedAuth0Id,
          email: normalizedEmail,
          name: normalizedName,
        })
        .select(PROFILE_FIELDS)
        .single();

      if (insertError) {
        console.error('[authController.syncAuthProfile] Supabase INSERT error', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
          ...requestContext,
          error: insertError,
        });
        throw new Error(insertError.message);
      }

      resolvedProfile = createdProfile as ProfileRecord;
      created = true;
    }

    const token = emitSessionToken(resolvedProfile);
    const responseStatus = created ? 201 : 200;

    console.info('[authController.syncAuthProfile] Response sent', {
      ...requestContext,
      userId: resolvedProfile.id,
      tokenIssued: Boolean(token),
      statusCode: responseStatus,
      created,
    });

    res.status(responseStatus).json({
      token,
      userId: resolvedProfile.id,
      email: resolvedProfile.email,
      name: resolvedProfile.name,
      data: {
        access_token: token,
        user_id: resolvedProfile.id,
      },
    });
  } catch (error: unknown) {
    const supabaseLikeError =
      typeof error === 'object' && error !== null
        ? (error as {
            message?: string;
            details?: string;
            hint?: string;
            code?: string;
          })
        : null;

    console.error('[authController.syncAuthProfile] Unhandled error', {
      message:
        supabaseLikeError?.message ??
        (error instanceof Error ? error.message : 'Error desconocido'),
      details: supabaseLikeError?.details,
      hint: supabaseLikeError?.hint,
      code: supabaseLikeError?.code,
      ...requestContext,
      error,
    });

    res.status(500).json({
      error: 'Error interno del servidor al sincronizar autenticacion',
      code: 'AUTH_SYNC_FAILED',
    });
  }
};
