import dotenv from 'dotenv';

dotenv.config();

interface Environment {
  readonly supabaseUrl: string;
  readonly supabaseAnonKey: string;
  readonly supabaseJwtSecret: string;
  readonly allowedDomain: string;
  readonly port: number;
  readonly nodeEnv: 'development' | 'production' | 'test';
}

const parseEnv = (): Environment => {
  const errors: string[] = [];

  // SUPABASE_URL
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    errors.push('SUPABASE_URL no está definida');
  } else if (!supabaseUrl.startsWith('https://')) {
    errors.push('SUPABASE_URL debe empezar con https://');
  }

  // SUPABASE_ANON_KEY
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseAnonKey) {
    errors.push('SUPABASE_ANON_KEY no está definida');
  } else if (supabaseAnonKey.length < 20) {
    errors.push('SUPABASE_ANON_KEY debe tener mínimo 20 caracteres');
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
    supabaseAnonKey: supabaseAnonKey!,
    supabaseJwtSecret: supabaseJwtSecret!,
    allowedDomain: allowedDomain!,
    port,
    nodeEnv: nodeEnvStr as 'development' | 'production' | 'test',
  };
};

export const env: Environment = parseEnv();
