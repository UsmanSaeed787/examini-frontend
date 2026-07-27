'use client';

interface DeletingProgressModalProps {
  isOpen: boolean;
  examTitle: string;
}

export default function DeletingProgressModal({
  isOpen,
  examTitle,
}: DeletingProgressModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div 
        className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 max-w-md w-full p-8 modal-enter"
        style={{ margin: 'auto' }}
      >
        <div className="flex flex-col items-center text-center">
          {/* Dustbin Icon with Spinner */}
          <div className="relative w-16 h-16 mb-6">
            <svg 
              className="w-16 h-16 text-primary-500 animate-pulse" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
              />
            </svg>
            <div className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-3">Deleting Exam</h2>
          
          {/* Exam Title */}
          <p className="text-gray-300 mb-2">Removing:</p>
          <p className="text-white font-semibold text-lg mb-6">{examTitle}</p>
          
          {/* Progress Message */}
          <div className="flex items-center gap-2 text-gray-400">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
            <span className="text-sm">Please wait while we delete the exam...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

