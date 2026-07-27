'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { teacherApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function EditExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  const { isAuthenticated, user, initialized, initialize } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [exam, setExam] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration_minutes: 60,
    start_date: '',
    end_date: '',
    allow_retake: false,
    max_attempts: 1,
  });

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
    if (isAuthenticated && user?.role === 'teacher' && examId) {
      loadExam();
    }
  }, [isAuthenticated, user, examId]);

  const loadExam = async () => {
    try {
      setLoading(true);
      const examData = await teacherApi.getExam(examId);
      setExam(examData);
      setFormData({
        title: examData.title || '',
        description: examData.description || '',
        duration_minutes: examData.duration_minutes || 60,
        start_date: examData.start_date ? new Date(examData.start_date).toISOString().slice(0, 16) : '',
        end_date: examData.end_date ? new Date(examData.end_date).toISOString().slice(0, 16) : '',
        allow_retake: examData.allow_retake || false,
        max_attempts: examData.max_attempts || 1,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to load exam');
      router.push('/teacher/exams');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      toast.error('Please enter exam title');
      return;
    }

    setLoading(true);
    try {
      await teacherApi.updateExam(examId, formData);
      toast.success('Exam updated successfully');
      router.push(`/teacher/exams/${examId}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update exam');
    } finally {
      setLoading(false);
    }
  };

  if (!initialized || !isAuthenticated || !user || user.role !== 'teacher') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  if (loading && !exam) {
    return (
      <DashboardLayout role="teacher">
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <Skeleton variant="text" width={200} height={32} className="mb-2" />
              <Skeleton variant="text" width={150} height={20} />
            </div>
            <Skeleton variant="rectangular" width={100} height={40} />
          </div>
          <SkeletonCard>
            <div className="space-y-4">
              <div>
                <Skeleton variant="text" width={80} height={20} className="mb-2" />
                <Skeleton variant="rectangular" width="100%" height={40} />
              </div>
              <div>
                <Skeleton variant="text" width={100} height={20} className="mb-2" />
                <Skeleton variant="rectangular" width="100%" height={80} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Skeleton variant="text" width={120} height={20} className="mb-2" />
                  <Skeleton variant="rectangular" width="100%" height={40} />
                </div>
                <div>
                  <Skeleton variant="text" width={100} height={20} className="mb-2" />
                  <Skeleton variant="rectangular" width="100%" height={40} />
                </div>
                <div>
                  <Skeleton variant="text" width={90} height={20} className="mb-2" />
                  <Skeleton variant="rectangular" width="100%" height={40} />
                </div>
                <div>
                  <Skeleton variant="text" width={80} height={20} className="mb-2" />
                  <Skeleton variant="rectangular" width="100%" height={40} />
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <Skeleton variant="rectangular" width={100} height={40} />
                <Skeleton variant="rectangular" width={120} height={40} />
              </div>
            </div>
          </SkeletonCard>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Edit Exam</h1>
            <p className="text-gray-400 mt-1">Update exam settings</p>
          </div>
          <Button variant="outline" onClick={() => router.push(`/teacher/exams/${examId}`)}>
            Cancel
          </Button>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter exam title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter exam description"
              rows={3}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-800 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration (minutes) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Max Attempts</label>
              <Input
                type="number"
                value={formData.max_attempts}
                onChange={(e) => setFormData({ ...formData, max_attempts: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
              <Input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
              <Input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allow_retake"
                checked={formData.allow_retake}
                onChange={(e) => setFormData({ ...formData, allow_retake: e.target.checked })}
                className="mr-2 w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
              />
              <label htmlFor="allow_retake" className="text-sm font-medium text-gray-300">
                Allow Retake
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" onClick={() => router.push(`/teacher/exams/${examId}`)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

