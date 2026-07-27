'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import dynamic from 'next/dynamic';
import { SkeletonDashboard } from '@/components/ui/skeleton';

// Dynamically import dashboards to avoid chunk loading issues
const AdminDashboard = dynamic(() => import('@/components/dashboards/admin-dashboard'), {
  loading: () => <SkeletonDashboard />,
  ssr: false,
});

const TeacherDashboard = dynamic(() => import('@/components/dashboards/teacher-dashboard'), {
  loading: () => <SkeletonDashboard />,
  ssr: false,
});

const StudentDashboard = dynamic(() => import('@/components/dashboards/student-dashboard'), {
  loading: () => <SkeletonDashboard />,
  ssr: false,
});

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, initialized, initialize } = useAuthStore();

  useEffect(() => {
    // Initialize auth state from localStorage on mount
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  useEffect(() => {
    // Only redirect after initialization
    if (initialized) {
      if (!isAuthenticated || !user) {
        router.push('/login');
        return;
      }
    }
  }, [initialized, isAuthenticated, user, router]);

  // Show loading until initialized
  if (!initialized) {
    return <SkeletonDashboard />;
  }

  if (!isAuthenticated || !user) {
    return <SkeletonDashboard />;
  }

  // Render appropriate dashboard based on user role
  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'student':
      return <StudentDashboard />;
    default:
      router.push('/login');
      return <SkeletonDashboard />;
  }
}
