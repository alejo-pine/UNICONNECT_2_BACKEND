import { env } from './config/env';
import express, { NextFunction, Request, Response, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authMiddleware from './middlewares/auth';
import { checkDatabaseConnection } from './config/database';
import { initializeJWKS } from './utils/jwksClient';
import profilesRouter from './routes/profiles/index';
import materiasRouter from './routes/materias/index';
import perfilMateriaRouter from './routes/perfil_materias/perfilMateriaRoutes';
import app from './app';

// ============================================================================
// 1. MIDDLEWARES GLOBALES
// ============================================================================

// CORS
const corsOptions = {
  origin:
    env.nodeEnv === 'development'
      ? '*'
      : process.env.FRONTEND_URL ?? false,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(helmet());

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// 3. RUTAS PÚBLICAS SIN AUTH
// ============================================================================

const authRouter: Router = Router();

authRouter.get('/status', (req: Request, res: Response): void => {
  res.status(200).json({
    message: 'Autenticación manejada por Supabase',
  });
});

app.use('/api/auth', authRouter);

// ============================================================================
// 4. RUTAS PROTEGIDAS CON AUTH
// ============================================================================

const apiRouter: Router = Router();

apiRouter.use('/profiles', profilesRouter);
apiRouter.use('/materias', materiasRouter);
apiRouter.use('/perfil-materias', perfilMateriaRouter);

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
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    if (env.nodeEnv === 'production') {
      res.status(500).json({
        error: 'Error interno del servidor',
        statusCode: 500,
      });
    } else {
      res.status(500).json({
        error: err.message,
        statusCode: 500,
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
  });
};

startServer();

export default app;
