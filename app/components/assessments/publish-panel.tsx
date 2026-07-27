'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ExternalLink, Lock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState, Notice } from '@/components/ui/feedback';
import { PublishModal } from '@/components/assessments/publish-modal';
import { formatDateTime } from '@/lib/utils';
import { AssessmentPlan, GenerationResponse } from '@/types/assessment';

export function PublishPanel({
  plan,
  generation,
  className,
  onPublish,
  busy,
}: {
  plan: AssessmentPlan | null;
  generation: GenerationResponse | null;
  className: string | null;
  onPublish: (acknowledgeFindings: boolean) => void;
  busy: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!generation || (generation.status !== 'generated' && generation.status !== 'published')) {
    return (
      <Card>
        <EmptyState
          icon={<Lock className="w-6 h-6" />}
          title="Nothing to publish yet"
          description="Generate the questions first — publishing releases the finished exam to students."
        />
      </Card>
    );
  }

  // -------------------------------------------------------------- published
  if (generation.status === 'published') {
    return (
      <Card>
        <CardHeader
          title="Published"
          description="Students in this class can now see and sit this exam."
          icon={<CheckCircle2 className="w-5 h-5" />}
        />

        <Notice tone="success" title="This assessment is live" icon={<Send className="w-4 h-4" />}>
          Released{' '}
          {generation.published_at ? formatDateTime(generation.published_at) : 'just now'} with{' '}
          {generation.question_count} questions.
        </Notice>

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          {generation.exam_id && (
            <Link href={`/teacher/exams/${generation.exam_id}`}>
              <Button variant="outline" className="w-full sm:w-auto">
                <span className="flex items-center justify-center gap-2">
                  Manage the exam
                  <ExternalLink className="w-4 h-4" />
                </span>
              </Button>
            </Link>
          )}
          <Link href="/teacher/assessments">
            <Button variant="ghost" className="w-full sm:w-auto text-gray-300">
              Back to assessments
            </Button>
          </Link>
        </div>

        <p className="text-xs text-gray-500 mt-5">
          This workspace is now read-only. To change the exam, use the exam editor; to regenerate
          questions, unpublish it there first.
        </p>
      </Card>
    );
  }

  // --------------------------------------------------------- ready to ship
  return (
    <Card>
      <CardHeader
        title="Publish to students"
        description="The final step — and the only one the AI cannot take for you."
        icon={<Send className="w-5 h-5" />}
      />

      <Notice tone="muted" className="mb-5">
        The exam exists as a <strong className="text-gray-100">draft</strong>. Publishing makes it
        visible to every student in the class.
      </Notice>

      <Button
        variant="primary"
        onClick={() => setModalOpen(true)}
        disabled={busy}
        className="w-full sm:w-auto"
      >
        <span className="flex items-center justify-center gap-2">
          <Send className="w-4 h-4" />
          Review and publish
        </span>
      </Button>

      {modalOpen && (
        <PublishModal
          onClose={() => setModalOpen(false)}
          onPublish={(acknowledge) => {
            setModalOpen(false);
            onPublish(acknowledge);
          }}
          generation={generation}
          schedule={plan?.schedule ?? null}
          className={className}
          busy={busy}
        />
      )}
    </Card>
  );
}
