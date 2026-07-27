'use client';

import { Button } from '@/components/ui/button';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 max-w-md w-full modal-enter">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Confirm Delete</h2>
          <p className="text-gray-300 mb-6">
            Are you sure you want to delete <strong className="text-white">{userName}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              onClick={onClose}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              variant="danger"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

