'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'muted';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-gray-700 text-gray-200 border-gray-600',
  primary: 'bg-primary-600/20 text-primary-500 border-primary-600/40',
  success: 'bg-green-500/15 text-green-400 border-green-500/40',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
  danger: 'bg-red-500/15 text-red-400 border-red-500/40',
  info: 'bg-sky-500/15 text-sky-400 border-sky-500/40',
  muted: 'bg-gray-800 text-gray-500 border-gray-700',
};

export function Badge({
  children,
  tone = 'neutral',
  icon,
  className,
  size = 'md',
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  icon?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        tones[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
