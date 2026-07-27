'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userEmail: string;
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  userEmail,
}: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const isConfirmed = confirmText.toLowerCase() === 'delete';

  const handleConfirm = async () => {
    if (!isConfirmed) return;
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full modal-enter transform translateZ(0)"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
              <p className="text-sm text-gray-500">This action cannot be undone</p>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-800 font-medium mb-2">Warning:</p>
            <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
              <li>All your data will be permanently deleted</li>
              <li>You will lose access to all exams and results</li>
              <li>This action cannot be reversed</li>
            </ul>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            To confirm, please type <span className="font-semibold text-gray-900">DELETE</span> below:
          </p>
          
          <Input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="mb-4"
          />
          
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirm}
              disabled={!isConfirmed || isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

