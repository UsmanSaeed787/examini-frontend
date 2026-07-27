'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { teacherApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { QuestionType } from '@/types/exam';

interface ExamDetail {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  start_date: string | null;
  end_date: string | null;
  is_published: boolean;
  allow_retake: boolean;
  max_attempts: number;
  created_at: string;
  class_id: string;
  questions: Question[];
}

interface Question {
  id: string;
  question_text: string;
  question_type: QuestionType;
  difficulty_level: string | null;
  points: number;
  order_number: number;
  options?: QuestionOption[];
}

interface QuestionOption {
  id: string;
  option_text: string;
  is_correct: boolean;
  order_number: number;
}

export default function TeacherExamDetailPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  const { isAuthenticated, user, initialized, initialize } = useAuthStore();
  
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);

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
      fetchClasses();
      loadExam();
    }
  }, [isAuthenticated, user, examId]);

  const fetchClasses = async () => {
    try {
      const data = await teacherApi.getClasses();
      setClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadExam = async () => {
    try {
      setLoading(true);
      const examData = await teacherApi.getExam(examId);
      setExam(examData);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to load exam');
      router.push('/teacher/exams');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (isPublished: boolean) => {
    try {
      await teacherApi.publishExam(examId, isPublished);
      toast.success(isPublished ? 'Exam published successfully' : 'Exam unpublished successfully');
      loadExam();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update exam status');
    }
  };

  const getClassName = (classId: string) => {
    return classes.find(c => c.id === classId)?.name || 'Unknown';
  };

  if (!initialized || !isAuthenticated || !user || user.role !== 'teacher') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  if (loading || !exam) {
    return (
      <DashboardLayout role="teacher">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <Skeleton variant="text" width={300} height={32} className="mb-2" />
              <Skeleton variant="text" width={200} height={20} />
            </div>
            <div className="flex gap-2">
              <Skeleton variant="rectangular" width={80} height={40} />
              <Skeleton variant="rectangular" width={100} height={40} />
              <Skeleton variant="rectangular" width={80} height={40} />
            </div>
          </div>
          <SkeletonCard>
            <Skeleton variant="text" width={200} height={24} className="mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(9)].map((_, i) => (
                <div key={i}>
                  <Skeleton variant="text" width={100} height={16} className="mb-2" />
                  <Skeleton variant="text" width={150} height={20} />
                </div>
              ))}
            </div>
          </SkeletonCard>
          <SkeletonCard>
            <Skeleton variant="text" width={200} height={24} className="mb-4" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border border-gray-700 rounded-lg p-4">
                  <Skeleton variant="text" width="100%" height={20} className="mb-2" />
                  <Skeleton variant="text" width="80%" height={16} />
                </div>
              ))}
            </div>
          </SkeletonCard>
        </div>
      </DashboardLayout>
    );
  }

  const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">{exam.title}</h1>
            {exam.description && (
              <p className="text-gray-400 mt-1">{exam.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/teacher/exams/${examId}/edit`)}>
              Edit
            </Button>
            <Button
              variant={exam.is_published ? 'outline' : 'primary'}
              onClick={() => handlePublish(!exam.is_published)}
            >
              {exam.is_published ? 'Unpublish' : 'Publish'}
            </Button>
            <Button variant="outline" onClick={() => router.push('/teacher/exams')}>
              Back
            </Button>
          </div>
        </div>

        {/* Exam Info */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Exam Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-400">Class:</span>
              <p className="font-medium text-white">{getClassName(exam.class_id)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-400">Duration:</span>
              <p className="font-medium text-white">{exam.duration_minutes} minutes</p>
            </div>
            <div>
              <span className="text-sm text-gray-400">Start Date:</span>
              <p className="font-medium text-white">
                {exam.start_date ? new Date(exam.start_date).toLocaleString() : 'Not set'}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-400">End Date:</span>
              <p className="font-medium text-white">
                {exam.end_date ? new Date(exam.end_date).toLocaleString() : 'Not set'}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-400">Max Attempts:</span>
              <p className="font-medium text-white">{exam.max_attempts}</p>
            </div>
            <div>
              <span className="text-sm text-gray-400">Allow Retake:</span>
              <p className="font-medium text-white">{exam.allow_retake ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-400">Status:</span>
              <p className="font-medium text-white">
                <span className={`px-2 py-1 rounded-full text-sm ${
                  exam.is_published
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-gray-700 text-gray-300 border border-gray-600'
                }`}>
                  {exam.is_published ? 'Published' : 'Draft'}
                </span>
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-400">Total Questions:</span>
              <p className="font-medium text-white">{exam.questions.length}</p>
            </div>
            <div>
              <span className="text-sm text-gray-400">Total Points:</span>
              <p className="font-medium text-white">{totalPoints.toFixed(1)}</p>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Questions ({exam.questions.length})</h2>
          <div className="space-y-6">
            {exam.questions.map((question, idx) => (
              <div key={question.id} className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-white">
                        Question {idx + 1}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded border border-gray-600">
                        {question.question_type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded border border-gray-600">
                        {question.difficulty_level || 'N/A'}
                      </span>
                      <span className="text-xs font-medium text-primary-400">
                        {question.points} point{question.points !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-white font-medium">{question.question_text}</p>
                  </div>
                </div>

                {question.options && question.options.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {question.options.map((option, optIdx) => (
                      <div
                        key={option.id}
                        className={`p-3 rounded-lg border-2 ${
                          option.is_correct
                            ? 'border-green-500 bg-green-500/20'
                            : 'border-gray-600 bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {option.is_correct && (
                            <span className="text-green-400 font-bold">✓</span>
                          )}
                          <span className={option.is_correct ? 'text-white' : 'text-gray-300'}>{option.option_text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

