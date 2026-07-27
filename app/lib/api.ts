import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from './constants';
import { ApiError } from '@/types/common';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and handle FormData
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Remove Content-Type header for FormData - browser will set it with boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only handle 401 for API requests, not for non-existent routes (404)
    // Also skip token refresh for auth endpoints to avoid infinite loops
    const isAuthEndpoint = originalRequest?.url?.includes('/api/auth/');
    const is404 = error.response?.status === 404;

    // Handle 401 Unauthorized (but not for auth endpoints or 404s)
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint && !is404) {
      originalRequest._retry = true;

      try {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) : null;
        
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token: newRefreshToken } = response.data;

          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
            if (newRefreshToken) {
              localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
            }
          }

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }

          return api(originalRequest);
        }
      } catch (refreshError: any) {
        // Only logout if refresh explicitly fails (not just missing token)
        // Don't clear auth on 404s or network errors
        if (refreshError.response?.status !== 404 && typeof window !== 'undefined') {
          const { useAuthStore } = await import('@/store/auth-store');
          const store = useAuthStore.getState();
          
          // Only clear if we were actually authenticated
          if (store.isAuthenticated) {
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER);
            store.logout();
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API methods
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },
  
  updateProfile: async (profileData: { full_name?: string; email?: string }) => {
    const response = await api.put('/api/auth/profile', profileData);
    return response.data;
  },
  
  deleteAccount: async () => {
    const response = await api.delete('/api/auth/profile');
    return response.data;
  },
  
  loginWithGoogle: async (token: string) => {
    const response = await api.post('/api/auth/google', { token });
    return response.data;
  },
  
  logout: async () => {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) : null;
    if (refreshToken) {
      await api.post('/api/auth/logout', { refresh_token: refreshToken });
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },
  
  refreshToken: async () => {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) : null;
    if (!refreshToken) throw new Error('No refresh token');
    const response = await api.post('/api/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },
  
  forgotPassword: async (email: string) => {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data;
  },
  
  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post('/api/auth/reset-password', { token, new_password: newPassword });
    return response.data;
  },
  
  updateStudentProfile: async (profileData: any) => {
    const response = await api.put('/api/auth/profile/student', profileData);
    return response.data;
  },
};

