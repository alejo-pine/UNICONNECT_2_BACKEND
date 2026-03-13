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

export interface Event {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  event_date: string;
  event_time: string;
  location: string | null;
  category: string | null;
  faculty: string | null;
  created_at: string;
}

export interface EventDetail extends Event {
  organizer_name: string | null;
}

// ── Projected / UI types ──────────────────────────────────────────────────────

/** Lightweight projection used for subject dropdown autocomplete */
export interface SubjectSummary {
  id: string;
  name: string;
}

/** Lightweight projection used for homepage event cards */
export interface EventCardSummary {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  faculty: string | null;
  event_date: string;
  event_time: string;
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

// ── Study Groups (US-007) ─────────────────────────────────────────────────────

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  subject_id: string;
  creator_id: string;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  profile_id: string;
  created_at: string;
}

export interface CreateStudyGroupDTO {
  name: string;
  description: string;
  subject_id: string;
}

export interface StudyGroupWithSubject extends StudyGroup {
  subject?: SubjectSummary;
}

export interface StudyGroupResponse extends StudyGroupWithSubject {
  is_admin: boolean;
}

// ── Standard service result ───────────────────────────────────────────────────

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
  statusCode: number;
}