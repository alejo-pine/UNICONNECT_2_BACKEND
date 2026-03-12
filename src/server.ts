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
import eventsRouter from './routes/events/index';
import profileSubjectsRouter from './routes/profile-subjects/profileSubjectsRoutes';
import onboardingRouter from './routes/onboarding/index';
import authRouter from './routes/auth/index';
import app from './app';
import { Server } from 'http';

type RequestError = Error & {
  statusCode?: number;
  status?: number;
  headers?: Record<string, string>;
  code?: string;
  details?: unknown;
};

const normalizeRequestError = (err: unknown): RequestError => {
  if (err instanceof Error) {
    return err as RequestError;
  }

  const fallback = new Error(
    typeof err === 'string' ? err : 'Error desconocido en el servidor'
  ) as RequestError;

  if (typeof err === 'object' && err !== null) {
    const maybeStatusCode = (err as { statusCode?: unknown }).statusCode;
    const maybeStatus = (err as { status?: unknown }).status;
    const maybeCode = (err as { code?: unknown }).code;
    const maybeDetails = (err as { details?: unknown }).details;

    if (typeof maybeStatusCode === 'number') {
      fallback.statusCode = maybeStatusCode;
    }
    if (typeof maybeStatus === 'number') {
      fallback.status = maybeStatus;
    }
    if (typeof maybeCode === 'string') {
      fallback.code = maybeCode;
    }
    if (maybeDetails !== undefined) {
      fallback.details = maybeDetails;
    }
  }

  return fallback;
};

