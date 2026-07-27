'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { teacherApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { ExamGenerate } from '@/types/exam';
import GenerationProgressStepper from '@/components/exams/generation-progress-stepper';

export default function GenerateExamPage() {
  const router = useRouter();
  const { isAuthenticated, user, initialized, initialize } = useAuthStore();
  
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [materials, setMaterials] = useState<Array<{ id: string; title: string; class_id: string }>>([]);
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
  
  const [questionConfig, setQuestionConfig] = useState({
    total: 10,
    easy: 3,
    medium: 4,
    hard: 3,
    mcq: 5,
    short_answer: 3,
    long_answer: 2,
  });

  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [showProgress, setShowProgress] = useState(false);
  const [progressStep, setProgressStep] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState<'analyzing' | 'generating' | 'finalizing' | 'completed'>('analyzing');
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    if (formData.class_id) {
      fetchMaterials();
    } else {
      setMaterials([]);
      setSelectedMaterials([]);
    }
  }, [formData.class_id]);

  const fetchClasses = async () => {
    try {
      const data = await teacherApi.getClasses();
      setClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load classes:', error);
      toast.error('Failed to load classes');
    }
  };

  const fetchMaterials = async () => {
    try {
      const data = await teacherApi.getMaterials(formData.class_id);
      setMaterials(data.items || []);
    } catch (error) {
      console.error('Failed to load materials:', error);
      toast.error('Failed to load materials');
    }
  };

  const toggleMaterial = (materialId: string) => {
    setSelectedMaterials(prev =>
      prev.includes(materialId)
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    );
  };

  const simulateProgress = (totalQuestions: number): NodeJS.Timeout => {
    let currentProgress = 0;
    let questionNum = 0;
    let step = 1;

    const progressInterval = setInterval(() => {
      if (step === 1) {
        // Step 1: Analyzing (0-20%)
        currentProgress += 2;
        setProgress(currentProgress);
        if (currentProgress >= 20) {
          step = 2;
          setProgressStep(2);
          setProgressStatus('generating');
        }
      } else if (step === 2) {
        // Step 2: Generating questions (20-90%)
        const progressPerQuestion = 70 / totalQuestions;
        currentProgress += progressPerQuestion;
        questionNum = Math.floor(((currentProgress - 20) / 70) * totalQuestions);
        setCurrentQuestion(Math.min(questionNum + 1, totalQuestions));
        setProgress(Math.min(currentProgress, 90));
        
        if (currentProgress >= 90) {
          step = 3;
          setProgressStep(3);
          setProgressStatus('finalizing');
        }
      } else if (step === 3) {
        // Step 3: Finalizing (90-99%)
        currentProgress += 1;
        setProgress(Math.min(currentProgress, 99));
        
        // Wait for API to complete before marking as completed
        // The API completion will trigger status change to 'completed'
      }
    }, 200); // Update every 200ms for smooth animation
    
    return progressInterval;
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.class_id || selectedMaterials.length === 0) {
      toast.error('Please fill in all required fields and select at least one material');
      return;
    }

    if (questionConfig.total !== questionConfig.easy + questionConfig.medium + questionConfig.hard) {
      toast.error('Difficulty levels must sum to total questions');
      return;
    }

    if (questionConfig.total !== questionConfig.mcq + questionConfig.short_answer + questionConfig.long_answer) {
      toast.error('Question types must sum to total questions');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      toast.error('Please set start and end dates');
      return;
    }

    // First: Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Wait for scroll to complete, then show stepper
    setTimeout(async () => {
      // Show stepper modal
      setShowProgress(true);
      setProgressStep(1);
      setCurrentQuestion(0);
      setProgress(0);
      setProgressStatus('analyzing');
      setLoading(true);

      // Start progress simulation
      const progressInterval = simulateProgress(questionConfig.total);
      progressIntervalRef.current = progressInterval as any;

      try {
        const examData: ExamGenerate = {
          ...formData,
          material_ids: selectedMaterials,
          question_config: questionConfig,
        };
        
        // Start API call in parallel with progress
        const examPromise = teacherApi.generateExam(examData);
        
        // Wait for API to complete
        await examPromise;
        
        // Now mark as completed and set progress to 100%
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        setProgress(100);
        setProgressStatus('completed');
        setCurrentQuestion(questionConfig.total);
        setProgressStep(3);
        setLoading(false);
        
        toast.success('Exam generated successfully');
        
        // Show success message for 2 seconds before redirecting
        setTimeout(() => {
          setShowProgress(false);
          router.push('/teacher/exams');
        }, 2000);
      } catch (error: any) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        setShowProgress(false);
        setLoading(false);
        toast.error(error.response?.data?.error?.message || 'Failed to generate exam');
      }
    }, 500); // Wait 500ms for smooth scroll to complete
  };

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  if (!initialized || !isAuthenticated || !user || user.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout role="teacher">
      {/* Progress Stepper Modal */}
      <GenerationProgressStepper
        isOpen={showProgress}
        totalQuestions={questionConfig.total}
        currentStep={progressStep}
        currentQuestion={currentQuestion}
        progress={progress}
        status={progressStatus}
      />

      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Quick quiz</h1>
            <p className="text-gray-400 mt-1">
              The AI writes questions straight from your materials, in one step.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/teacher/exams')}>
            Cancel
          </Button>
        </div>

        {/* Someone who landed here for a high-stakes exam should know the other
            path exists, at the moment it is still cheap to switch. */}
        <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-sm text-gray-400 flex-1">
            Setting a midterm or final? A guided assessment analyses your material and proposes a
            plan you approve before any question is written.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary-500 hover:bg-gray-700 shrink-0"
            onClick={() => router.push('/teacher/assessments/new')}
          >
            Use guided assessment →
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

        {/* Material Selection */}
        {formData.class_id && (
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Select Materials <span className="text-red-400">*</span>
            </h2>
            {materials.length === 0 ? (
              <p className="text-gray-400">No materials available for this class. Upload materials first.</p>
            ) : (
              <div className="space-y-2">
                {materials.map((material) => (
                  <label
                    key={material.id}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedMaterials.includes(material.id)
                        ? 'border-primary-500 bg-primary-500/20'
                        : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMaterials.includes(material.id)}
                      onChange={() => toggleMaterial(material.id)}
                      className="mr-3"
                    />
                    <span className={`flex-1 ${selectedMaterials.includes(material.id) ? 'text-white' : 'text-gray-300'}`}>{material.title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Question Configuration */}
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6 space-y-6">
          <h2 className="text-xl font-semibold text-white">Question Configuration</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Total Questions <span className="text-red-400">*</span>
            </label>
            <Input
              type="number"
              value={questionConfig.total}
              onChange={(e) => {
                const total = parseInt(e.target.value) || 10;
                setQuestionConfig({ ...questionConfig, total });
              }}
              min="1"
            />
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">By Difficulty</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Easy</label>
                <Input
                  type="number"
                  value={questionConfig.easy}
                  onChange={(e) => setQuestionConfig({ ...questionConfig, easy: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Medium</label>
                <Input
                  type="number"
                  value={questionConfig.medium}
                  onChange={(e) => setQuestionConfig({ ...questionConfig, medium: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Hard</label>
                <Input
                  type="number"
                  value={questionConfig.hard}
                  onChange={(e) => setQuestionConfig({ ...questionConfig, hard: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Sum: {questionConfig.easy + questionConfig.medium + questionConfig.hard} / {questionConfig.total}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">By Type</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">MCQ</label>
                <Input
                  type="number"
                  value={questionConfig.mcq}
                  onChange={(e) => setQuestionConfig({ ...questionConfig, mcq: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Short Answer</label>
                <Input
                  type="number"
                  value={questionConfig.short_answer}
                  onChange={(e) => setQuestionConfig({ ...questionConfig, short_answer: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Long Answer</label>
                <Input
                  type="number"
                  value={questionConfig.long_answer}
                  onChange={(e) => setQuestionConfig({ ...questionConfig, long_answer: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Sum: {questionConfig.mcq + questionConfig.short_answer + questionConfig.long_answer} / {questionConfig.total}
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.push('/teacher/exams')}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit} 
            disabled={loading || selectedMaterials.length === 0}
          >
            {loading ? 'Generating...' : 'Generate Exam'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

