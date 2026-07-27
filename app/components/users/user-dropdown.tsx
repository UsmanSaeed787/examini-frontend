'use client';

import { useRef, useEffect } from 'react';
import { User } from '@/types/user';
import { Button } from '@/components/ui/button';

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onViewProfile: () => void;
  onLogout: () => void;
  position: { top: number; left: number };
}

export default function UserDropdown({
  isOpen,
  onClose,
  user,
  onViewProfile,
  onLogout,
  position,
}: UserDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[9998] bg-transparent"
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div
        ref={dropdownRef}
        className="fixed z-[9999] bg-gray-800 rounded-xl shadow-2xl border border-gray-700 py-2 w-[240px] dropdown-enter transform translateZ(0)"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
          maxHeight: 'calc(100vh - 32px)',
          overflow: 'visible',
          position: 'fixed',
        }}
      >
        <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/50">
          <p className="text-sm font-semibold text-white truncate">{user.full_name || 'User'}</p>
          <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
        </div>
        
        <div className="py-1.5">
          <button
            onClick={() => {
              onViewProfile();
              onClose();
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700/50 flex items-center gap-3 transition-all duration-200 ease-out group transform translateZ(0)"
          >
            <svg className="w-4 h-4 text-gray-400 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="group-hover:text-primary-400 font-medium">View Profile</span>
          </button>
          
          <div className="border-t border-gray-700 my-1"></div>
          
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/20 flex items-center gap-3 transition-all duration-200 ease-out group transform translateZ(0)"
          >
            <svg className="w-4 h-4 text-red-400 group-hover:text-red-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="group-hover:text-red-300 font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}

