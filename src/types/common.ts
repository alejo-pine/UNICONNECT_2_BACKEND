import { Request } from 'express';

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

// ── Entidades del dominio ─────────────────────────────────────────────────────

export interface Profile {
  id_perfil: string;
  carrera: string | null;
  semestre: number | null;
  celular: string | null;
  fecha_creacion: string;
}

export interface Materia {
  id: string;
  nombre: string;
  codigo: string;
  programa: string | null;
  fecha_creacion: string;
}

// ── Resultado estándar de servicios ──────────────────────────────────────────

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
  statusCode: number;
}

// ── Students ──────────────────────────────────────────────────────────────────

export interface CompaneroResult {
  id_perfil: string;
}