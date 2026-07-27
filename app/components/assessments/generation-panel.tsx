'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertOctagon,
  CheckCircle2,
  ExternalLink,
  SlidersHorizontal,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Notice, StatTile } from '@/components/ui/feedback';
import { AdjustMixModal } from '@/components/assessments/adjust-mix-modal';
import { QuestionPreview } from '@/components/assessments/question-preview';
import { formatDateTime } from '@/lib/utils';
import { AssessmentPlan, GenerationResponse, QuestionConfig } from '@/types/assessment';

/** Step 6 of the journey: the approved plan becomes real questions. */
export function GenerationPanel({
  plan,
  generation,
  questionConfig,
  onGenerate,
  onAdjust,
  busy,
}: {
  plan: AssessmentPlan | null;
  generation: GenerationResponse | null;
  questionConfig: QuestionConfig;
  onGenerate: () => void;
  /** Change the numbers before spending a generation. */
  onAdjust?: (questionConfig: QuestionConfig) => void;
  busy: boolean;
}) {
  const [adjustOpen, setAdjustOpen] = useState(false);
  const status = generation?.status;
  const hasExam = Boolean(generation?.exam_id) && (status === 'generated' || status === 'published');

  // ---------------------------------------------------------- not yet run
  if (!generation || status === 'failed' || status === 'superseded') {
    const total = plan?.blueprint.total_questions ?? 0;
    return (
      <Card>
        <CardHeader
          title="Write the questions"
          description="Your plan is approved. The AI will now write the questions it describes."
          icon={<Wand2 className="w-5 h-5" />}
        />

        {status === 'failed' && generation?.error && (
          <Notice
            tone="danger"
            title="The last attempt failed"
            icon={<AlertOctagon className="w-4 h-4" />}
            className="mb-4"
          >
            {generation.error}
          </Notice>
        )}

        <div className="rounded-xl border border-primary-600/40 bg-primary-600/10 p-4 mb-5">
          <div className="flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
            <div className="text-sm text-gray-200">
              <p>
                The AI will write <strong className="text-white">{total} questions</strong> following
                the blueprint you approved.
              </p>
              <p className="text-gray-400 mt-1.5">
                The result is a <strong className="text-gray-200">draft</strong> — nothing reaches
                students until you publish it yourself.
              </p>
            </div>
          </div>
        </div>

        {/* Last cheap moment to change the numbers: after this, changing them
            means superseding a generated draft. */}
        <div className="flex flex-col-reverse sm:flex-row gap-3">
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
          <Button variant="primary" onClick={onGenerate} disabled={busy} className="w-full sm:w-auto">
            <span className="flex items-center justify-center gap-2">
              <Wand2 className="w-4 h-4" />
              {status === 'failed' ? 'Try again' : 'Generate questions'}
            </span>
          </Button>
        </div>

        {onAdjust && adjustOpen && (
          <AdjustMixModal
            currentConfig={questionConfig}
            onClose={() => setAdjustOpen(false)}
            onApply={(config) => {
              setAdjustOpen(false);
              onAdjust(config);
            }}
          />
        )}
      </Card>
    );
  }

  // ------------------------------------------------------------- generated
  return (
    <Card>
      <CardHeader
        title="Generated questions"
        description={
          status === 'published'
            ? 'This assessment is live for students.'
            : 'A draft exam — review it, then publish when you are ready.'
        }
        icon={<CheckCircle2 className="w-5 h-5" />}
        action={
          <Badge tone={status === 'published' ? 'success' : 'warning'}>
            {status === 'published' ? 'Published' : 'Draft'}
          </Badge>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatTile label="Questions" value={generation.question_count} tone="primary" />
        <StatTile label="Attempt" value={generation.attempt} />
        <StatTile
          label="Findings"
          value={generation.findings.length}
          tone={generation.findings.length > 0 ? 'warning' : 'success'}
        />
        <StatTile
          label={status === 'published' ? 'Published' : 'Generated'}
          value={
            <span className="text-sm">
              {status === 'published' && generation.published_at
                ? formatDateTime(generation.published_at)
                : generation.generated_at
                  ? formatDateTime(generation.generated_at)
                  : '—'}
            </span>
          }
        />
      </div>

      {generation.findings.length > 0 && (
        <Notice
          tone="warning"
          title="Validation findings"
          icon={<AlertOctagon className="w-4 h-4" />}
          className="mb-5"
        >
          <ul className="space-y-1 mt-1">
            {generation.findings.map((finding, i) => (
              <li key={i}>• {finding}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs opacity-80">
            You will be asked to acknowledge these before publishing.
          </p>
        </Notice>
      )}

      {generation.exam_id && (
        <div className="mb-5">
          <Link
            href={`/teacher/exams/${generation.exam_id}`}
            className="inline-flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-600"
          >
            Open in exams
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {hasExam && generation.exam_id && (
        <QuestionPreview
          key={generation.exam_id}
          examId={generation.exam_id}
          blueprint={plan?.blueprint ?? null}
        />
      )}
    </Card>
  );
}
