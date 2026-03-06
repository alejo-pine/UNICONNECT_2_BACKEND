import { env } from './config/env';
import express, { NextFunction, Request, Response, Router } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authMiddleware from './middlewares/auth';
import { checkDatabaseConnection } from './config/database';
import { initializeJWKS } from './utils/jwksClient';
import profilesRouter from './routes/profiles/index';
import subjectsRouter from './routes/subjects/index';
import studentsRouter from './routes/students/index';
import profileSubjectsRouter from './routes/profile-subjects/profileSubjectsRoutes';
import authRouter from './routes/auth/index';
import app from './app';

type RequestError = Error & {
  statusCode?: number;
};

const formatRequestContext = (req: Request): Record<string, string | undefined> => ({
  method: req.method,
  path: req.path,
  originalUrl: req.originalUrl,
  origin: req.get('origin'),
  host: req.get('host'),
  forwardedHost: req.get('x-forwarded-host'),
  forwardedProto: req.get('x-forwarded-proto'),
  userAgent: req.get('user-agent'),
  contentType: req.get('content-type'),
  requestId: req.get('x-request-id'),
});

// ============================================================================
// 1. MIDDLEWARES GLOBALES
// ============================================================================

// CORS
const allowedOrigins = new Set<string>(env.corsAllowedOrigins);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Mobile apps/native clients may not send Origin.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    const corsError: RequestError = new Error(`CORS bloqueado para origen: ${origin}`);
    corsError.statusCode = 403;
    return callback(corsError);
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'ngrok-skip-browser-warning',
    'x-request-id',
  ],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(helmet());

app.use((req: Request, _res: Response, next: NextFunction): void => {
  if (req.path === '/api/auth/sync') {
    console.info('[auth.sync] Incoming request', formatRequestContext(req));
  }
  next();
});

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((err: unknown, req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof SyntaxError && 'body' in err) {
    console.error('[request] JSON parse error', {
      ...formatRequestContext(req),
      message: err.message,
    });
    res.status(400).json({
      error: 'JSON inválido en el cuerpo de la petición',
      statusCode: 400,
    });
    return;
  }

  next(err);
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Demasiadas peticiones, intenta más tarde',
    statusCode: 429,
  },
  standardHeaders: false,
  legacyHeaders: false,
});

app.use(limiter);

// ============================================================================
// 2. RUTA PÚBLICA: HEALTH CHECK
// ============================================================================

app.get('/health', (req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend conectado vía Ngrok',
  });
});

// ============================================================================
// 3. RUTAS PÚBLICAS SIN AUTH
// ============================================================================

app.use('/api/auth', authRouter);

// ============================================================================
// 4. RUTAS PROTEGIDAS CON AUTH
// ============================================================================

const apiRouter: Router = Router();


apiRouter.use('/profiles', profilesRouter);
apiRouter.use('/subjects', subjectsRouter);
apiRouter.use('/students', studentsRouter);
apiRouter.use('/profile-subjects', profileSubjectsRouter);
app.use('/api', authMiddleware, apiRouter);

// ============================================================================
// 5. HANDLER 404
// ============================================================================

app.use((req: Request, res: Response): void => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    statusCode: 404,
  });
});

// ============================================================================
// 6. MIDDLEWARE GLOBAL DE ERRORES
// ============================================================================

app.use(
  (
    err: RequestError,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const statusCode = err.statusCode ?? 500;

    if (statusCode === 403 && err.message.startsWith('CORS bloqueado')) {
      console.warn('[cors] Request blocked', {
        ...formatRequestContext(req),
        message: err.message,
      });
      res.status(403).json({
        error: err.message,
        statusCode: 403,
      });
      return;
    }

    console.error('[server] Unhandled error', {
      ...formatRequestContext(req),
      message: err.message,
      statusCode,
    });

    if (env.nodeEnv === 'production') {
      res.status(statusCode).json({
        error: 'Error interno del servidor',
        statusCode,
      });
    } else {
      res.status(statusCode).json({
        error: err.message,
        statusCode,
      });
    }

  }
);

// ============================================================================
// 7. INICIAR SERVIDOR
// ============================================================================

const startServer = async (): Promise<void> => {
  console.log('� Cargando claves públicas JWKS de Supabase...');
  try {
    await initializeJWKS();
    console.log('✅ JWKS cargado correctamente (ES256)');
  } catch (err) {
    console.error('❌ Error al cargar JWKS:', err);
    process.exit(1);
  }

  console.log('🔌 Conectando a Supabase...');
  const isConnected = await checkDatabaseConnection();
  if (isConnected) {
    console.log('✅ Conexión a Supabase establecida correctamente');
  } else {
    console.error('❌ No se pudo establecer conexión con Supabase — verifica las variables de entorno');
  }

  app.listen(env.port, (): void => {
    console.log(`🚀 UniConnect Backend corriendo en puerto ${env.port}`);
    console.log(`🌍 Ambiente: ${env.nodeEnv}`);
    console.log(`🔗 http://localhost:${env.port}`);
    if (env.backendPublicUrl) {
      console.log(`🌐 URL pública: ${env.backendPublicUrl}`);
    }
    console.log(`🛡️ CORS allowed origins: ${env.corsAllowedOrigins.join(', ')}`);
    if (env.auth0Issuer || env.auth0Domain || env.auth0Audience) {
      console.log(
        `🔐 Auth0 config: domain=${env.auth0Domain ?? 'n/a'}, issuer=${env.auth0Issuer ?? 'n/a'}, audience=${env.auth0Audience ?? 'n/a'}`
      );
      console.log(
        `↩️ Auth0 redirect URIs permitidas: ${env.auth0AllowedRedirectUris.join(', ')}`
      );
    }
  });
};

startServer();

export default app;
