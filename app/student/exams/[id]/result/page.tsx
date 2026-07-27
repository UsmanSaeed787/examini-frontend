'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { studentApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { SkeletonDashboard } from '@/components/ui/skeleton';

interface ExamResult {
  id: string;
  attempt_id: string;
  total_score: number;
  max_score: number;
  percentage: number;
  grade: string | null;
  passed: boolean | null;
  created_at: string;
  exam: {
    id: string;
    title: string;
    description: string | null;
  };
  attempt: {
    id: string;
    started_at: string;
    submitted_at: string;
    time_spent_minutes: number | null;
  };
}

function ExamResultContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const examId = params.id as string;
  const resultId = searchParams.get('resultId');
  const { isAuthenticated, user, initialized, initialize } = useAuthStore();
  
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  useEffect(() => {
    if (initialized) {
      if (!isAuthenticated || !user) {
        router.push('/login');
        return;
      }
      if (user.role !== 'student') {
        router.push('/dashboard');
        return;
      }
    }
  }, [initialized, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'student' && examId) {
      loadResult();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, examId, resultId]);

  const loadResult = async () => {
    try {
      setLoading(true);
      let resultData;
      
      // If resultId is provided, use it directly
      if (resultId) {
        resultData = await studentApi.getResult(resultId);
        setResult(resultData);
      } else {
        // Otherwise, get results and find the one for this exam
        const resultsData = await studentApi.getResults(examId);
        if (resultsData.items && resultsData.items.length > 0) {
          setResult(resultsData.items[0]);
        } else {
          toast.error('Result not found');
          router.push('/student/exams');
        }
      }
    } catch (error: any) {
      console.error('Error loading result:', error);
      toast.error(error.response?.data?.detail || error.response?.data?.error?.message || 'Failed to load result');
      router.push('/student/exams');
    } finally {
      setLoading(false);
    }
  };

  if (!initialized || !isAuthenticated || !user || user.role !== 'student') {
    return <SkeletonDashboard />;
  }

  if (loading || !result) {
    return (
      <DashboardLayout role="student">
        <div className="space-y-6 p-6">
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6 animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-3/4 mb-4 animate-shimmer"></div>
            <div className="h-6 bg-gray-700 rounded w-1/2 mb-6 animate-shimmer"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="h-4 bg-gray-700 rounded w-20 mb-2 animate-shimmer"></div>
                  <div className="h-8 bg-gray-700 rounded w-16 animate-shimmer"></div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-gray-700 rounded-lg bg-gray-800/50">
                  <div className="h-4 bg-gray-700 rounded w-1/2 animate-shimmer"></div>
                  <div className="h-4 bg-gray-700 rounded w-16 animate-shimmer"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Ensure percentage is a number
  const percentage = typeof result.percentage === 'number' ? result.percentage : parseFloat(result.percentage) || 0;
  const getGradeColor = () => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <DashboardLayout role="student">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className={`text-6xl font-bold mb-4 ${
              percentage >= 80 ? 'text-green-400' :
              percentage >= 60 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {percentage.toFixed(1)}%
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{result.exam.title}</h1>
            {result.exam.description && (
              <p className="text-gray-400">{result.exam.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Score</div>
              <div className="text-2xl font-bold text-white">
                {(typeof result.total_score === 'number' ? result.total_score : parseFloat(result.total_score) || 0).toFixed(1)} / {(typeof result.max_score === 'number' ? result.max_score : parseFloat(result.max_score) || 0).toFixed(1)}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Grade</div>
              <div className="text-2xl font-bold text-white">
                {result.grade || 'N/A'}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
              <div className="text-sm text-gray-400 mb-1">Status</div>
              <div className={`text-2xl font-bold ${
                result.passed === true ? 'text-green-400' : 
                result.passed === false ? 'text-red-400' : 
                'text-gray-400'
              }`}>
                {result.passed === true ? 'Passed' : 
                 result.passed === false ? 'Failed' : 
                 'Pending'}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Started At:</span>
              <span className="text-white font-medium">
                {new Date(result.attempt.started_at).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Submitted At:</span>
              <span className="text-white font-medium">
                {new Date(result.attempt.submitted_at).toLocaleString()}
              </span>
            </div>
            {result.attempt.time_spent_minutes && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Time Spent:</span>
                <span className="text-white font-medium">
                  {result.attempt.time_spent_minutes} minutes
                </span>
              </div>
            )}
          </div>

          <div className="mt-8 flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => router.push('/student/exams')}
            >
              Back to Exams
            </Button>
            <Button
              variant="primary"
              onClick={() => router.push('/student/results')}
            >
              View All Results
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

/**
 * This page reads a query parameter with `useSearchParams`, which requires a
 * Suspense boundary or the production build cannot prerender it.
 */
export default function ExamResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white">
          <SkeletonDashboard />
        </div>
      }
    >
      <ExamResultContent />
    </Suspense>
  );
}
