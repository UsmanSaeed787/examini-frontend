export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
}

import { StudentProfile, StudentEnrollment } from './student';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  email_verified: boolean;
  is_active: boolean;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
  // Student-specific fields (populated when role is student and details are fetched)
  profile?: StudentProfile | null;
  enrollments?: StudentEnrollment[];
}

export interface UserCreate {
  email: string;
  password: string;
  role: UserRole;
  /** null clears the name; the column and the backend schema are both nullable. */
  full_name?: string | null;
}

export interface UserUpdate {
  email?: string;
  full_name?: string | null;
  is_active?: boolean;
}

