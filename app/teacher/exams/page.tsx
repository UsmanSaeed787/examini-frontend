'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { NewExamChooser } from '@/components/exams/new-exam-chooser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { teacherApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import DeleteConfirmModal from '@/components/users/delete-confirm-modal';
import DeletingProgressModal from '@/components/exams/deleting-progress-modal';
import { SkeletonDashboard } from '@/components/ui/skeleton';

interface Exam {
  id: string;
  title: string;
  description?: string | null;
  duration_minutes: number;
  is_published: boolean;
  created_at: string;
  class_id: string;
}

interface PaginatedExams {
  items: Exam[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

function TeacherExamsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user, initialized, initialize } = useAuthStore();
  const [exams, setExams] = useState<PaginatedExams | null>(null);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [chooserOpen, setChooserOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [publishedFilter, setPublishedFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
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
    const action = searchParams.get('action');
    if (action === 'create') {
      router.push('/teacher/exams/create');
    } else if (action === 'generate') {
      router.push('/teacher/exams/generate');
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'teacher') {
      fetchClasses();
      fetchExams();
    }
  }, [isAuthenticated, user, currentPage, selectedClassId, publishedFilter]);

  const fetchClasses = async () => {
    try {
      // Get classes from admin-created classes table (assigned to teacher)
      const data = await teacherApi.getClasses();
      setClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const fetchExams = async () => {
    try {
      setLoading(true);
      const data = await teacherApi.getExams(
        selectedClassId || undefined,
        publishedFilter ? publishedFilter === 'true' : undefined,
        currentPage,
        limit
      );
      setExams(data);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (examId: string, isPublished: boolean) => {
    try {
      await teacherApi.publishExam(examId, isPublished);
      toast.success(isPublished ? 'Exam published successfully' : 'Exam unpublished successfully');
      fetchExams();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update exam status');
    }
  };

  const handleDelete = (exam: Exam) => {
    setSelectedExam(exam);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedExam) return;
    
    // Close confirmation modal and show deleting progress
    setIsDeleteModalOpen(false);
    setIsDeleting(true);
    
    try {
      await teacherApi.deleteExam(selectedExam.id);
      toast.success('Exam deleted successfully');
      setSelectedExam(null);
      fetchExams();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to delete exam');
    } finally {
      setIsDeleting(false);
    }
  };

  const getClassName = (classId: string) => {
    return classes.find(c => c.id === classId)?.name || 'Unknown';
  };

  if (!initialized || !isAuthenticated || !user || user.role !== 'teacher') {
    return <SkeletonDashboard />;
  }

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">My Exams</h1>
            <p className="text-gray-400 mt-1">Create and manage exams</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* One AI entry point that explains the choice, instead of two
                buttons named after the machinery behind them. */}
            <Button variant="outline" onClick={() => setChooserOpen(true)}>
              Create with AI
            </Button>
            <Button variant="primary" onClick={() => router.push('/teacher/exams/create')}>
              + Create Exam
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <Input
                type="text"
                placeholder="Search exams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={publishedFilter}
                onChange={(e) => {
                  setPublishedFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Status</option>
                <option value="true">Published</option>
                <option value="false">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Exams List */}
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
                    <div className="h-4 bg-gray-700 rounded w-full animate-shimmer"></div>
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
                    <div className="h-4 bg-gray-700 rounded w-full mb-4 animate-shimmer"></div>
                    <div className="flex gap-2 pt-3 border-t border-gray-700">
                      <div className="h-8 bg-gray-700 rounded flex-1 animate-shimmer"></div>
                      <div className="h-8 bg-gray-700 rounded flex-1 animate-shimmer"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : exams && exams.items.length > 0 ? (
            <>
              {/* Desktop Grid View */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {exams.items.map((exam) => (
                  <div key={exam.id} className="border border-gray-700 rounded-lg p-5 bg-gray-800/50 hover:bg-gray-700/50 hover:border-primary-500 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg text-white flex-1">{exam.title}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          exam.is_published
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-gray-700 text-gray-300 border border-gray-600'
                        }`}
                      >
                        {exam.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    {exam.description && (
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">{exam.description}</p>
                    )}
                    <div className="text-xs text-gray-400 mb-4 space-y-1">
                      <div>Class: {getClassName(exam.class_id)}</div>
                      <div>Duration: {exam.duration_minutes} minutes</div>
                      <div>Created: {new Date(exam.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-gray-700">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/teacher/exams/${exam.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/teacher/exams/${exam.id}/edit`)}
                      >
                        Edit
                      </Button>
                      <button
                        onClick={() => handlePublish(exam.id, !exam.is_published)}
                        className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          exam.is_published
                            ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        {exam.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleDelete(exam)}
                        className="px-3 py-1.5 rounded text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile List View */}
              <div className="md:hidden space-y-4 p-4">
                {exams.items.map((exam) => (
                  <div key={exam.id} className="border border-gray-700 rounded-lg p-5 bg-gray-800/50">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg text-white flex-1">{exam.title}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          exam.is_published
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-gray-700 text-gray-300 border border-gray-600'
                        }`}
                      >
                        {exam.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    {exam.description && (
                      <p className="text-sm text-gray-400 mb-3">{exam.description}</p>
                    )}
                    <div className="text-xs text-gray-400 mb-4 space-y-1">
                      <div>Class: {getClassName(exam.class_id)}</div>
                      <div>Duration: {exam.duration_minutes} minutes</div>
                      <div>Created: {new Date(exam.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-700">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/teacher/exams/${exam.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/teacher/exams/${exam.id}/edit`)}
                      >
                        Edit
                      </Button>
                      <button
                        onClick={() => handlePublish(exam.id, !exam.is_published)}
                        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                          exam.is_published
                            ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        {exam.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleDelete(exam)}
                        className="px-3 py-2 rounded text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {exams.pages > 1 && (
                <div className="px-4 sm:px-6 py-4 border-t border-gray-700">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-gray-300 text-center sm:text-left">
                      Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, exams.total)} of {exams.total} exams
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          variant="primary"
                          size="sm"
                          className="px-4 py-2"
                        >
                          Previous
                        </Button>
                        <div className="hidden sm:flex items-center gap-1">
                          {Array.from({ length: Math.min(5, exams.pages) }, (_, i) => {
                            let pageNum;
                            if (exams.pages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= exams.pages - 2) {
                              pageNum = exams.pages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-2 rounded-lg text-sm ${
                                  currentPage === pageNum
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        <div className="sm:hidden text-sm text-gray-300">
                          Page {currentPage} of {exams.pages}
                        </div>
                        <Button
                          onClick={() => setCurrentPage(prev => Math.min(exams.pages, prev + 1))}
                          disabled={currentPage === exams.pages}
                          variant="primary"
                          size="sm"
                          className="px-4 py-2"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-300 text-lg">No exams yet</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchTerm || selectedClassId || publishedFilter ? 'Try adjusting your filters' : 'Create your first exam to get started'}
              </p>
              {!searchTerm && !selectedClassId && !publishedFilter && (
                <div className="flex gap-3 justify-center mt-4">
                  <Button variant="outline" onClick={() => setChooserOpen(true)}>
                    Create with AI
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => router.push('/teacher/exams/create')}
                  >
                    Create Exam
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && selectedExam && (
          <DeleteConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedExam(null);
            }}
            onConfirm={confirmDelete}
            userName={selectedExam.title}
          />
        )}

        {/* Deleting Progress Modal */}
        {isDeleting && selectedExam && (
          <DeletingProgressModal
            isOpen={isDeleting}
            examTitle={selectedExam.title}
          />
        )}
      </div>
      <NewExamChooser isOpen={chooserOpen} onClose={() => setChooserOpen(false)} />
    </DashboardLayout>
  );
}

/**
 * This page reads a query parameter with `useSearchParams`, which requires a
 * Suspense boundary or the production build cannot prerender it.
 */
export default function TeacherExamsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white">
          <SkeletonDashboard />
        </div>
      }
    >
      <TeacherExamsContent />
    </Suspense>
  );
}
