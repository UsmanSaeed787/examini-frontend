'use client';

import { useState } from 'react';
import { AlertTriangle, Send, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Checkbox } from '@/components/ui/form-controls';
import { Notice } from '@/components/ui/feedback';
import { formatDateTime } from '@/lib/utils';
import { GenerationResponse, SchedulePlan } from '@/types/assessment';

/**
 * The publish gate.
 *
 * Publishing is the one irreversible, outward-facing action in the workspace,
 * and the backend makes it human-only by construction. The acknowledgement
 * checkbox maps 1:1 to the API's `acknowledge_findings` — it must never be
 * sent as a silent `true`.
 */
/** Mounted only while open (see PublishPanel), so the acknowledgement always
 *  starts unticked without an effect resetting it. */
export function PublishModal({
  onClose,
  onPublish,
  generation,
  schedule,
  className,
  busy,
}: {
  onClose: () => void;
  onPublish: (acknowledgeFindings: boolean) => void;
  generation: GenerationResponse;
  schedule: SchedulePlan | null;
  className: string | null;
  busy: boolean;
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const hasFindings = generation.findings.length > 0;
  const canPublish = !hasFindings || acknowledged;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Publish this assessment?"
      description="Students in this class will be able to see and sit the exam."
      dismissible={!busy}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy} className="text-gray-300">
            Not yet
          </Button>
          <Button
            variant="primary"
            disabled={!canPublish || busy}
            isLoading={busy}
            onClick={() => onPublish(acknowledged)}
          >
            <span className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Publish to students
            </span>
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <dl className="rounded-lg border border-gray-700 bg-gray-800/60 divide-y divide-gray-700">
          <div className="flex justify-between gap-4 p-3">
            <dt className="text-sm text-gray-400">Class</dt>
            <dd className="text-sm text-gray-100 text-right">{className || 'This class'}</dd>
          </div>
          <div className="flex justify-between gap-4 p-3">
            <dt className="text-sm text-gray-400">Questions</dt>
            <dd className="text-sm text-gray-100 text-right">{generation.question_count}</dd>
          </div>
          <div className="flex justify-between gap-4 p-3">
            <dt className="text-sm text-gray-400">Duration</dt>
            <dd className="text-sm text-gray-100 text-right">
              {schedule?.duration_minutes ? `${schedule.duration_minutes} minutes` : 'Not set'}
            </dd>
          </div>
          <div className="flex justify-between gap-4 p-3">
            <dt className="text-sm text-gray-400">Available</dt>
            <dd className="text-sm text-gray-100 text-right">
              {schedule?.proposed_start
                ? `${formatDateTime(schedule.proposed_start)}${
                    schedule.proposed_end ? ` → ${formatDateTime(schedule.proposed_end)}` : ''
                  }`
                : 'No window set'}
            </dd>
          </div>
        </dl>

        {hasFindings ? (
          <Notice
            tone="warning"
            title={`${generation.findings.length} unresolved ${
              generation.findings.length === 1 ? 'finding' : 'findings'
            }`}
            icon={<AlertTriangle className="w-4 h-4" />}
          >
            <ul className="space-y-1 mt-1">
              {generation.findings.map((finding, i) => (
                <li key={i}>• {finding}</li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t border-amber-500/30">
              <Checkbox
                checked={acknowledged}
                onChange={setAcknowledged}
                label="I've reviewed these findings and want to publish anyway"
              />
            </div>
          </Notice>
        ) : (
          <Notice tone="muted" icon={<Users className="w-4 h-4" />}>
            No outstanding validation findings on the generated questions.
          </Notice>
        )}
      </div>
    </Modal>
  );
}
