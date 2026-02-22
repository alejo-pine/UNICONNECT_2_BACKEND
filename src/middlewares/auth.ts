import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types/common';
import { env } from '../config/env';

interface UniConnectJwtPayload {
  email?: string;
  sub?: string;
}

const sendError = (res: Response, statusCode: number, error: string): void => {
  res.status(statusCode).json({ error, statusCode });
};

const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader: string | undefined = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 401, 'Token de autenticación requerido');
      return;
    }

    const token: string = authHeader.split(' ')[1] ?? '';
    if (!token) {
      sendError(res, 401, 'Token de autenticación requerido');
      return;
    }

    const decoded: string | JwtPayload = jwt.verify(token, env.supabaseJwtSecret);

    if (typeof decoded === 'string') {
      sendError(res, 401, 'Token inválido');
      return;
    }

    const payload: UniConnectJwtPayload = decoded;
    const userId: string | undefined = payload.sub;
    const email: string | undefined = payload.email;

    if (!userId || !email) {
      sendError(res, 401, 'Token inválido');
      return;
    }

    const allowedDomain: string = env.allowedDomain.toLowerCase();
    const normalizedEmail: string = email.toLowerCase();

    if (!normalizedEmail.endsWith(`@${allowedDomain}`)) {
      sendError(res, 403, 'Acceso restringido a correos institucionales');
      return;
    }

    (req as AuthenticatedRequest).user = {
      id: userId,
      email,
    };

    next();
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        sendError(res, 401, 'Token expirado');
        return;
      }

      if (error.name === 'JsonWebTokenError') {
        sendError(res, 401, 'Token inválido');
        return;
      }
    }

    console.error('Error inesperado en auth middleware:', error);
    sendError(res, 500, 'Error interno del servidor');
  }
};

export default authMiddleware;
