import { Request } from 'express';

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

// ── Domain Entities ───────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  career: string | null;
  semester: number | null;
  phone_number: string | null;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  program: string | null;
  created_at: string;
}

// ── Projected / UI types ──────────────────────────────────────────────────────

/** Lightweight projection used for subject dropdown autocomplete */
export interface SubjectSummary {
  id: string;
  name: string;
}

/** Flat classmate profile returned when searching by subject */
export interface ClassmateProfile {
  id: string;
  name: string;
  career: string | null;
  semester: number | null;
  avatar_url: string | null;
}

/** Public profile projection returned by US-006 */
export interface PublicProfile {
  full_name: string;
  career: string | null;
  semester: number | null;
  phone_number: string | null;
  avatar_url: string | null;
  subjects: string[];
}

// ── Standard service result ───────────────────────────────────────────────────

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
  statusCode: number;
}