export const adminApi = {
  getUsers: async (page = 1, limit = 10, role?: string, search?: string) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (role) params.append('role', role);
    if (search) params.append('search', search);
    const response = await api.get(`/api/admin/users?${params}`);
    return response.data;
  },
  
  getUser: async (id: string) => {
    const response = await api.get(`/api/admin/users/${id}`);
    return response.data;
  },
  
  createUser: async (userData: any) => {
    const response = await api.post('/api/admin/users', userData);
    return response.data;
  },
  
  updateUser: async (id: string, userData: any) => {
    const response = await api.put(`/api/admin/users/${id}`, userData);
    return response.data;
  },
  
  deleteUser: async (id: string) => {
    const response = await api.delete(`/api/admin/users/${id}`);
    return response.data;
  },
  
  getDashboard: async () => {
    const response = await api.get('/api/admin/dashboard');
    return response.data;
  },
  
  getClasses: async () => {
    const response = await api.get('/api/admin/classes');
    return response.data;
  },
  
  createClass: async (classData: { name: string; description?: string | null }) => {
    const response = await api.post('/api/admin/classes', classData);
    return response.data;
  },
  
  updateClass: async (id: string, classData: { name?: string; description?: string | null }) => {
    const response = await api.put(`/api/admin/classes/${id}`, classData);
    return response.data;
  },
  
  deleteClass: async (id: string) => {
    const response = await api.delete(`/api/admin/classes/${id}`);
    return response.data;
  },
  
  getSections: async (classId?: string) => {
    const params = classId ? `?class_id=${classId}` : '';
    const response = await api.get(`/api/admin/sections${params}`);
    return response.data; // Returns array directly
  },
  
  createSection: async (classId: string, sectionData: { name: string; description?: string | null }) => {
    const response = await api.post(`/api/admin/classes/${classId}/sections`, sectionData);
    return response.data;
  },
  
  updateSection: async (id: string, sectionData: { name?: string; description?: string | null }) => {
    const response = await api.put(`/api/admin/sections/${id}`, sectionData);
    return response.data;
  },
  
  deleteSection: async (id: string) => {
    const response = await api.delete(`/api/admin/sections/${id}`);
    return response.data;
  },
  
  // Student Registration
  registerStudent: async (studentData: any) => {
    const response = await api.post('/api/admin/students', studentData);
    return response.data;
  },
  
  getStudents: async (page = 1, limit = 10, search?: string, classId?: string, sectionId?: string) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search) params.append('search', search);
    if (classId) params.append('class_id', classId);
    if (sectionId) params.append('section_id', sectionId);
    const response = await api.get(`/api/admin/students?${params}`);
    return response.data;
  },
  
  getStudent: async (id: string) => {
    const response = await api.get(`/api/admin/students/${id}`);
    return response.data;
  },
  
  updateStudentProfile: async (studentId: string, profileData: any) => {
    const response = await api.put(`/api/admin/students/${studentId}/profile`, profileData);
    return response.data;
  },
  
  changeStudentPassword: async (studentId: string, passwordData: { current_password: string; new_password: string }) => {
    const response = await api.put(`/api/admin/students/${studentId}/password`, passwordData);
    return response.data;
  },
  
  bulkCreateUsers: async (usersData: any) => {
    const response = await api.post('/api/admin/users/bulk', usersData);
    return response.data;
  },
  
  assignTeacherToClass: async (classId: string, teacherId: string) => {
    const response = await api.post(`/api/admin/classes/${classId}/teachers/${teacherId}`);
    return response.data;
  },
  
  removeTeacherFromClass: async (classId: string, teacherId: string) => {
    const response = await api.delete(`/api/admin/classes/${classId}/teachers/${teacherId}`);
    return response.data;
  },
  
  getClass: async (id: string) => {
    const response = await api.get(`/api/admin/classes/${id}`);
    return response.data;
  },
  
  getSection: async (id: string) => {
    const response = await api.get(`/api/admin/sections/${id}`);
    return response.data;
  },
  
  getStudentsByClassSection: async (classId: string, sectionId: string) => {
    const response = await api.get(`/api/admin/classes/${classId}/sections/${sectionId}/students`);
    return response.data;
  },
};

