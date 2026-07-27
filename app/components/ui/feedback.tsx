'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------- progress bar */

/**
 * Indeterminate progress only.
 *
 * The workflow API exposes no progress signal — no job id, no polling, no
 * stream — so a determinate percentage would be fabricated. This component
 * deliberately offers no `value` prop.
 */
export function IndeterminateBar({ className }: { className?: string }) {
  return (
    <div
      className={cn('w-full h-1.5 bg-gray-700 rounded-full overflow-hidden', className)}
      role="progressbar"
      aria-label="Working"
    >
      {/* Keyframes live in globals.css alongside the other app animations. */}
      <div className="h-full w-1/3 bg-primary-600 rounded-full indeterminate-slide" />
    </div>
  );
}

/** Determinate bar — only for values we genuinely know (question mixes, counts). */
export function MeterBar({
  segments,
  className,
}: {
  segments: Array<{ label: string; value: number; className: string }>;
  className?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return null;

  return (
    <div className={cn('w-full h-2.5 bg-gray-700 rounded-full overflow-hidden flex', className)}>
      {segments
        .filter((s) => s.value > 0)
        .map((s) => (
          <div
            key={s.label}
            className={cn('h-full transition-all', s.className)}
            style={{ width: `${(s.value / total) * 100}%` }}
            title={`${s.label}: ${s.value}`}
          />
        ))}
    </div>
  );
}

/* --------------------------------------------------------------- empty state */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('text-center py-12 px-6', className)}>
      {icon && (
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center text-primary-500">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && (
        <div className="text-sm text-gray-400 max-w-md mx-auto">{description}</div>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

/* ----------------------------------------------------------------- stat tile */

export function StatTile({
  label,
  value,
  sublabel,
  tone = 'default',
  className,
}: {
  label: string;
  value: React.ReactNode;
  sublabel?: React.ReactNode;
  tone?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}) {
  const valueTones = {
    default: 'text-white',
    primary: 'text-primary-500',
    success: 'text-green-400',
    warning: 'text-amber-400',
    danger: 'text-red-400',
  };

  return (
    <div className={cn('bg-gray-800/60 border border-gray-700 rounded-lg p-3', className)}>
      <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">{label}</div>
      <div className={cn('text-xl font-bold mt-1 leading-tight', valueTones[tone])}>{value}</div>
      {sublabel && <div className="text-xs text-gray-400 mt-0.5">{sublabel}</div>}
    </div>
  );
}

/* ------------------------------------------------------------ inline notice */

export function Notice({
  tone = 'info',
  title,
  children,
  icon,
  action,
  className,
}: {
  tone?: 'info' | 'warning' | 'danger' | 'success' | 'muted';
  title?: React.ReactNode;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  const tones = {
    info: 'bg-sky-500/10 border-sky-500/30 text-sky-200',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-100',
    danger: 'bg-red-500/10 border-red-500/30 text-red-100',
    success: 'bg-green-500/10 border-green-500/30 text-green-100',
    muted: 'bg-gray-800/60 border-gray-700 text-gray-300',
  };
  const iconTones = {
    info: 'text-sky-400',
    warning: 'text-amber-400',
    danger: 'text-red-400',
    success: 'text-green-400',
    muted: 'text-gray-500',
  };

  return (
    <div className={cn('rounded-lg border p-3 sm:p-4', tones[tone], className)}>
      <div className="flex items-start gap-3">
        {icon && <div className={cn('shrink-0 mt-0.5', iconTones[tone])}>{icon}</div>}
        <div className="min-w-0 flex-1 text-sm">
          {title && <div className="font-semibold mb-1">{title}</div>}
          {children}
        </div>
      </div>
      {action && <div className="mt-3 flex gap-2">{action}</div>}
    </div>
  );
}
