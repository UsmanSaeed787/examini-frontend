import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/user';
import { authApi } from '@/lib/api';
import { STORAGE_KEYS } from '@/lib/constants';

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearError: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      initialized: false,
      
      initialize: () => {
        if (typeof window !== 'undefined' && !get().initialized) {
          const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
          const storedAccessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
          const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
          
          if (storedUser && storedAccessToken) {
            try {
              const user = JSON.parse(storedUser);
              set({
                user,
                accessToken: storedAccessToken,
                refreshToken: storedRefreshToken,
                isAuthenticated: true,
                initialized: true,
              });
            } catch (error) {
              console.error('Error parsing stored user:', error);
              set({ initialized: true });
            }
          } else {
            set({ initialized: true });
          }
        }
      },
      
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(email, password);
          const { access_token, refresh_token, user } = response;
          
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
          }
          
          set({
            user,
            accessToken: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
            isLoading: false,
            initialized: true,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.error?.message || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },
      
      loginWithGoogle: async (token: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.loginWithGoogle(token);
          const { access_token, refresh_token, user } = response;
          
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
            localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
          }
          
          set({
            user,
            accessToken: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
            isLoading: false,
            initialized: true,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.error?.message || 'Google login failed',
            isLoading: false,
          });
          throw error;
        }
      },
      
      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
          // Continue with logout even if API call fails
        } finally {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER);
          }
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null,
            initialized: true,
          });
        }
      },
      
      setUser: (user: User) => {
        set({ user });
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        }
      },
      
      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken });
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        }
      },
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
