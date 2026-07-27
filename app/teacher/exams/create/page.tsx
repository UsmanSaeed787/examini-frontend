'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { teacherApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { QuestionType, DifficultyLevel, ExamCreate, QuestionCreate, QuestionOptionCreate } from '@/types/exam';

export default function CreateExamPage() {
  const router = useRouter();
  const { isAuthenticated, user, initialized, initialize } = useAuthStore();
  
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    class_id: '',
    duration_minutes: 60,
    start_date: '',
    end_date: '',
    allow_retake: false,
    max_attempts: 1,
  });
  
  const [questions, setQuestions] = useState<QuestionCreate[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<QuestionCreate>>({
    question_text: '',
    question_type: QuestionType.MCQ,
    difficulty_level: DifficultyLevel.MEDIUM,
    points: 1,
    options: [],
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
    if (isAuthenticated && user?.role === 'teacher') {
      fetchClasses();
    }
  }, [isAuthenticated, user]);

  const fetchClasses = async () => {
    try {
      const data = await teacherApi.getClasses();
      setClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const addOption = () => {
    if (!currentQuestion.options) {
      setCurrentQuestion({ ...currentQuestion, options: [] });
    }
    setCurrentQuestion({
      ...currentQuestion,
      options: [
        ...(currentQuestion.options || []),
        {
          option_text: '',
          is_correct: false,
          order_number: (currentQuestion.options?.length || 0) + 1,
        },
      ],
    });
  };

  const updateOption = (index: number, field: keyof QuestionOptionCreate, value: any) => {
    const newOptions = [...(currentQuestion.options || [])];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = (currentQuestion.options || []).filter((_, i) => i !== index);
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const addQuestion = () => {
    if (!currentQuestion.question_text) {
      toast.error('Please enter question text');
      return;
    }

    if (
      (currentQuestion.question_type === QuestionType.MCQ || 
       currentQuestion.question_type === QuestionType.TRUE_FALSE) &&
      (!currentQuestion.options || currentQuestion.options.length === 0)
    ) {
      toast.error('Please add at least one option');
      return;
    }

    if (
      (currentQuestion.question_type === QuestionType.MCQ || 
       currentQuestion.question_type === QuestionType.TRUE_FALSE) &&
      !currentQuestion.options?.some(opt => opt.is_correct)
    ) {
      toast.error('Please mark at least one option as correct');
      return;
    }

    const newQuestion: QuestionCreate = {
      question_text: currentQuestion.question_text!,
      question_type: currentQuestion.question_type!,
      difficulty_level: currentQuestion.difficulty_level,
      points: currentQuestion.points || 1,
      order_number: questions.length + 1,
      options: currentQuestion.options?.length ? currentQuestion.options : undefined,
    };

    setQuestions([...questions, newQuestion]);
    setCurrentQuestion({
      question_text: '',
      question_type: QuestionType.MCQ,
      difficulty_level: DifficultyLevel.MEDIUM,
      points: 1,
      options: [],
    });
    toast.success('Question added');
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.class_id || questions.length === 0) {
      toast.error('Please fill in all required fields and add at least one question');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      toast.error('Please set start and end dates');
      return;
    }

    setLoading(true);
    try {
      const examData: ExamCreate = {
        ...formData,
        questions,
      };
      await teacherApi.createExam(examData);
      toast.success('Exam created successfully');
      router.push('/teacher/exams');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  if (!initialized || !isAuthenticated || !user || user.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout role="teacher">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Create Exam</h1>
            <p className="text-gray-400 mt-1">Add questions and configure exam settings</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/teacher/exams')}>
            Cancel
          </Button>
        </div>

        {/* Exam Details Form */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">Exam Details</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title <span className="text-red-400">*</span>
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
                Class <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.class_id}
                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-800 text-white"
              >
                <option value="">Select a class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration (minutes) <span className="text-red-400">*</span>
              </label>
              <Input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date <span className="text-red-400">*</span>
              </label>
              <Input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date <span className="text-red-400">*</span>
              </label>
              <Input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
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

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allow_retake"
                checked={formData.allow_retake}
                onChange={(e) => setFormData({ ...formData, allow_retake: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="allow_retake" className="text-sm font-medium text-gray-300">
                Allow Retake
              </label>
            </div>
          </div>
        </div>

        {/* Questions List */}
        {questions.length > 0 && (
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Questions ({questions.length})
            </h2>
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={idx} className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="text-sm text-gray-400 mb-1">
                        Question {idx + 1} • {q.question_type.replace('_', ' ').toUpperCase()} • {q.points} points
                      </div>
                      <div className="font-medium text-white">{q.question_text}</div>
                      {q.options && q.options.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="text-sm text-gray-300">
                              {opt.is_correct && '✓ '}
                              {opt.option_text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeQuestion(idx)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Question Form */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">Add Question</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Question Text <span className="text-red-400">*</span>
            </label>
            <textarea
              value={currentQuestion.question_text}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
              placeholder="Enter question text"
              rows={3}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-800 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
              <select
                value={currentQuestion.question_type}
                onChange={(e) => setCurrentQuestion({ 
                  ...currentQuestion, 
                  question_type: e.target.value as QuestionType,
                  options: (e.target.value === QuestionType.MCQ || e.target.value === QuestionType.TRUE_FALSE) 
                    ? currentQuestion.options 
                    : undefined,
                })}
                className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-800 text-white"
              >
                <option value={QuestionType.MCQ}>Multiple Choice</option>
                <option value={QuestionType.TRUE_FALSE}>True/False</option>
                <option value={QuestionType.SHORT_ANSWER}>Short Answer</option>
                <option value={QuestionType.LONG_ANSWER}>Long Answer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
              <select
                value={currentQuestion.difficulty_level}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, difficulty_level: e.target.value as DifficultyLevel })}
                className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-800 text-white"
              >
                <option value={DifficultyLevel.EASY}>Easy</option>
                <option value={DifficultyLevel.MEDIUM}>Medium</option>
                <option value={DifficultyLevel.HARD}>Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Points</label>
              <Input
                type="number"
                value={currentQuestion.points}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseFloat(e.target.value) || 1 })}
                min="0.5"
                step="0.5"
              />
            </div>
          </div>

          {(currentQuestion.question_type === QuestionType.MCQ || 
            currentQuestion.question_type === QuestionType.TRUE_FALSE) && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-300">Options</label>
                <Button variant="outline" size="sm" onClick={addOption}>
                  + Add Option
                </Button>
              </div>
              {currentQuestion.options?.map((opt, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    type="text"
                    value={opt.option_text}
                    onChange={(e) => updateOption(idx, 'option_text', e.target.value)}
                    placeholder="Option text"
                    className="flex-1"
                  />
                  <label className="flex items-center gap-2 whitespace-nowrap text-gray-300">
                    <input
                      type="checkbox"
                      checked={opt.is_correct}
                      onChange={(e) => updateOption(idx, 'is_correct', e.target.checked)}
                      className="mr-1"
                    />
                    Correct
                  </label>
                  <button
                    onClick={() => removeOption(idx)}
                    className="text-red-400 hover:text-red-300 px-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <Button variant="primary" onClick={addQuestion} className="w-full">
            Add Question
          </Button>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.push('/teacher/exams')}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Exam'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

