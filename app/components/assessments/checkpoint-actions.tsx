'use client';

import { useState } from 'react';
import { ArrowRight, MessageSquare, Settings2, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/form-controls';
import { QuestionMixEditor, validateQuestionConfig } from '@/components/assessments/question-mix-editor';
import { AdjustMixModal } from '@/components/assessments/adjust-mix-modal';
import { QuestionConfig, STAGE_META, StageKey } from '@/types/assessment';

const QUICK_FEEDBACK = [
  'Too many hard questions',
  'Missing an important topic',
  'The difficulty balance is wrong',
  'Too much weight on one topic',
  'Not enough coverage of the material',
];

/**
 * The approve / request-changes pair.
 *
 * "Request changes" is never labelled "Reject" — sending a stage back is the
 * normal collaborative path, not a failure, and the backend treats it the same
 * way (new revision, re-run with the notes in context).
 */
export function CheckpointActions({
  stageKey,
  currentConfig,
  onApprove,
  onReject,
  onAdjust,
  busy,
}: {
  stageKey: StageKey;
  currentConfig: QuestionConfig;
  onApprove: (notes?: string) => void;
  onReject: (notes: string, configPatch?: QuestionConfig | null) => void;
  /** Change the numbers without asking the AI to redesign. */
  onAdjust?: (questionConfig: QuestionConfig) => void;
  busy: boolean;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [approveNotes, setApproveNotes] = useState('');
  const [patchOpen, setPatchOpen] = useState(false);
  const [patch, setPatch] = useState<QuestionConfig>(currentConfig);

  const meta = STAGE_META[stageKey];
  const patchErrors = patchOpen ? validateQuestionConfig(patch) : [];
  const canSubmitReject = notes.trim().length > 0 && patchErrors.length === 0;

  const closeReject = () => {
    setRejectOpen(false);
    setNotes('');
    setPatchOpen(false);
    setPatch(currentConfig);
  };

  return (
    <>
      {/* Sticky on mobile ONLY, so the decision stays reachable without
          scrolling past a long artifact. On desktop it must return to normal
          flow — left sticky it floats over the artifact it belongs to. */}
      <div className="sticky sm:static bottom-0 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 sm:py-0 bg-gray-900/95 sm:bg-transparent backdrop-blur sm:backdrop-blur-none border-t border-gray-700 sm:border-0 mt-6 sm:mt-8">
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          {/* Two different needs, two different actions: adjusting the numbers
              is arithmetic and costs nothing; requesting changes asks the model
              to reconsider. Previously both went through the second. */}
          {onAdjust && (
            <Button
              variant="ghost"
              onClick={() => setAdjustOpen(true)}
              disabled={busy}
              className="w-full sm:w-auto text-gray-300 hover:bg-gray-800"
            >
              <span className="flex items-center justify-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Adjust the mix
              </span>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setRejectOpen(true)}
            disabled={busy}
            className="w-full sm:w-auto"
          >
            <span className="flex items-center justify-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Request changes
            </span>
          </Button>
          {/* One click. The teacher has just read the artifact — a confirm
              dialog on top of that is friction, not a safeguard. Approving is
              reversible in effect (the next stage can still be sent back);
              publishing, which is not, keeps its confirmation. */}
          <Button
            variant="primary"
            onClick={() => onApprove()}
            disabled={busy}
            className="w-full sm:w-auto"
          >
            <span className="flex items-center justify-center gap-2">
              Approve
              <ArrowRight className="w-4 h-4" />
            </span>
          </Button>
        </div>
        <div className="flex justify-center sm:justify-end mt-2">
          <button
            type="button"
            onClick={() => setApproveOpen(true)}
            disabled={busy}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            Approve with a note
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------- approve */}
      <Modal
        isOpen={approveOpen}
        onClose={() => setApproveOpen(false)}
        title={`Approve ${meta.label.toLowerCase()} with a note`}
        description="The note is recorded against this decision. The AI then continues with the plan."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setApproveOpen(false)} className="text-gray-300">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setApproveOpen(false);
                onApprove(approveNotes.trim() || undefined);
                setApproveNotes('');
              }}
            >
              Approve and continue
            </Button>
          </>
        }
      >
        <Textarea
          label="Your note"
          placeholder="Anything you want recorded against this decision…"
          value={approveNotes}
          onChange={(e) => setApproveNotes(e.target.value)}
          maxLength={2000}
          className="min-h-[80px]"
          autoFocus
        />
      </Modal>

      {/* ----------------------------------------------------------- adjust */}
      {onAdjust && adjustOpen && (
        <AdjustMixModal
          currentConfig={currentConfig}
          onClose={() => setAdjustOpen(false)}
          onApply={(questionConfig) => {
            setAdjustOpen(false);
            onAdjust(questionConfig);
          }}
        />
      )}

      {/* ----------------------------------------------------------- reject */}
      <Modal
        isOpen={rejectOpen}
        onClose={closeReject}
        title="What should the AI do differently?"
        description={`${meta.label} will run again with your feedback in context.`}
        footer={
          <>
            <Button variant="ghost" onClick={closeReject} className="text-gray-300">
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!canSubmitReject}
              onClick={() => {
                onReject(notes.trim(), patchOpen ? patch : null);
                closeReject();
              }}
            >
              Send feedback and re-run
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {QUICK_FEEDBACK.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() =>
                  setNotes((prev) => (prev.trim() ? `${prev.trim()}. ${chip}` : chip))
                }
                className="text-xs rounded-full border border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 transition-colors"
              >
                + {chip}
              </button>
            ))}
          </div>

          <Textarea
            label="Your feedback"
            placeholder="Be specific — this text is given to the AI when it re-runs this step."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
            helperText={`${notes.length}/2000`}
            autoFocus
          />

          {/* The only way to correct a bad question_config after creation, so
              it is surfaced rather than hidden. */}
          <div className="rounded-xl border border-gray-700 overflow-hidden">
            <button
              type="button"
              onClick={() => setPatchOpen((open) => !open)}
              className="w-full flex items-center gap-3 p-3 bg-gray-800/60 hover:bg-gray-800 transition-colors text-left"
            >
              <Settings2 className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-gray-200">Also correct the setup</span>
                <span className="block text-xs text-gray-500">
                  Change the question mix before this step re-runs
                </span>
              </span>
              <span className="text-xs text-gray-400 shrink-0">{patchOpen ? 'Hide' : 'Edit'}</span>
            </button>
            {patchOpen && (
              <div className="p-3 border-t border-gray-700">
                <QuestionMixEditor config={patch} onChange={setPatch} showPresets={false} />
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
