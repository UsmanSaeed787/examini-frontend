'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, ClipboardCheck, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

/**
 * Which AI path should this teacher take?
 *
 * There are two, and labelling them by mechanism ("Generate with AI" vs "Plan
 * with AI") forced the teacher to understand the architecture to choose. These
 * describe the two things that actually differ: how long it takes, and how much
 * of the reasoning you get to see. The choice is about stakes, not technology.
 */
const OPTIONS = [
  {
    key: 'quick',
    href: '/teacher/exams/generate',
    icon: Zap,
    title: 'Quick quiz',
    time: 'About a minute',
    copy: 'Describe what you want and the AI writes the questions straight away.',
    best: 'Best for low-stakes practice, weekly quizzes and revision sets.',
  },
  {
    key: 'guided',
    href: '/teacher/assessments/new',
    icon: ClipboardCheck,
    title: 'Guided assessment',
    time: 'A few minutes',
    recommended: true,
    copy:
      'The AI reads your material, proposes a plan — topics, question mix, difficulty against your past exams — and you approve it before a single question is written.',
    best: 'Best for midterms, finals and anything you may need to justify.',
  },
] as const;

export function NewExamChooser({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Create an exam with AI"
      description="Two ways to do it. The difference is how much you see before the questions exist."
      size="lg"
    >
      <div className="space-y-3">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                onClose();
                router.push(option.href);
              }}
              className="w-full text-left rounded-xl border border-gray-700 bg-gray-800/60 hover:bg-gray-800 hover:border-primary-600/50 p-4 transition-colors group"
            >
              <div className="flex items-start gap-4">
                <span className="w-10 h-10 rounded-lg bg-primary-600/20 text-primary-500 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-base font-semibold text-white">{option.title}</span>
                    {'recommended' in option && option.recommended && (
                      <Badge tone="primary" size="sm">
                        Recommended
                      </Badge>
                    )}
                    <Badge tone="muted" size="sm">
                      {option.time}
                    </Badge>
                  </span>
                  <span className="block text-sm text-gray-300">{option.copy}</span>
                  <span className="block text-xs text-gray-500 mt-1.5">{option.best}</span>
                </span>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-primary-500 shrink-0 mt-3 transition-colors" />
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Either way the exam arrives as a draft — nothing reaches students until you publish it.
      </p>
    </Modal>
  );
}
