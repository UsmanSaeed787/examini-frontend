'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** `muted` is for stages not yet reached — present, but clearly inactive. */
  tone?: 'default' | 'muted' | 'accent' | 'danger' | 'success' | 'warning';
  padded?: boolean;
}

const tones = {
  default: 'bg-gray-800 border-gray-700',
  muted: 'bg-gray-800/40 border-gray-700/60',
  accent: 'bg-primary-600/10 border-primary-600/40',
  danger: 'bg-red-500/10 border-red-500/40',
  success: 'bg-green-500/10 border-green-500/40',
  warning: 'bg-amber-500/10 border-amber-500/40',
};

export function Card({ children, tone = 'default', padded = true, className, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-xl border shadow-sm', tones[tone], padded && 'p-4 sm:p-5', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 mb-4', className)}>
      <div className="flex items-start gap-3 min-w-0">
        {icon && <div className="shrink-0 mt-0.5 text-primary-500">{icon}</div>}
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-white leading-tight">{title}</h3>
          {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Section heading used inside artifact panels. */
export function SectionTitle({
  children,
  hint,
  className,
}: {
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn('mb-3', className)}>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{children}</h4>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}
