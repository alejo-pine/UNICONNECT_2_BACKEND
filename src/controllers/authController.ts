import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../utils/supabaseClient';
import { env } from '../config/env';
import { AuthError, extractBearerToken, verifyAccessToken } from '../utils/jwtAuth';

interface SyncProfileBody {
  auth0_id?: string;
  email?: string;
  name?: string;
  redirect_uri?: string;
  issuer?: string;
  audience?: string;
}

const PROFILE_FIELDS =
  'id, auth0_id, email, name, avatar_url, career, semester, phone_number, created_at';

interface ProfileRecord {
  id: string;
  auth0_id: string;
  email: string;
  name: string;
}

type RequestContextSource = Pick<Request, 'method' | 'path' | 'get'>;

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

export const syncAuthProfile = async (
  req: Request<unknown, unknown, SyncProfileBody>,
  res: Response
): Promise<void> => {
  const requestContext = buildRequestContext(req);

  try {
    const { auth0_id, email, name, redirect_uri, issuer, audience } = req.body;

    let tokenClaims: ReturnType<typeof verifyAccessToken> | null = null;

    if (req.headers.authorization) {
      const token = extractBearerToken(req.headers.authorization);
      tokenClaims = verifyAccessToken(token);
    } else if (env.requireAuthSyncToken) {
      res.status(401).json({
        error: 'Token de autenticacion requerido para sync',
        statusCode: 401,
      });
      return;
    } else {
      console.warn('[authController.syncAuthProfile] Sync sin Authorization (modo compatibilidad)', {
        ...requestContext,
      });
    }

    if (auth0_id === undefined || email === undefined || name === undefined) {
      res.status(400).json({
        error: 'Faltan campos requeridos: auth0_id, email y name son obligatorios',
        statusCode: 400,
      });
      return;
    }

    if (
      (auth0_id !== undefined && typeof auth0_id !== 'string') ||
      (email !== undefined && typeof email !== 'string') ||
      typeof name !== 'string'
    ) {
      res.status(400).json({
        error: 'Los campos auth0_id, email y name deben ser texto',
        statusCode: 400,
      });
      return;
    }

    const normalizedAuth0Id = (auth0_id ?? '').trim();
    const normalizedEmail = (email ?? '').trim().toLowerCase();
    const normalizedName = name.trim();

    if (!normalizedAuth0Id || !normalizedEmail || !normalizedName) {
      res.status(400).json({
        error: 'auth0_id, email y name no pueden estar vacíos',
        statusCode: 400,
      });
      return;
    }

    if (tokenClaims) {
      if (normalizedAuth0Id !== tokenClaims.sub) {
        console.warn('[authController.syncAuthProfile] auth0_id no coincide con token', {
          normalizedAuth0Id,
          tokenSub: tokenClaims.sub,
          ...requestContext,
        });
        res.status(401).json({
          error: 'auth0_id no coincide con el token',
          statusCode: 401,
        });
        return;
      }

      if (normalizedEmail !== tokenClaims.email.trim().toLowerCase()) {
        console.warn('[authController.syncAuthProfile] email no coincide con token', {
          normalizedEmail,
          tokenEmail: tokenClaims.email,
          ...requestContext,
        });
        res.status(401).json({
          error: 'email no coincide con el token',
          statusCode: 401,
        });
        return;
      }
    }

    if (redirect_uri !== undefined) {
      if (typeof redirect_uri !== 'string') {
        res.status(400).json({
          error: 'redirect_uri debe ser texto si se envía',
          statusCode: 400,
        });
        return;
      }

      if (!env.auth0AllowedRedirectUris.includes(redirect_uri)) {
        console.warn('[authController.syncAuthProfile] Redirect URI no permitida', {
          redirectUri: redirect_uri,
          allowedRedirectUris: env.auth0AllowedRedirectUris,
          ...requestContext,
        });
        res.status(400).json({
          error: 'redirect_uri no permitida',
          statusCode: 400,
        });
        return;
      }
    }

    if (env.auth0Issuer && issuer !== undefined && issuer !== env.auth0Issuer) {
      console.warn('[authController.syncAuthProfile] Issuer inválido', {
        expectedIssuer: env.auth0Issuer,
        receivedIssuer: issuer,
        ...requestContext,
      });
      res.status(401).json({
        error: 'issuer inválido',
        statusCode: 401,
      });
      return;
    }

    if (env.auth0Audience && audience !== undefined && audience !== env.auth0Audience) {
      console.warn('[authController.syncAuthProfile] Audience inválido', {
        expectedAudience: env.auth0Audience,
        receivedAudience: audience,
        ...requestContext,
      });
      res.status(401).json({
        error: 'audience inválido',
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
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        error: error.message,
        statusCode: error.statusCode,
      });
      return;
    }

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
