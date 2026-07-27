'use client';

import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Notice } from '@/components/ui/feedback';
import {
  QuestionMixEditor,
  validateQuestionConfig,
} from '@/components/assessments/question-mix-editor';
import { QuestionConfig } from '@/types/assessment';

/**
 * Change the numbers without asking the AI to redesign.
 *
 * Shared by the plan checkpoint and the generation step, because "actually,
 * make it 12" occurs to a teacher in both places — and until now the checkpoint
 * was the only moment it was possible.
 *
 * Mounted only while open, so the draft mix always starts from what is
 * currently configured.
 */
export function AdjustMixModal({
  currentConfig,
  onClose,
  onApply,
}: {
  currentConfig: QuestionConfig;
  onClose: () => void;
  onApply: (questionConfig: QuestionConfig) => void;
}) {
  const [mix, setMix] = useState<QuestionConfig>(currentConfig);
  const errors = validateQuestionConfig(mix);
  const changed = JSON.stringify(mix) !== JSON.stringify(currentConfig);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Adjust the question mix"
      description="Your numbers, applied directly. No AI call — the plan is recomputed from what you set."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="text-gray-300">
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={errors.length > 0 || !changed}
            onClick={() => onApply(mix)}
          >
            Apply and recompute
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Notice tone="info" icon={<SlidersHorizontal className="w-4 h-4" />}>
          The blueprint, quality checks, difficulty comparison and duration estimate are
          recalculated from these numbers. Anything the AI wrote about the previous mix is dropped
          rather than left describing figures that changed — use <strong>Request changes</strong> if
          you want it to think again.
        </Notice>
        <QuestionMixEditor config={mix} onChange={setMix} showPresets={false} />
      </div>
    </Modal>
  );
}
