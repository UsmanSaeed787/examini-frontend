'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { studentApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import ExamCountdown from '@/components/exams/exam-countdown';
import { Button } from '@/components/ui/button';

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

interface DashboardStats {
  available_exams?: number;
  completed_exams?: number;
  total_materials?: number;
  upcoming_exams?: any[];
}

export default function StudentDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await studentApi.getDashboard();
      setStats(data);
    } catch (error: any) {
      toast.error('Failed to load dashboard statistics');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Available Exams',
      value: stats?.available_exams ?? 0,
      icon: '📝',
      href: '/student/exams?status=available',
    },
    {
      title: 'Completed',
      value: stats?.completed_exams ?? 0,
      icon: '✅',
      href: '/student/results',
    },
    {
      title: 'Materials',
      value: stats?.total_materials ?? 0,
      icon: '📚',
      href: '/student/materials',
    },
  ];

  const quickActions = [
    {
      title: 'Take Exam',
      description: 'Start a new exam',
      href: '/student/exams?status=available',
      icon: '✏️',
    },
    {
      title: 'View Results',
      description: 'Check your exam results',
      href: '/student/results',
      icon: '📊',
    },
    {
      title: 'Download Materials',
      description: 'Access class materials',
      href: '/student/materials',
      icon: '📥',
    },
    {
      title: 'My Exams',
      description: 'View all exams',
      href: '/student/exams',
      icon: '📋',
    },
  ];

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 rounded-xl shadow-xl p-6 text-white border border-primary-400/20">
          <h1 className="text-3xl font-bold mb-2">Student Dashboard</h1>
          <p className="text-white/90">Track your exams and access materials</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <div
              key={index}
              onClick={() => stat.href && router.push(stat.href)}
              className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 text-white rounded-xl shadow-lg hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300 ease-out p-6 cursor-pointer transform translateZ(0) hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm mb-2">{stat.title}</p>
                  <p className="text-4xl font-bold">
                    {loading ? (
                      <span className="inline-block w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      stat.value.toLocaleString()
                    )}
                  </p>
                </div>
                <div className="text-5xl opacity-80">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => router.push(action.href)}
                className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 text-white rounded-xl p-6 text-left shadow-md hover:shadow-lg hover:shadow-primary-500/30 transform translateZ(0) hover:-translate-y-1 transition-all duration-300 ease-out"
              >
                <div className="text-4xl mb-3">{action.icon}</div>
                <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
                <p className="text-sm text-white/90">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming Exams */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Upcoming Exams</h2>
            <button
              onClick={() => router.push('/student/exams')}
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              View All →
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border border-gray-700 rounded-lg p-4 bg-gray-800/50 animate-pulse">
                  <div className="h-5 bg-gray-700 rounded w-3/4 mb-2 animate-shimmer"></div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 bg-gray-700 rounded w-1/2 animate-shimmer"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/4 animate-shimmer"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : stats?.upcoming_exams && stats.upcoming_exams.length > 0 ? (
            <div className="space-y-3">
              {stats.upcoming_exams.map((exam: any) => {
                // UTC time - 5 hours, then compare with current time
                const now = Date.now();
                const startTime = exam.start_date ? new Date(exam.start_date).getTime() - (5 * 60 * 60 * 1000) : null;
                const endTime = exam.end_date ? new Date(exam.end_date).getTime() - (5 * 60 * 60 * 1000) : null;
                const isStarted = startTime ? startTime <= now : false;
                const canStart = isStarted && (!endTime || endTime >= now);

                return (
                  <div
                    key={exam.id}
                    className="border border-gray-700 rounded-lg p-4 hover:shadow-md hover:bg-gray-700/30 transition-all bg-gray-800/30"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-white mb-1">{exam.title}</h3>
                        {exam.description && (
                          <p className="text-sm text-gray-400 mb-2 line-clamp-2">{exam.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-xs text-gray-400 mb-3">
                          {exam.class_name && (
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Class:</span> {exam.class_name}
                            </span>
                          )}
                          {exam.duration_minutes && (
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Duration:</span> {exam.duration_minutes} min
                            </span>
                          )}
                          {exam.start_date && (
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Starts:</span>{' '}
                              {formatExamDateTime(exam.start_date)}
                            </span>
                          )}
                          {exam.end_date && (
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Ends:</span>{' '}
                              {formatExamDateTime(exam.end_date)}
                            </span>
                          )}
                        </div>
                        <ExamCountdown
                          startDate={exam.start_date}
                          endDate={exam.end_date}
                          durationMinutes={exam.duration_minutes}
                        />
                      </div>
                      <div className="flex-shrink-0">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={!canStart}
                          onClick={() => {
                            if (canStart) {
                              router.push(`/student/exams/${exam.id}`);
                            }
                          }}
                          className={!canStart ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          {!isStarted ? 'Coming Soon' : (endTime && endTime < now ? 'Expired' : 'Take Exam')}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No upcoming exams at the moment</p>
            </div>
            )}
        </div>
      </div>
    </DashboardLayout>
  );
}
