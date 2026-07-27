'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Blocks backdrop/escape dismissal while an action is in flight. */
  dismissible?: boolean;
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissible = true,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) onClose();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, dismissible, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto flex items-end sm:items-center justify-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && dismissible) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      {/* Full-screen sheet on mobile, centred dialog from sm up. */}
      <div
        className={cn(
          'bg-gray-800 border border-gray-700 shadow-2xl modal-enter w-full',
          'rounded-t-2xl sm:rounded-2xl',
          'max-h-[92vh] sm:max-h-[85vh] flex flex-col',
          sizes[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-700 shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
          </div>
          {dismissible && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors shrink-0 p-1 -m-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-5 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="p-5 border-t border-gray-700 shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
