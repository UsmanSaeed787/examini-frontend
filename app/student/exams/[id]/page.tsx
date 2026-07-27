'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import { studentApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { QuestionType } from '@/types/exam';

interface ExamDetail {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  start_date: string | null;
  end_date: string | null;
  questions: Question[];
}

interface Question {
  id: string;
  question_text: string;
  question_type: QuestionType;
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

interface ExamResponse {
  question_id: string;
  answer_text?: string;
  selected_options?: string[];
}

export default function StudentExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  const { isAuthenticated, user, initialized, initialize } = useAuthStore();
  
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [responses, setResponses] = useState<Record<string, ExamResponse>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

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
      loadExam();
    }
  }, [isAuthenticated, user, examId]);

  useEffect(() => {
    if (attempt && exam) {
      const startTime = new Date(attempt.started_at).getTime();
      const durationMs = exam.duration_minutes * 60 * 1000;
      const endTime = startTime + durationMs;
      
      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        setTimeRemaining(remaining);
        
        if (remaining === 0 && attempt.status === 'in_progress') {
          handleAutoSubmit();
        }
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [attempt, exam]);

  const loadExam = async () => {
    try {
      setLoading(true);
      const examData = await studentApi.getExam(examId);
      
      // Check if exam has started (Pakistan timezone: UTC - 5 hours)
      if (examData.start_date) {
        const startDateUTC = new Date(examData.start_date).getTime();
        const startDatePakistan = startDateUTC - (5 * 60 * 60 * 1000); // Subtract 5 hours
        const now = Date.now();
        if (startDatePakistan > now) {
          toast.error('Exam has not started yet. Please wait until the start time.');
          router.push('/student/exams');
          return;
        }
      }
      
      // Check if exam has ended (Pakistan timezone: UTC - 5 hours)
      if (examData.end_date) {
        const endDateUTC = new Date(examData.end_date).getTime();
        const endDatePakistan = endDateUTC - (5 * 60 * 60 * 1000); // Subtract 5 hours
        const now = Date.now();
        if (endDatePakistan < now) {
          toast.error('Exam has ended.');
          router.push(`/student/exams/${examId}/result`);
          return;
        }
      }
      
      setExam(examData);
      
      // Try to get existing attempt or start new one
      if (examData.attempt && examData.attempt.id) {
        const attemptData = await studentApi.getAttempt(examId, examData.attempt.id);
        setAttempt(attemptData);
        if (attemptData.responses) {
          const responsesMap: Record<string, ExamResponse> = {};
          attemptData.responses.forEach((r: any) => {
            responsesMap[r.question_id] = {
              question_id: r.question_id,
              answer_text: r.answer_text,
              selected_options: r.selected_options,
            };
          });
          setResponses(responsesMap);
        }
      } else {
        // Start new attempt
        const newAttempt = await studentApi.startExam(examId);
        setAttempt(newAttempt);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.response?.data?.error?.message || 'Failed to load exam';
      toast.error(errorMessage);
      if (error.response?.status === 403) {
        router.push('/student/exams');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (submitting || !attempt) return;
    setSubmitting(true);
    try {
      const responseArray = Object.values(responses).map((resp: ExamResponse) => ({
        question_id: resp.question_id,
        answer_text: resp.answer_text || null,
        selected_options: resp.selected_options || null
      }));
      const result = await studentApi.submitExam(examId, attempt.id, responseArray);
      toast.success('Exam submitted automatically - time expired');
      if (result?.id) {
        router.push(`/student/exams/${examId}/result?resultId=${result.id}`);
      } else {
        router.push(`/student/exams/${examId}/result`);
      }
    } catch (error: any) {
      toast.error('Failed to auto-submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!attempt || !exam) return;
    
    if (window.confirm('Are you sure you want to submit this exam? You cannot change your answers after submission.')) {
      setSubmitting(true);
      try {
        // Convert responses object to array format expected by backend
        const responseArray = Object.values(responses).map((resp: ExamResponse) => ({
          question_id: resp.question_id,
          answer_text: resp.answer_text || null,
          selected_options: resp.selected_options || null
        }));
        
        console.log('Submitting exam with responses:', responseArray);
        const result = await studentApi.submitExam(examId, attempt.id, responseArray);
        toast.success('Exam submitted successfully');
        // Redirect to result page using result ID
        if (result?.id) {
          router.push(`/student/exams/${examId}/result?resultId=${result.id}`);
        } else {
          router.push(`/student/exams/${examId}/result`);
        }
      } catch (error: any) {
        console.error('Submit exam error:', error);
        const errorMessage = error.response?.data?.detail || error.response?.data?.error?.message || error.message || 'Failed to submit exam';
        toast.error(errorMessage);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleAnswerChange = (questionId: string, questionType: QuestionType, value: any) => {
    setResponses(prev => {
      const newResponse: ExamResponse = {
        question_id: questionId,
      };
      
      if (questionType === QuestionType.MCQ || questionType === QuestionType.TRUE_FALSE) {
        newResponse.selected_options = Array.isArray(value) ? value : [value];
      } else {
        newResponse.answer_text = value;
      }
      
      return { ...prev, [questionId]: newResponse };
    });
    
    // Auto-save responses
    if (attempt) {
      const responseArray = Object.values({ ...responses, [questionId]: { ...responses[questionId], ...value } });
      studentApi.updateAttemptResponses(examId, attempt.id, responseArray).catch(() => {
        // Silently fail auto-save
      });
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!initialized || !isAuthenticated || !user || user.role !== 'student') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  if (loading || !exam || !attempt) {
    return (
      <DashboardLayout role="student">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <SkeletonCard>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1">
                <Skeleton variant="text" width={300} height={32} className="mb-2" />
                <Skeleton variant="text" width={200} height={20} />
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton variant="text" width={80} height={32} />
                <Skeleton variant="text" width={120} height={16} />
              </div>
            </div>
          </SkeletonCard>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Question Navigation Sidebar Skeleton */}
            <div className="lg:col-span-1">
              <SkeletonCard>
                <Skeleton variant="text" width={100} height={24} className="mb-3" />
                <div className="grid grid-cols-5 lg:grid-cols-1 gap-2">
                  {[...Array(15)].map((_, i) => (
                    <Skeleton key={i} variant="rectangular" width="100%" height={40} />
                  ))}
                </div>
              </SkeletonCard>
            </div>

            {/* Main Question Area Skeleton */}
            <div className="lg:col-span-3">
              <SkeletonCard>
                <div className="space-y-6">
                  <div className="flex justify-between items-start border-b border-gray-700 pb-4">
                    <div>
                      <Skeleton variant="text" width={150} height={20} className="mb-2" />
                      <Skeleton variant="text" width={80} height={16} />
                    </div>
                    <Skeleton variant="text" width={100} height={16} />
                  </div>
                  <div>
                    <Skeleton variant="text" width="100%" height={24} className="mb-4" />
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} variant="rectangular" width="100%" height={60} />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-gray-700">
                    <Skeleton variant="rectangular" width={100} height={40} />
                    <Skeleton variant="rectangular" width={120} height={40} />
                  </div>
                </div>
              </SkeletonCard>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const totalQuestions = exam.questions.length;
  const answeredCount = Object.keys(responses).filter(
    key => {
      const r = responses[key];
      return r && (r.answer_text || (r.selected_options && r.selected_options.length > 0));
    }
  ).length;

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        {/* Header with Timer */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-4 sm:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{exam.title}</h1>
              {exam.description && (
                <p className="text-gray-400 mt-1">{exam.description}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className={`text-2xl font-bold ${
                timeRemaining < 300 ? 'text-red-400' : 
                timeRemaining < 900 ? 'text-yellow-400' : 
                'text-white'
              }`}>
                {formatTime(timeRemaining)}
              </div>
              <div className="text-sm text-gray-400">
                {answeredCount} of {totalQuestions} answered
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-4 sticky top-4">
              <h3 className="font-semibold text-white mb-3">Questions</h3>
              <div className="grid grid-cols-5 lg:grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                {exam.questions.map((q, idx) => {
                  const isAnswered = responses[q.id] && (
                    responses[q.id].answer_text || 
                    (responses[q.id].selected_options && responses[q.id].selected_options!.length > 0)
                  );
                  const isCurrent = idx === currentQuestionIndex;
                  
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`p-2 rounded text-sm font-medium transition-colors ${
                        isCurrent
                          ? 'bg-primary-600 text-white'
                          : isAnswered
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6 space-y-6">
              {/* Question Header */}
              <div className="flex justify-between items-start border-b border-gray-700 pb-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </div>
                  <div className="text-sm text-gray-500">
                    {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  {currentQuestion.question_type.replace('_', ' ').toUpperCase()}
                </div>
              </div>

              {/* Question Text */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  {currentQuestion.question_text}
                </h3>

                {/* Answer Options */}
                {currentQuestion.question_type === QuestionType.MCQ && currentQuestion.options && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option) => {
                      const isSelected = responses[currentQuestion.id]?.selected_options?.includes(option.id);
                      return (
                        <label
                          key={option.id}
                          className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-primary-500 bg-primary-500/20'
                              : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            checked={isSelected || false}
                            onChange={() => handleAnswerChange(currentQuestion.id, QuestionType.MCQ, option.id)}
                            className="mt-1 mr-3"
                          />
                          <span className={`flex-1 ${isSelected ? 'text-white' : 'text-gray-300'}`}>{option.option_text}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {currentQuestion.question_type === QuestionType.TRUE_FALSE && currentQuestion.options && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option) => {
                      const isSelected = responses[currentQuestion.id]?.selected_options?.includes(option.id);
                      return (
                        <label
                          key={option.id}
                          className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-primary-500 bg-primary-500/20'
                              : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            checked={isSelected || false}
                            onChange={() => handleAnswerChange(currentQuestion.id, QuestionType.TRUE_FALSE, option.id)}
                            className="mt-1 mr-3"
                          />
                          <span className={`flex-1 ${isSelected ? 'text-white' : 'text-gray-300'}`}>{option.option_text}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {(currentQuestion.question_type === QuestionType.SHORT_ANSWER || 
                  currentQuestion.question_type === QuestionType.LONG_ANSWER) && (
                  <textarea
                    value={responses[currentQuestion.id]?.answer_text || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, currentQuestion.question_type, e.target.value)}
                    placeholder="Type your answer here..."
                    rows={currentQuestion.question_type === QuestionType.LONG_ANSWER ? 8 : 4}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-800 text-white placeholder:text-gray-500"
                  />
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4 border-t border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                <div className="flex gap-2">
                  {currentQuestionIndex < totalQuestions - 1 ? (
                    <Button
                      variant="primary"
                      onClick={() => setCurrentQuestionIndex(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? 'Submitting...' : 'Submit Exam'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

