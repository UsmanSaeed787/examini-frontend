'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const WIZARD_STEPS = [
  { id: 1, label: 'Subject', hint: 'What is this assessment for?' },
  { id: 2, label: 'Materials', hint: 'What should the AI read?' },
  { id: 3, label: 'Blueprint', hint: 'What should the exam look like?' },
  { id: 4, label: 'Schedule', hint: 'When, and how closely will you review?' },
] as const;

export function WizardProgress({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-1 sm:gap-2 mb-6 overflow-x-auto pb-1">
      {WIZARD_STEPS.map((step, index) => {
        const done = step.id < current;
        const active = step.id === current;
        return (
          <li key={step.id} className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 shrink-0',
                  done && 'bg-primary-600 border-primary-600 text-white',
                  active && 'border-primary-600 text-primary-500 bg-primary-600/10',
                  !done && !active && 'border-gray-700 text-gray-500 bg-gray-800'
                )}
              >
                {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : step.id}
              </span>
              <span
                className={cn(
                  'text-sm whitespace-nowrap',
                  active ? 'text-white font-medium' : 'text-gray-500',
                  'hidden sm:inline'
                )}
              >
                {step.label}
              </span>
            </div>
            {index < WIZARD_STEPS.length - 1 && (
              <span
                className={cn('h-px w-4 sm:w-8', done ? 'bg-primary-600' : 'bg-gray-700')}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function WizardStep({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg sm:text-xl font-bold text-white">{title}</h2>
        <p className="text-sm text-gray-400 mt-1">{description}</p>
      </div>
      {children}
    </div>
  );
}
