'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { teacherApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { SkeletonDashboard } from '@/components/ui/skeleton';

export default function TeacherResultsPage() {
  const router = useRouter();
  const { isAuthenticated, user, initialized, initialize } = useAuthStore();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

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
      if (user.role !== 'teacher') {
        router.push('/dashboard');
        return;
      }
    }
  }, [initialized, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'teacher') {
      fetchResults();
    }
  }, [isAuthenticated, user, page]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const data = await teacherApi.getResults(undefined, page, limit);
      setResults(data.items || []);
      setTotal(data.total || 0);
    } catch (error: any) {
      console.error('Results error:', error);
      toast.error(error.response?.data?.detail || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter(result => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      result.exam_name?.toLowerCase().includes(search) ||
      result.student_name?.toLowerCase().includes(search) ||
      result.student_email?.toLowerCase().includes(search)
    );
  });

  if (!initialized || !isAuthenticated || !user || user.role !== 'teacher') {
    return <SkeletonDashboard />;
  }

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Exam Results</h1>
            <p className="text-gray-400 mt-1">View student exam results</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-4 sm:p-6 mb-6">
          <Input
            type="text"
            placeholder="Search by exam name, student name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Results Table */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-6">
              <div className="hidden md:block">
                <div className="grid grid-cols-6 gap-4 pb-3 border-b border-gray-700 mb-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-700 rounded animate-shimmer"></div>
                  ))}
                </div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="grid grid-cols-6 gap-4 py-3 border-b border-gray-700 last:border-0">
                    <div className="h-4 bg-gray-700 rounded w-3/4 animate-shimmer"></div>
                    <div className="h-4 bg-gray-700 rounded w-2/3 animate-shimmer"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2 animate-shimmer"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2 animate-shimmer"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2 animate-shimmer"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2 animate-shimmer"></div>
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
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-300 text-lg font-medium mb-2">No results found</p>
              <p className="text-gray-400 text-sm">Results will appear here after students submit exams</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700 bg-gray-800">
                      <th className="text-left py-3 px-4 font-semibold text-gray-300">Exam</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-300">Student</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-300">Score</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-300">Percentage</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-300">Grade</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-300">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((result) => (
                      <tr key={result.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                        <td className="py-3 px-4 text-white font-medium">{result.exam_name || 'Untitled Exam'}</td>
                        <td className="py-3 px-4">
                          <div className="text-white">{result.student_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-400">{result.student_email}</div>
                        </td>
                        <td className="py-3 px-4 text-white">
                          {result.total_score?.toFixed(1) || 0} / {result.max_score?.toFixed(1) || 0}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                            (result.percentage || 0) >= 70 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            (result.percentage || 0) >= 50 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {result.percentage?.toFixed(1) || 0}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-full text-sm font-semibold bg-gray-700 text-gray-300 border border-gray-600">
                            {result.grade || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          {result.created_at ? new Date(result.created_at).toLocaleString() : '-'}
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
                      <h3 className="font-semibold text-white mb-1">{result.exam_name || 'Untitled Exam'}</h3>
                      <div className="text-sm text-gray-400">
                        <div>{result.student_name || 'Unknown'}</div>
                        <div>{result.student_email}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-sm text-gray-300">
                        Score: <span className="text-white font-medium">{result.total_score?.toFixed(1) || 0} / {result.max_score?.toFixed(1) || 0}</span>
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (result.percentage || 0) >= 70 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        (result.percentage || 0) >= 50 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {result.percentage?.toFixed(1) || 0}%
                      </span>
                      {result.grade && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-700 text-gray-300 border border-gray-600">
                          {result.grade}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 pt-3 border-t border-gray-700">
                      {result.created_at ? new Date(result.created_at).toLocaleString() : '-'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {total > limit && (
                <div className="px-4 sm:px-6 py-4 border-t border-gray-700">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-gray-300 text-center sm:text-left">
                      Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2"
                      >
                        Previous
                      </Button>
                      <div className="sm:hidden text-sm text-gray-300">
                        Page {page} of {Math.ceil(total / limit)}
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                        disabled={page * limit >= total}
                        className="px-4 py-2"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

