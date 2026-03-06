import dotenv from 'dotenv';

dotenv.config();

interface Environment {
  readonly supabaseUrl: string;
  readonly supabaseServiceRoleKey: string;
  readonly supabaseJwtSecret: string;
  readonly allowedDomain: string;
  readonly backendPublicUrl?: string;
  readonly corsAllowedOrigins: string[];
  readonly auth0Domain?: string;
  readonly auth0Issuer?: string;
  readonly auth0Audience?: string;
  readonly auth0AllowedRedirectUris: string[];
  readonly requireAuthSyncToken: boolean;
  readonly port: number;
  readonly nodeEnv: 'development' | 'production' | 'test';
}

const parseCsv = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const isValidHttpsUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const isValidHttpOrHttpsUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') {
    return true;
  }

  if (normalized === 'false' || normalized === '0') {
    return false;
  }

  return defaultValue;
};

const parseEnv = (): Environment => {
  const errors: string[] = [];

  // SUPABASE_URL
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    errors.push('SUPABASE_URL no está definida');
  } else if (!supabaseUrl.startsWith('https://')) {
    errors.push('SUPABASE_URL debe empezar con https://');
  }

  // SUPABASE_SERVICE_ROLE_KEY
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseServiceRoleKey) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY no está definida');
  } else if (supabaseServiceRoleKey.length < 20) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY debe tener mínimo 20 caracteres');
  }

  // SUPABASE_JWT_SECRET
  const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!supabaseJwtSecret) {
    errors.push('SUPABASE_JWT_SECRET no está definida');
  } else if (supabaseJwtSecret.length < 20) {
    errors.push('SUPABASE_JWT_SECRET debe tener mínimo 20 caracteres');
  }

  // ALLOWED_DOMAIN
  const allowedDomain = process.env.ALLOWED_DOMAIN;
  if (!allowedDomain) {
    errors.push('ALLOWED_DOMAIN no está definida');
  } else if (allowedDomain.trim().length === 0) {
    errors.push('ALLOWED_DOMAIN no puede estar vacío');
  }

  // BACKEND_PUBLIC_URL
  const backendPublicUrlRaw = process.env.BACKEND_PUBLIC_URL?.trim();
  const backendPublicUrl = backendPublicUrlRaw || undefined;
  if (backendPublicUrl && !isValidHttpsUrl(backendPublicUrl)) {
    errors.push('BACKEND_PUBLIC_URL debe ser una URL https válida');
  }

  // CORS_ALLOWED_ORIGINS
  const defaultCorsOrigins = [
    'http://localhost:8081',
    'http://localhost:19006',
    'https://auth.expo.io',
  ];

  const corsAllowedOriginsRaw = process.env.CORS_ALLOWED_ORIGINS;
  const corsAllowedOrigins = corsAllowedOriginsRaw
    ? parseCsv(corsAllowedOriginsRaw)
    : defaultCorsOrigins;

  if (backendPublicUrl && !corsAllowedOrigins.includes(backendPublicUrl)) {
    corsAllowedOrigins.push(backendPublicUrl);
  }

  const invalidCorsOrigins = corsAllowedOrigins.filter(
    (origin) => !isValidHttpOrHttpsUrl(origin)
  );

  if (invalidCorsOrigins.length > 0) {
    errors.push(
      `CORS_ALLOWED_ORIGINS contiene URL(s) inválidas: ${invalidCorsOrigins.join(', ')}`
    );
  }

  // AUTH0_DOMAIN / AUTH0_ISSUER / AUTH0_AUDIENCE
  const auth0DomainRaw = process.env.AUTH0_DOMAIN?.trim();
  const auth0Domain = auth0DomainRaw || undefined;
  if (auth0Domain && auth0Domain.length === 0) {
    errors.push('AUTH0_DOMAIN no puede estar vacío');
  }

  const auth0IssuerRaw = process.env.AUTH0_ISSUER?.trim();
  const auth0Issuer = auth0IssuerRaw || (auth0Domain ? `https://${auth0Domain}/` : undefined);
  if (auth0Issuer && !isValidHttpsUrl(auth0Issuer)) {
    errors.push('AUTH0_ISSUER debe ser una URL https válida');
  }

  if (auth0Issuer && auth0Domain) {
    try {
      const issuerHost = new URL(auth0Issuer).host;
      if (issuerHost !== auth0Domain) {
        errors.push('AUTH0_ISSUER debe corresponder al AUTH0_DOMAIN configurado');
      }
    } catch {
      // Ya validado arriba.
    }
  }

  const auth0AudienceRaw = process.env.AUTH0_AUDIENCE?.trim();
  const auth0Audience = auth0AudienceRaw || undefined;

  const requireAuthSyncToken = parseBoolean(process.env.REQUIRE_AUTH_SYNC_TOKEN, false);

  // AUTH0_ALLOWED_REDIRECT_URIS
  const defaultAuth0RedirectUris = [
    'https://auth.expo.io/@juanfe_004/uniconnect_2',
    'uniconnect2://auth/callback',
  ];

  const auth0AllowedRedirectUrisRaw = process.env.AUTH0_ALLOWED_REDIRECT_URIS;
  const auth0AllowedRedirectUris = auth0AllowedRedirectUrisRaw
    ? parseCsv(auth0AllowedRedirectUrisRaw)
    : defaultAuth0RedirectUris;

  const invalidRedirectUris = auth0AllowedRedirectUris.filter((uri) => {
    if (uri.startsWith('uniconnect2://')) {
      return false;
    }
    return !isValidHttpsUrl(uri);
  });

  if (invalidRedirectUris.length > 0) {
    errors.push(
      `AUTH0_ALLOWED_REDIRECT_URIS contiene URI(s) inválidas: ${invalidRedirectUris.join(', ')}`
    );
  }

  // PORT
  const portStr = process.env.PORT;
  let port = 3000;
  if (portStr) {
    const parsedPort = parseInt(portStr, 10);
    if (Number.isNaN(parsedPort) || parsedPort <= 0) {
      errors.push('PORT debe ser un número entero positivo');
    } else {
      port = parsedPort;
    }
  }

  // NODE_ENV
  const nodeEnvStr = process.env.NODE_ENV ?? 'development';
  const validNodeEnvs: ('development' | 'production' | 'test')[] = [
    'development',
    'production',
    'test',
  ];
  if (!validNodeEnvs.includes(nodeEnvStr as 'development' | 'production' | 'test')) {
    errors.push(`NODE_ENV debe ser uno de: ${validNodeEnvs.join(', ')}`);
  }

  if (errors.length > 0) {
    console.error('❌ Variables de entorno inválidas:');
    errors.forEach((error) => {
      console.error(`  - ${error}`);
    });
    process.exit(1);
  }

  return {
    supabaseUrl: supabaseUrl!,
    supabaseServiceRoleKey: supabaseServiceRoleKey!,
    supabaseJwtSecret: supabaseJwtSecret!,
    allowedDomain: allowedDomain!,
    backendPublicUrl,
    corsAllowedOrigins,
    auth0Domain,
    auth0Issuer,
    auth0Audience,
    auth0AllowedRedirectUris,
    requireAuthSyncToken,
    port,
    nodeEnv: nodeEnvStr as 'development' | 'production' | 'test',
  };
};

export const env: Environment = parseEnv();
