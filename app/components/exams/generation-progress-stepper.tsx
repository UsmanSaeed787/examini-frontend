'use client';

import { useEffect } from 'react';

interface GenerationProgressStepperProps {
  isOpen: boolean;
  totalQuestions: number;
  currentStep: number;
  currentQuestion: number;
  progress: number; // 0-100
  status: 'analyzing' | 'generating' | 'finalizing' | 'completed';
  onClose?: () => void;
}

const steps = [
  { id: 1, label: 'Analyzing Materials', description: 'Reading and processing uploaded materials' },
  { id: 2, label: 'Generating Questions', description: 'Creating exam questions using AI' },
  { id: 3, label: 'Finalizing Exam', description: 'Preparing exam for use' },
];

export default function GenerationProgressStepper({
  isOpen,
  totalQuestions,
  currentStep,
  currentQuestion,
  progress,
  status,
  onClose,
}: GenerationProgressStepperProps) {
  if (!isOpen) return null;

  // Only show 100% when truly completed
  const displayProgress = status === 'completed' ? 100 : Math.min(progress, 99);

  const getStatusIcon = (stepId: number) => {
    if (stepId < currentStep) {
      return (
        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
    if (stepId === currentStep) {
      return (
        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center animate-pulse">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center">
        <span className="text-gray-400 text-sm font-semibold">{stepId}</span>
      </div>
    );
  };

  const getStatusColor = (stepId: number) => {
    if (stepId < currentStep) return 'border-primary-500';
    if (stepId === currentStep) return 'border-primary-500';
    return 'border-gray-600';
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-8 sm:pt-16"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        overflowY: 'auto',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '2rem'
      }}
      onClick={(e) => e.target === e.currentTarget && onClose && status === 'completed' && onClose()}
    >
      <div 
        className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 max-w-2xl w-full p-8 modal-enter"
        style={{ 
          maxHeight: '90vh',
          overflowY: 'auto',
          marginTop: '2rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Generating Exam with AI</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              disabled={status !== 'completed'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-300">
              {status === 'analyzing' && 'Analyzing materials...'}
              {status === 'generating' && `Generating question ${currentQuestion} of ${totalQuestions}...`}
              {status === 'finalizing' && 'Finalizing exam...'}
              {status === 'completed' && 'Exam generated successfully!'}
            </span>
            <span className="text-sm font-semibold text-primary-400">{Math.round(displayProgress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>

        {/* Stepper */}
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                {getStatusIcon(step.id)}
                {index < steps.length - 1 && (
                  <div
                    className={`w-0.5 h-16 mt-2 transition-colors ${
                      step.id < currentStep ? 'bg-primary-500' : 'bg-gray-600'
                    }`}
                  />
                )}
              </div>
              <div className="flex-1 pt-1">
                <div
                  className={`text-lg font-semibold mb-1 ${
                    step.id <= currentStep ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </div>
                <div className="text-sm text-gray-400">{step.description}</div>
                {step.id === 2 && status === 'generating' && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                      <span>
                        Question {currentQuestion} of {totalQuestions} generated
                      </span>
                    </div>
                    <div className="grid grid-cols-10 gap-1">
                      {Array.from({ length: totalQuestions }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 rounded ${
                            i < currentQuestion
                              ? 'bg-primary-500'
                              : i === currentQuestion
                              ? 'bg-primary-500/50 animate-pulse'
                              : 'bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {status === 'completed' && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="flex items-center gap-2 text-green-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Exam generated successfully with {totalQuestions} questions!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

