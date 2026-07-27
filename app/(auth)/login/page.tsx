'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { LoginForm } from '@/components/forms/login-form';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, user, initialized, initialize } = useAuthStore();

  useEffect(() => {
    // Initialize auth state from localStorage on mount
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  useEffect(() => {
    // Redirect if already authenticated
    if (initialized && isAuthenticated && user) {
      router.push('/dashboard');
    }
  }, [initialized, isAuthenticated, user, router]);

  // Show minimal loading until initialized
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, don't show login page (will redirect)
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary-500/20 rounded-2xl blur-xl"></div>
              <img 
                src="/Examinilogo.png" 
                alt="Examini Logo" 
                className="h-20 w-20 object-contain relative z-10 drop-shadow-lg"
              />
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white tracking-tight">
            Sign in to your account
          </h2>
          <p className="mt-3 text-base text-gray-400">
            Exam Management System
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
