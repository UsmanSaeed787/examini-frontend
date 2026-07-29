'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Input } from '@/components/ui/input';
import { adminApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { SkeletonDashboard } from '@/components/ui/skeleton';

interface Exam {
  id: string;
  title: string;
  description?: string | null;
  duration_minutes: number;
  is_published: boolean;
  allow_retake?: boolean;
  max_attempts?: number;
  created_at: string;
  class_id: string;
  teacher_id: string;
}

interface PaginatedExams {
  items: Exam[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function AdminExamsPage() {
  const router = useRouter();
  const { isAuthenticated, user, initialized, initialize } = useAuthStore();
  const [exams, setExams] = useState<PaginatedExams | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
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
      if (user.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
    }
  }, [initialized, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchExams();
    }
  }, [isAuthenticated, user, currentPage, publishedFilter]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const isPublishedBool =
        publishedFilter === 'published' ? true : publishedFilter === 'draft' ? false : undefined;
      const data = await adminApi.getExams(currentPage, limit, undefined, isPublishedBool);
      setExams(data);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to load exams');
      console.error('Exams error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!initialized || !isAuthenticated || user?.role !== 'admin') {
    return <SkeletonDashboard />;
  }

  const filteredExams = (exams?.items || []).filter((exam) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      exam.title.toLowerCase().includes(term) ||
      (exam.description && exam.description.toLowerCase().includes(term))
    );
  });

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">All Platform Exams</h1>
            <p className="text-sm text-gray-400 mt-1">
              Overview and management of all exams across the platform
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white placeholder-gray-500"
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              value={publishedFilter}
              onChange={(e) => {
                setPublishedFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Exams Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
          {loading ? (
            <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading exams...</span>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-lg font-medium text-gray-300">No exams found</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm || publishedFilter ? 'Try adjusting your filters' : 'No exams created yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-gray-900/80 text-xs uppercase text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Title</th>
                    <th className="px-6 py-4 font-semibold">Duration</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Attempts</th>
                    <th className="px-6 py-4 font-semibold">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/60">
                  {filteredExams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-gray-700/40 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">
                        <div>
                          <p className="font-semibold text-gray-100">{exam.title}</p>
                          {exam.description && (
                            <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">
                              {exam.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{exam.duration_minutes} mins</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            exam.is_published
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          }`}
                        >
                          {exam.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {exam.allow_retake ? `Max ${exam.max_attempts || 1}` : '1 attempt'}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {new Date(exam.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {exams && exams.pages > 1 && (
            <div className="px-6 py-4 bg-gray-900/60 border-t border-gray-700 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Showing {((currentPage - 1) * limit) + 1} to{' '}
                {Math.min(currentPage * limit, exams.total)} of {exams.total} exams
              </p>
              <div className="flex gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage >= exams.pages}
                  onClick={() => setCurrentPage((p) => Math.min(exams.pages, p + 1))}
                  className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
