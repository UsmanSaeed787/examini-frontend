'use client';

import { Button } from '@/components/ui/button';

interface LogoutConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
}: LogoutConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 max-w-md w-full modal-enter transform translateZ(0)"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 border border-red-500/30">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Sign Out</h3>
              <p className="text-sm text-gray-400">Are you sure you want to sign out?</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-300 mb-6">
            You will need to sign in again to access your account.
          </p>
          
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onConfirm}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

