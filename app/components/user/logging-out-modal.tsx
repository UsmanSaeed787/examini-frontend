'use client';

interface LoggingOutModalProps {
  isOpen: boolean;
}

export default function LoggingOutModal({
  isOpen,
}: LoggingOutModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
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
        className="bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 rounded-3xl shadow-2xl border border-gray-700/50 max-w-sm w-full p-10 modal-enter relative overflow-hidden"
        style={{ margin: 'auto' }}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-transparent to-primary-500/10 animate-pulse"></div>
        
        <div className="flex flex-col items-center text-center relative z-10">
          {/* Elegant Logout Icon with Smooth Animation */}
          <div className="relative w-20 h-20 mb-8">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 border-4 border-primary-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" style={{ animationDuration: '1s' }}></div>
            
            {/* Inner icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg 
                className="w-10 h-10 text-primary-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ filter: 'drop-shadow(0 0 8px rgba(42, 182, 165, 0.5))' }}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                />
              </svg>
            </div>
          </div>
          
          {/* Title with gradient text */}
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent mb-2">
            Signing Out
          </h2>
          
          {/* Subtitle */}
          <p className="text-gray-400 text-sm mb-6">
            Please wait a moment...
          </p>
          
          {/* Elegant progress dots */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0s', animationDuration: '1.4s' }}></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s', animationDuration: '1.4s' }}></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s', animationDuration: '1.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

