'use client';

import React, { useId } from 'react';
import { Check, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ textarea */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  className,
  id,
  ...props
}) => {
  const generatedId = useId();
  const textareaId = id || generatedId;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-gray-300 mb-1">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white bg-gray-800 placeholder:text-gray-500 resize-y min-h-[96px]',
          error ? 'border-error-500' : 'border-gray-600',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-400">{helperText}</p>}
    </div>
  );
};

/* -------------------------------------------------------------------- select */

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  className,
  id,
  children,
  ...props
}) => {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-300 mb-1">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white bg-gray-800',
          error ? 'border-error-500' : 'border-gray-600',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-gray-400">{helperText}</p>}
    </div>
  );
};

/* ------------------------------------------------------------------ checkbox */

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label
      className={cn(
        'flex items-start gap-3 cursor-pointer group',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <span className="relative shrink-0 mt-0.5">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-gray-800',
            checked
              ? 'bg-primary-600 border-primary-600'
              : 'border-gray-600 group-hover:border-gray-500'
          )}
        >
          {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </span>
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-gray-200">{label}</span>
        {description && <span className="block text-xs text-gray-400 mt-0.5">{description}</span>}
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------- stepper */

/** Numeric stepper used throughout the question-mix editor. */
export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  label,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
  disabled?: boolean;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-gray-300 min-w-0 truncate">{label}</span>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          disabled={disabled || value <= min}
          className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:hover:bg-gray-700 flex items-center justify-center text-gray-200 transition-colors"
          aria-label={`Decrease ${label}`}
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          disabled={disabled}
          onChange={(e) => onChange(clamp(parseInt(e.target.value, 10) || 0))}
          className="w-14 h-8 text-center bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          aria-label={label}
        />
        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          disabled={disabled || value >= max}
          className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:hover:bg-gray-700 flex items-center justify-center text-gray-200 transition-colors"
          aria-label={`Increase ${label}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
