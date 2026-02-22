import { env } from './config/env';
import express, { Express, NextFunction, Request, Response, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authMiddleware from './middlewares/auth';
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

// Aquí irán las rutas protegidas

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

app.listen(env.port, (): void => {
  console.log(`🚀 UniConnect Backend corriendo en puerto ${env.port}`);
  console.log(`🌍 Ambiente: ${env.nodeEnv}`);
});

export default app;
