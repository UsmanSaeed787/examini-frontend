'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/auth-store';

/**
 * Client-only: the wizard restores its draft from sessionStorage on first
 * render, and there is nothing to gain from server-rendering a form that sits
 * behind an auth guard.
 */
const AssessmentWizard = dynamic(
  () => import('@/components/assessments/wizard/assessment-wizard').then((m) => m.AssessmentWizard),
  {
    ssr: false,
    loading: () => (
      <div className="max-w-3xl space-y-4">
        <Skeleton variant="rectangular" width="100%" height={40} />
        <Skeleton variant="rectangular" width="100%" height={280} />
      </div>
    ),
  }
);

export default function NewAssessmentPage() {
  const router = useRouter();
  const { isAuthenticated, user, initialized, initialize } = useAuthStore();

  useEffect(() => {
    if (!initialized) initialize();
  }, [initialized, initialize]);

  useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated || !user) {
      router.push('/login');
    } else if (user.role !== 'teacher') {
      router.push('/dashboard');
    }
  }, [initialized, isAuthenticated, user, router]);

  return (
    <DashboardLayout role="teacher">
      <div className="p-4 sm:p-6">
        <Link
          href="/teacher/assessments"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          All assessments
        </Link>

        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white">New assessment</h1>
          <p className="text-sm text-gray-400 mt-1">
            Brief the AI on what you want to assess. It will analyse your material and propose a
            plan before writing anything.
          </p>
        </div>

        <AssessmentWizard />
      </div>
    </DashboardLayout>
  );
}
