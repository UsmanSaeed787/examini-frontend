export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Exam Management System';
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    GOOGLE: '/api/auth/google',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  ADMIN: {
    USERS: '/api/admin/users',
    CLASSES: '/api/admin/classes',
    SECTIONS: '/api/admin/sections',
    DASHBOARD: '/api/admin/dashboard',
  },
  TEACHER: {
    DASHBOARD: '/api/teachers/dashboard',
    STUDENTS: '/api/teachers/students',
    MATERIALS: '/api/teachers/materials',
    EXAMS: '/api/teachers/exams',
    EXAM_GENERATE: '/api/teachers/exams/generate',
  },
  STUDENT: {
    DASHBOARD: '/api/students/dashboard',
    EXAMS: '/api/students/exams',
    RESULTS: '/api/students/results',
    MATERIALS: '/api/students/materials',
  },
} as const;

