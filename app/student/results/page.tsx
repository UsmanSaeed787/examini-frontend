'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { studentApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { SkeletonDashboard } from '@/components/ui/skeleton';

export default function StudentResultsPage() {
  const router = useRouter();
  const { isAuthenticated, user, initialized, initialize } = useAuthStore();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
      fetchResults();
    }
  }, [isAuthenticated, user]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const data = await studentApi.getResults();
      setResults(data.items || []);
    } catch (error: any) {
      toast.error('Failed to load results');
      console.error('Results error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter(result => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      result.exam_name?.toLowerCase().includes(search) ||
      result.exam?.title?.toLowerCase().includes(search)
    );
  });

  if (!initialized || !isAuthenticated || !user || user.role !== 'student') {
    return <SkeletonDashboard />;
  }

  return (
    <DashboardLayout role="student">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">My Results</h1>
            <p className="text-gray-400 mt-1">View your exam results</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-4 sm:p-6 mb-6">
          <Input
            type="text"
            placeholder="Search results..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Results Table */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-6">
              <div className="hidden md:block">
                <div className="grid grid-cols-5 gap-4 pb-3 border-b border-gray-700 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-700 rounded animate-shimmer"></div>
                  ))}
                </div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="grid grid-cols-5 gap-4 py-3 border-b border-gray-700 last:border-0">
                    <div className="h-4 bg-gray-700 rounded w-3/4 animate-shimmer"></div>
                    <div className="h-4 bg-gray-700 rounded w-2/3 animate-shimmer"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2 animate-shimmer"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2 animate-shimmer"></div>
                    <div className="h-8 bg-gray-700 rounded w-24 animate-shimmer"></div>
                  </div>
                ))}
              </div>
              <div className="md:hidden space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg border border-gray-700 p-4 shadow-sm animate-pulse">
                    <div className="h-5 bg-gray-700 rounded w-3/4 mb-2 animate-shimmer"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2 mb-3 animate-shimmer"></div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-700 rounded w-16 animate-shimmer"></div>
                      <div className="h-6 bg-gray-700 rounded w-12 animate-shimmer"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-300 text-lg font-medium mb-2">
                {searchTerm ? 'No results found' : 'No results yet'}
              </p>
              <p className="text-gray-400 text-sm">
                {searchTerm ? 'Try adjusting your search' : 'Complete exams to see your results here'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700 bg-gray-800">
                      <th className="text-left py-3 px-4 font-semibold text-gray-300">Exam</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-300">Score</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-300">Percentage</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-300">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((result) => (
                      <tr key={result.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                        <td className="py-3 px-4 text-white font-medium">{result.exam_name || result.exam?.title || 'Untitled Exam'}</td>
                        <td className="py-3 px-4 text-white">{result.total_score !== undefined ? result.total_score.toFixed(1) : 0} / {result.max_score !== undefined ? result.max_score.toFixed(1) : 0}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                            (result.percentage || 0) >= 70 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            (result.percentage || 0) >= 50 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {result.percentage !== undefined ? result.percentage.toFixed(1) : 0}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{result.created_at ? new Date(result.created_at).toLocaleString() : '-'}</td>
                        <td className="py-3 px-4">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              // Use exam_id if available, otherwise use result.id
                              if (result.exam_id) {
                                router.push(`/student/exams/${result.exam_id}/result?resultId=${result.id}`);
                              } else {
                                router.push(`/student/results/${result.id}`);
                              }
                            }}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 p-4">
                {filteredResults.map((result) => (
                  <div key={result.id} className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
                    <div className="mb-3">
                      <h3 className="font-semibold text-white mb-1">{result.exam_name || result.exam?.title || 'Untitled Exam'}</h3>
                      <div className="text-sm text-gray-400 mb-2">
                        Score: <span className="text-white font-medium">{result.total_score !== undefined ? result.total_score.toFixed(1) : 0} / {result.max_score !== undefined ? result.max_score.toFixed(1) : 0}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (result.percentage || 0) >= 70 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        (result.percentage || 0) >= 50 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {result.percentage !== undefined ? result.percentage.toFixed(1) : 0}%
                      </span>
                      <span className="text-xs text-gray-400">
                        {result.created_at ? new Date(result.created_at).toLocaleString() : '-'}
                      </span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        if (result.exam_id) {
                          router.push(`/student/exams/${result.exam_id}/result?resultId=${result.id}`);
                        } else {
                          router.push(`/student/results/${result.id}`);
                        }
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

