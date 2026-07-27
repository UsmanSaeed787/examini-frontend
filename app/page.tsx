'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user, initialized, initialize } = useAuthStore();
  
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);
  
  useEffect(() => {
    if (initialized) {
      if (isAuthenticated && user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [initialized, isAuthenticated, user, router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );
}
