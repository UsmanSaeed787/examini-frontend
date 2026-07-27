'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { studentApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import ExamCountdown from '@/components/exams/exam-countdown';
import { SkeletonDashboard } from '@/components/ui/skeleton';

// Format exam date/time to show the exact time from database (UTC)
function formatExamDateTime(dateString: string): string {
  const date = new Date(dateString);
  // Get UTC components to show the actual database time
  const year = date.getUTCFullYear();
  const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  
  return `${month} ${day}, ${year}, ${displayHours}:${displayMinutes} ${ampm} UTC`;
}

export default function StudentExamsPage() {
  const router = useRouter();
  const { isAuthenticated, user, initialized, initialize } = useAuthStore();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed'>('all');
  const [error, setError] = useState<string | null>(null);

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
    if (isAuthenticated && user?.role === 'student') {
      fetchExams();
    }
  }, [isAuthenticated, user, filter]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError(null);
      // When filter is "all", pass undefined to get ALL exams for student's grade
      // When filter is "completed", pass "completed" to get only completed exams
      const status = filter === 'all' ? undefined : filter;
      const data = await studentApi.getExams(status);
      console.log('Exams API response:', data); // Debug log
      setExams(data.items || []);
      if (data.items && data.items.length === 0 && data.total === 0) {
        if (filter === 'completed') {
          setError('You have not completed any exams yet.');
        } else {
          setError('No exams available for your grade. Make sure you are enrolled in a class and that your teacher has published exams.');
        }
      }
    } catch (error: any) {
      console.error('Exams error details:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.error?.message || error.message || 'Failed to load exams';
      setError(errorMessage);
      
      // Check if it's a network error
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        setError('Cannot connect to server. Please make sure the backend is running on http://localhost:8000');
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!initialized || !isAuthenticated || !user || user.role !== 'student') {
    return <SkeletonDashboard />;
  }

  return (
    <DashboardLayout role="student">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Available Exams</h1>
            <p className="text-gray-400 mt-1">View and take exams</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-4 sm:p-6">
          <div className="mb-6 flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
            >
              All Exams
            </Button>
            <Button
              variant={filter === 'completed' ? 'primary' : 'outline'}
              onClick={() => setFilter('completed')}
              size="sm"
            >
              Completed
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border border-gray-700 rounded-lg p-5 bg-gray-800/50 animate-pulse">
                  <div className="h-6 bg-gray-700 rounded w-16 mb-3 animate-shimmer"></div>
                  <div className="h-6 bg-gray-700 rounded w-3/4 mb-2 animate-shimmer"></div>
                  <div className="h-4 bg-gray-700 rounded w-full mb-2 animate-shimmer"></div>
                  <div className="h-4 bg-gray-700 rounded w-2/3 mb-4 animate-shimmer"></div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-gray-700 rounded w-1/2 animate-shimmer"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2 animate-shimmer"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2 animate-shimmer"></div>
                  </div>
                  <div className="h-10 bg-gray-700 rounded animate-shimmer"></div>
                </div>
              ))}
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-300 text-lg font-medium mb-2">
                {filter === 'completed' ? 'No completed exams' : 'No exams available'}
              </p>
              {error ? (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg max-w-md mx-auto">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              ) : (
                <>
                  <p className="text-gray-400 text-sm mb-4">Check back later for new exams</p>
                  <div className="mt-6 p-4 bg-primary-500/20 border border-primary-500/30 rounded-lg max-w-md mx-auto">
                    <p className="text-sm text-primary-300">
                      <strong>Note:</strong> Make sure you are enrolled in a class and that your teacher has published exams for your grade/class.
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map((exam) => (
                <div 
                  key={exam.id} 
                  className="border border-gray-700 rounded-xl p-5 hover:shadow-lg hover:shadow-primary-500/20 transition-all bg-gray-800/50 card-glow hover:border-primary-500"
                >
                  <div className="mb-3">
                    {exam.class_name && (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded-full mb-2">
                        {exam.class_name}
                      </span>
                    )}
                    <h3 className="font-semibold text-lg text-white mb-2">{exam.title || 'Untitled Exam'}</h3>
                    {exam.description && (
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">{exam.description}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="font-medium">Duration:</span>
                      <span>{exam.duration_minutes || 'N/A'} minutes</span>
                    </div>
                    {exam.start_date && (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="font-medium">Starts:</span>
                        <span>{formatExamDateTime(exam.start_date)}</span>
                      </div>
                    )}
                    {exam.end_date && (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="font-medium">Ends:</span>
                        <span>{formatExamDateTime(exam.end_date)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs mb-2">
                      <span className={`px-2 py-1 rounded-full font-medium ${
                        exam.status === 'completed' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : exam.status === 'available'
                          ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {(() => {
                          if (exam.status === 'completed') return 'Completed';
                          if (exam.status === 'available') return 'Available';
                          if (exam.start_date) {
                            // UTC time - 5 hours, then compare with current time
                            const examStart = new Date(exam.start_date).getTime() - (5 * 60 * 60 * 1000);
                            const now = Date.now();
                            return examStart > now ? 'Upcoming' : 'Available';
                          }
                          return 'Available';
                        })()}
                      </span>
                    </div>
                    {(exam.start_date || exam.end_date) && (
                      <ExamCountdown
                        startDate={exam.start_date}
                        endDate={exam.end_date}
                        durationMinutes={exam.duration_minutes}
                      />
                    )}
                  </div>
                  
                  <Button
                    variant="primary"
                    disabled={
                      exam.status === 'completed' 
                        ? false 
                        : exam.start_date 
                        ? (() => {
                            // UTC time - 5 hours, then compare with current time
                            const examStart = new Date(exam.start_date).getTime() - (5 * 60 * 60 * 1000);
                            const now = Date.now();
                            return examStart > now;
                          })()
                        : false
                    }
                    onClick={() => {
                      if (exam.status === 'completed') {
                        router.push(`/student/exams/${exam.id}/result`);
                      } else {
                        router.push(`/student/exams/${exam.id}`);
                      }
                    }}
                    className={`w-full ${
                      exam.status !== 'completed' && 
                      exam.start_date && 
                      (() => {
                        const examStart = new Date(exam.start_date).getTime() - (5 * 60 * 60 * 1000);
                        const now = Date.now();
                        return examStart > now;
                      })()
                        ? 'opacity-50 cursor-not-allowed' 
                        : ''
                    }`}
                  >
                    {exam.status === 'completed' 
                      ? 'View Result' 
                      : exam.start_date && (() => {
                          const examStart = new Date(exam.start_date).getTime() - (5 * 60 * 60 * 1000);
                          const now = Date.now();
                          return examStart > now;
                        })()
                      ? 'Coming Soon'
                      : 'Take Exam'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