export const teacherApi = {
  getDashboard: async () => {
    const response = await api.get('/api/teachers/dashboard');
    return response.data;
  },
  
  getClasses: async () => {
    const response = await api.get('/api/teachers/classes');
    return response.data;
  },
  
  getStudents: async (classId?: string, sectionId?: string, search?: string, page = 1, limit = 10) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (classId) params.append('class_id', classId);
    if (sectionId) params.append('section_id', sectionId);
    if (search) params.append('search', search);
    const response = await api.get(`/api/teachers/students?${params}`);
    return response.data;
  },
  
  registerStudent: async (studentData: any) => {
    const response = await api.post('/api/teachers/students', studentData);
    return response.data;
  },
  
  getStudent: async (id: string) => {
    const response = await api.get(`/api/teachers/students/${id}`);
    return response.data;
  },
  
  updateStudentProfile: async (studentId: string, profileData: any) => {
    const response = await api.put(`/api/teachers/students/${studentId}/profile`, profileData);
    return response.data;
  },
  
  deleteStudent: async (id: string) => {
    const response = await api.delete(`/api/teachers/students/${id}`);
    return response.data;
  },
  
  getMaterials: async (classId?: string, page = 1, limit = 10, search?: string) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (classId) params.append('class_id', classId);
    if (search) params.append('search', search);
    const response = await api.get(`/api/teachers/materials?${params}`);
    return response.data;
  },
  
  uploadMaterial: async (formData: FormData) => {
    // Don't set Content-Type header - browser will set it automatically with boundary for multipart/form-data
    const response = await api.post('/api/teachers/materials', formData);
    return response.data;
  },
  
  getMaterial: async (id: string) => {
    const response = await api.get(`/api/teachers/materials/${id}`);
    return response.data;
  },
  
  downloadMaterial: async (id: string) => {
    const response = await api.get(`/api/teachers/materials/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
  
  updateMaterial: async (id: string, materialData: { title?: string; description?: string }) => {
    const response = await api.put(`/api/teachers/materials/${id}`, materialData);
    return response.data;
  },
  
  deleteMaterial: async (id: string) => {
    const response = await api.delete(`/api/teachers/materials/${id}`);
    return response.data;
  },
  
  getExams: async (classId?: string, isPublished?: boolean, page = 1, limit = 10) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (classId) params.append('class_id', classId);
    if (isPublished !== undefined) params.append('is_published', isPublished.toString());
    const response = await api.get(`/api/teachers/exams?${params}`);
    return response.data;
  },
  
  getExam: async (id: string) => {
    const response = await api.get(`/api/teachers/exams/${id}`);
    return response.data;
  },
  
  createExam: async (examData: any) => {
    const response = await api.post('/api/teachers/exams', examData);
    return response.data;
  },
  
  generateExam: async (examData: any) => {
    const response = await api.post('/api/teachers/exams/generate', examData);
    return response.data;
  },
  
  updateExam: async (id: string, examData: any) => {
    const response = await api.put(`/api/teachers/exams/${id}`, examData);
    return response.data;
  },
  
  publishExam: async (id: string, isPublished: boolean) => {
    const formData = new FormData();
    formData.append('is_published', isPublished.toString());
    const response = await api.post(`/api/teachers/exams/${id}/publish`, formData);
    return response.data;
  },
  
  deleteExam: async (id: string) => {
    const response = await api.delete(`/api/teachers/exams/${id}`);
    return response.data;
  },
  
  getResults: async (examId?: string, page = 1, limit = 10) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (examId) params.append('exam_id', examId);
    const response = await api.get(`/api/teachers/results?${params}`);
    return response.data;
  },
};

export const studentApi = {
  getDashboard: async () => {
    const response = await api.get('/api/students/dashboard');
    return response.data;
  },
  
  getExams: async (status?: string, page = 1, limit = 10) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (status) params.append('status', status);
    const response = await api.get(`/api/students/exams?${params}`);
    return response.data;
  },
  
  startExam: async (examId: string) => {
    const response = await api.post(`/api/students/exams/${examId}/start`);
    return response.data;
  },
  
  submitExam: async (examId: string, attemptId: string, responses: any[]) => {
    const response = await api.post(`/api/students/exams/${examId}/attempts/${attemptId}/submit`, {
      responses,
    });
    return response.data;
  },
  
  getResults: async (examId?: string, page = 1, limit = 10) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (examId) params.append('exam_id', examId);
    const response = await api.get(`/api/students/results?${params}`);
    return response.data;
  },
  
  getMaterials: async (classId?: string, page = 1, limit = 10) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (classId) params.append('class_id', classId);
    const response = await api.get(`/api/students/materials?${params}`);
    return response.data;
  },
  
  getMaterial: async (id: string) => {
    const response = await api.get(`/api/students/materials/${id}`);
    return response.data;
  },
  
  viewMaterial: async (id: string) => {
    const response = await api.get(`/api/students/materials/${id}/view`, {
      responseType: 'blob',
    });
    return response.data;
  },
  
  downloadMaterial: async (id: string) => {
    const response = await api.get(`/api/students/materials/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
  
  getExam: async (id: string) => {
    const response = await api.get(`/api/students/exams/${id}`);
    return response.data;
  },
  
  getAttempt: async (examId: string, attemptId: string) => {
    const response = await api.get(`/api/students/exams/${examId}/attempts/${attemptId}`);
    return response.data;
  },
  
  updateAttemptResponses: async (examId: string, attemptId: string, responses: any[]) => {
    const response = await api.put(`/api/students/exams/${examId}/attempts/${attemptId}/responses`, {
      responses,
    });
    return response.data;
  },
  
  getResult: async (id: string) => {
    const response = await api.get(`/api/students/results/${id}`);
    return response.data;
  },
  
  recalculateResult: async (examId: string, attemptId: string) => {
    const response = await api.post(`/api/students/exams/${examId}/attempts/${attemptId}/recalculate`);
    return response.data;
  },
  
  getAttemptResponses: async (examId: string, attemptId: string) => {
    const response = await api.get(`/api/students/exams/${examId}/attempts/${attemptId}/responses`);
    return response.data;
  },
};

export default api;

