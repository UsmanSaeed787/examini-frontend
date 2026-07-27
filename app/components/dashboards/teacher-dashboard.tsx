'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { teacherApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import DashboardLayout from '@/components/layouts/dashboard-layout';

interface DashboardStats {
  total_classes?: number;
  total_students?: number;
  total_exams?: number;
  total_materials?: number;
  recent_exams?: Array<{
    id: string;
    title: string;
    is_published: boolean;
    created_at: string;
  }>;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await teacherApi.getDashboard();
      console.log('Dashboard stats received:', data);
      setStats(data);
    } catch (error: any) {
      console.error('Dashboard error details:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'My Classes',
      value: stats?.total_classes ?? 0,
      icon: '🏫',
      color: 'from-primary-500 to-primary-600',
      href: '/teacher/students',
    },
    {
      title: 'Students',
      value: stats?.total_students ?? 0,
      icon: '👨‍🎓',
      color: 'from-primary-600 to-primary-700',
      href: '/teacher/students',
    },
    {
      title: 'Active Exams',
      value: stats?.total_exams ?? 0,
      icon: '📝',
      color: 'from-primary-500 to-primary-600',
      href: '/teacher/exams',
    },
    {
      title: 'Materials',
      value: stats?.total_materials ?? 0,
      icon: '📄',
      color: 'from-primary-500 to-primary-600',
      href: '/teacher/materials',
    },
  ];

  const quickActions = [
    {
      title: 'Manage Students',
      description: 'View and manage your students',
      href: '/teacher/students',
      icon: '👥',
    },
    {
      title: 'Create Exam',
      description: 'Create a new exam',
      href: '/teacher/exams?action=create',
      icon: '➕',
    },
    {
      title: 'Upload Materials',
      description: 'Upload class materials',
      href: '/teacher/materials?action=upload',
      icon: '📄',
    },
    {
      title: 'View Exams',
      description: 'Manage your exams',
      href: '/teacher/exams',
      icon: '📚',
    },
  ];

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 rounded-xl shadow-xl p-6 text-white border border-primary-400/20">
          <h1 className="text-3xl font-bold mb-2">Teacher Dashboard</h1>
          <p className="text-white/90">Manage your classes, students, and exams</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div
              key={index}
              onClick={() => stat.href && router.push(stat.href)}
              className={`bg-gradient-to-r ${stat.color} text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-out p-6 cursor-pointer transform translateZ(0) hover:-translate-y-1`}
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
                className="bg-gray-800 border-2 border-gray-600 rounded-xl p-6 text-left hover:border-primary-500 hover:shadow-lg hover:shadow-primary-500/20 transform translateZ(0) hover:-translate-y-1 transition-all duration-300 ease-out group"
              >
                <div className="text-4xl mb-3">{action.icon}</div>
                <h3 className="font-semibold text-lg mb-1 text-white group-hover:text-primary-400">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-400">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Exams */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Recent Exams</h2>
            <button
              onClick={() => router.push('/teacher/exams')}
              className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              View All →
            </button>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : stats?.recent_exams && stats.recent_exams.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_exams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-4 border border-gray-700 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/teacher/exams?id=${exam.id}`)}
                >
                  <div>
                    <h3 className="font-semibold text-white">{exam.title}</h3>
                    <p className="text-sm text-gray-400">
                      {new Date(exam.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      exam.is_published
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-700 text-gray-300 border border-gray-600'
                    }`}
                  >
                    {exam.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No recent exams. Create your first exam!</p>
              <button
                onClick={() => router.push('/teacher/exams?action=create')}
                className="mt-4 text-primary-400 hover:text-primary-300 font-medium transition-colors"
              >
                Create Exam →
              </button>
            </div>
          )}
        </div>

        {/* Results Section */}
        <ResultsSection />
      </div>
    </DashboardLayout>
  );
}

function ResultsSection() {
  const router = useRouter();
  const [results, setResults] = useState<any[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setResultsLoading(true);
      const data = await teacherApi.getResults(undefined, 1, 5); // Get first 5 most recent
      // Results are already sorted by backend (created_at DESC), so first 5 are most recent
      setResults(data.items || []);
    } catch (error: any) {
      console.error('Results error:', error);
      toast.error('Failed to load results');
    } finally {
      setResultsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Exam Results</h2>
        <button
          onClick={() => router.push('/teacher/results')}
          className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
        >
          View All →
        </button>
      </div>
      {resultsLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-gray-700 rounded-lg animate-pulse">
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-700 rounded w-3/4 animate-shimmer"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2 animate-shimmer"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 bg-gray-700 rounded w-16 animate-shimmer"></div>
                <div className="h-6 bg-gray-700 rounded w-12 animate-shimmer"></div>
              </div>
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-3">
          {results.map((result) => (
            <div
              key={result.id}
              className="flex items-center justify-between p-4 border border-gray-700 rounded-xl hover:bg-gray-700/50 transition-all card-glow hover:border-primary-500"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-white">{result.exam_name || 'Untitled Exam'}</h3>
                <p className="text-sm text-gray-400">
                  {result.student_name || result.student_email} • {result.total_score?.toFixed(1) || 0} / {result.max_score?.toFixed(1) || 0}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  (result.percentage || 0) >= 70 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  (result.percentage || 0) >= 50 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                  'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {result.percentage?.toFixed(1) || 0}%
                </span>
                {result.grade && (
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-700 text-gray-300 border border-gray-600">
                    {result.grade}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p>No results yet. Results will appear here after students submit exams.</p>
        </div>
      )}
    </div>
  );
}
