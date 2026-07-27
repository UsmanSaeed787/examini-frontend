'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, XCircle } from 'lucide-react';
import { Badge, BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/utils';
import { WorkflowResponse, WorkflowState } from '@/types/assessment';

const STATE: Record<WorkflowState, { tone: BadgeTone; label: string }> = {
  draft: { tone: 'muted', label: 'Draft' },
  in_progress: { tone: 'primary', label: 'In progress' },
  awaiting_approval: { tone: 'warning', label: 'Needs your review' },
  completed: { tone: 'success', label: 'Plan approved' },
  cancelled: { tone: 'muted', label: 'Cancelled' },
  failed: { tone: 'danger', label: 'Failed' },
};

const TERMINAL: WorkflowState[] = ['completed', 'cancelled', 'failed'];

export function WorkflowHeader({
  workflow,
  onCancel,
  onRefresh,
  busy,
  refreshing,
}: {
  workflow: WorkflowResponse;
  onCancel: () => void;
  onRefresh: () => void;
  busy: boolean;
  refreshing: boolean;
}) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const state = STATE[workflow.state];
  const canCancel = !TERMINAL.includes(workflow.state);

  return (
    <div className="mb-5">
      <Link
        href="/teacher/assessments"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-3"
      >
        <ArrowLeft className="w-4 h-4" />
        All assessments
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-white">{workflow.title}</h1>
            <Badge tone={state.tone}>{state.label}</Badge>
          </div>
          <p className="text-sm text-gray-400 mt-1">Started {formatDate(workflow.created_at)}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={busy}
            className="text-gray-300 hover:bg-gray-800"
            title="Re-check the status on the server"
          >
            <span className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </span>
          </Button>
          {canCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmCancel(true)}
              disabled={busy}
              className="text-gray-400 hover:bg-gray-800 hover:text-red-400"
            >
              <span className="flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Cancel</span>
              </span>
            </Button>
          )}
        </div>
      </div>

      <Modal
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Cancel this assessment?"
        description="The plan and everything the AI has produced so far will be kept, but the workflow cannot be resumed."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmCancel(false)} className="text-gray-300">
              Keep working
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmCancel(false);
                onCancel();
              }}
            >
              Cancel assessment
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-300">
          You can start a new assessment from the same setup afterwards.
        </p>
      </Modal>
    </div>
  );
}