const formatUnknownError = (error: unknown): { message: string; stack?: string } => {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
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

app.use('/api/auth/sync', (req: Request, _res: Response, next: NextFunction): void => {
  if (env.nodeEnv !== 'production') {
    console.log('[auth.sync] request received', {
      hasAuthorizationHeader: Boolean(req.headers.authorization),
      method: req.method,
      path: req.path,
      requestId: req.get('x-request-id'),
    });
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
  max: 300,
  message: {
    error: 'Demasiadas peticiones, intenta más tarde',
    statusCode: 429,
  },
  standardHeaders: false,
  legacyHeaders: false,
  // In local development, frontend hot-reload and retries can easily flood requests.
  skip: () => env.nodeEnv !== 'production',
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
apiRouter.use('/events', eventsRouter);
apiRouter.use('/profile-subjects', profileSubjectsRouter);
apiRouter.use('/onboarding', onboardingRouter);
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
    err: unknown,
    req: Request,
    res: Response,
    _next: NextFunction
  ): void => {
    const requestError = normalizeRequestError(err);
    const statusCode = requestError.statusCode ?? requestError.status ?? 500;
    const isServerError = statusCode >= 500;

    const responsePayload: {
      error: string;
      statusCode: number;
      code?: string;
      validationErrors?: unknown;
      details?: unknown;
    } = {
      error: requestError.message,
      statusCode,
    };

    if (requestError.code) {
      responsePayload.code = requestError.code;
    }

    if (
      typeof requestError.details === 'object' &&
      requestError.details !== null &&
      'validationErrors' in requestError.details
    ) {
      const typedDetails = requestError.details as { validationErrors?: unknown };
      responsePayload.validationErrors = typedDetails.validationErrors;
    } else if (requestError.details !== undefined && !isServerError) {
      responsePayload.details = requestError.details;
    }

    if (statusCode === 401) {
      console.error('[Auth0 ERROR RECHAZO]:', requestError.message);
      console.error(
        '[Detalles de cabecera]:',
        requestError.headers ? requestError.headers['www-authenticate'] : undefined
      );
    }

    if (statusCode === 403 && requestError.message.startsWith('CORS bloqueado')) {
      console.warn('[cors] Request blocked', {
        ...formatRequestContext(req),
        message: requestError.message,
      });
      res.status(403).json({
        error: requestError.message,
        statusCode: 403,
      });
      return;
    }

    console.error('[server] Unhandled error', {
      ...formatRequestContext(req),
      message: requestError.message,
      statusCode,
    });

    if (env.nodeEnv === 'production') {
      if (isServerError) {
        res.status(statusCode).json({
          error: 'Error interno del servidor',
          statusCode,
          code: responsePayload.code,
        });
        return;
      }

      res.status(statusCode).json(responsePayload);
    } else {
      res.status(statusCode).json(responsePayload);
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
    // Keep server alive and log clearly instead of hard-killing the process.
    console.error('❌ Error al cargar JWKS. El servidor continuará en modo degradado.', err);
  }

  console.log('🔌 Conectando a Supabase...');
  const isConnected = await checkDatabaseConnection();
  if (isConnected) {
    console.log('✅ Conexión a Supabase establecida correctamente');
  } else {
    console.error('❌ No se pudo establecer conexión con Supabase — verifica las variables de entorno');
  }

  const maxPortAttempts = env.nodeEnv === 'production' ? 1 : 10;
  let selectedPort = env.port;

  const listenWithPortFallback = async (): Promise<Server> => {
    for (let attempt = 0; attempt < maxPortAttempts; attempt += 1) {
      const candidatePort = env.port + attempt;

      try {
        const server = await new Promise<Server>((resolve, reject) => {
          const candidateServer = app.listen(candidatePort);

          const onListening = (): void => {
            candidateServer.off('error', onError);
            resolve(candidateServer);
          };

          const onError = (error: NodeJS.ErrnoException): void => {
            candidateServer.off('listening', onListening);
            reject(error);
          };

          candidateServer.once('listening', onListening);
          candidateServer.once('error', onError);
        });

        selectedPort = candidatePort;
        if (candidatePort !== env.port) {
          console.warn(
            `[server] Puerto ${env.port} ocupado. Backend levantado en puerto alternativo ${candidatePort}.`
          );
        }

        return server;
      } catch (error: unknown) {
        const networkError = error as NodeJS.ErrnoException;
        if (networkError.code === 'EADDRINUSE' && attempt < maxPortAttempts - 1) {
          console.warn(
            `[server] Puerto ${candidatePort} en uso, intentando ${candidatePort + 1}...`
          );
          continue;
        }

        throw error;
      }
    }

    throw new Error(
      `[server] No se encontró un puerto libre entre ${env.port} y ${env.port + maxPortAttempts - 1}`
    );
  };

  const server: Server = await listenWithPortFallback();

  console.log(`🚀 UniConnect Backend corriendo en puerto ${selectedPort}`);
  console.log(`🌍 Ambiente: ${env.nodeEnv}`);
  console.log(`🔗 http://localhost:${selectedPort}`);
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

  server.on('error', (error: NodeJS.ErrnoException): void => {
    console.error('[server] Error de red en el servidor HTTP', formatUnknownError(error));
  });

  const gracefulShutdown = (signal: NodeJS.Signals): void => {
    console.warn(`[server] Señal ${signal} recibida, cerrando servidor...`);
    server.close((error?: Error): void => {
      if (error) {
        console.error('[server] Error durante cierre del servidor', formatUnknownError(error));
        process.exitCode = 1;
        return;
      }

      console.log('[server] Servidor cerrado correctamente');
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

process.on('unhandledRejection', (reason: unknown): void => {
  // Log and keep process alive to avoid silent crashes while we diagnose root causes.
  console.error('[server] Unhandled promise rejection', formatUnknownError(reason));
});

process.on('uncaughtException', (error: Error): void => {
  // In production you may choose to restart after this. Here we avoid abrupt exits.
  console.error('[server] Uncaught exception', formatUnknownError(error));
});

void startServer().catch((error: unknown) => {
  console.error('[server] Error fatal durante el arranque', formatUnknownError(error));
  process.exitCode = 1;
});

export default app;
