'use client';

import { CalendarClock, CalendarX2, Lightbulb } from 'lucide-react';
import { Badge, BadgeTone } from '@/components/ui/badge';
import { SectionTitle } from '@/components/ui/card';
import { Notice, StatTile } from '@/components/ui/feedback';
import { AiSummaryCard, FindingsList } from '@/components/assessments/findings-list';
import { formatDateTime } from '@/lib/utils';
import { QUESTION_TYPE_LABELS, ScheduleReadiness, SchedulePlan } from '@/types/assessment';

const READINESS: Record<ScheduleReadiness, { tone: BadgeTone; label: string }> = {
  ready: { tone: 'success', label: 'Ready to run' },
  adjust: { tone: 'warning', label: 'Workable — needs an adjustment' },
  blocked: { tone: 'danger', label: 'Cannot run as proposed' },
  insufficient_information: { tone: 'muted', label: 'No window proposed' },
};

export function SchedulePanel({ artifact }: { artifact: SchedulePlan }) {
  const readiness = artifact.readiness ? READINESS[artifact.readiness] : null;
  const estimate = artifact.estimated_duration_minutes;
  const requested = artifact.duration_minutes;
  const tooShort = estimate != null && requested != null && estimate > requested;

  return (
    <div className="space-y-6">
      <AiSummaryCard
        summary={artifact.rationale}
        fallbackTitle="Deterministic scheduling checks only"
        fallbackHint="Enable the Scheduler (AI_USE_SCHEDULER) to add a readiness verdict and recommendations. Publishing always stays a human action."
      />

      {readiness && (
        <div>
          <SectionTitle>Readiness</SectionTitle>
          <Badge tone={readiness.tone}>{readiness.label}</Badge>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatTile
          label="Duration"
          value={requested != null ? `${requested} min` : 'Not set'}
          sublabel="Your setting"
          tone="primary"
        />
        <StatTile
          label="AI estimate"
          value={estimate != null ? `${estimate} min` : '—'}
          sublabel="From the question mix"
          tone={tooShort ? 'warning' : 'default'}
        />
        <StatTile
          label="Window"
          value={artifact.window_minutes != null ? `${Math.round(artifact.window_minutes)} min` : '—'}
          sublabel="Availability period"
        />
      </div>

      {tooShort && (
        <Notice tone="warning" title="The estimate exceeds your duration" icon={<CalendarClock className="w-4 h-4" />}>
          The question mix suggests students need around {estimate} minutes, but the exam is set to{' '}
          {requested}.
        </Notice>
      )}

      <div>
        <SectionTitle>Proposed window</SectionTitle>
        {artifact.proposed_start || artifact.proposed_end ? (
          <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-4 space-y-2">
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-gray-400">Opens</span>
              <span className="text-gray-100 text-right">
                {artifact.proposed_start ? formatDateTime(artifact.proposed_start) : 'Not set'}
              </span>
            </div>
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-gray-400">Closes</span>
              <span className="text-gray-100 text-right">
                {artifact.proposed_end ? formatDateTime(artifact.proposed_end) : 'Not set'}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No window was proposed. You can still generate questions and set dates on the exam
            afterwards.
          </p>
        )}
      </div>

      {Object.keys(artifact.duration_basis).length > 0 && (
        <div>
          <SectionTitle hint="Minutes allowed per question type when estimating.">
            How the estimate was built
          </SectionTitle>
          <div className="flex flex-wrap gap-2">
            {Object.entries(artifact.duration_basis).map(([type, minutes]) => (
              <Badge key={type} tone="neutral" size="sm">
                {QUESTION_TYPE_LABELS[type] || type}: {minutes} min
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div>
        <SectionTitle hint="Other exams for this class whose window overlaps this one.">
          Calendar conflicts
        </SectionTitle>
        {artifact.conflicts.length > 0 ? (
          <ul className="space-y-2">
            {artifact.conflicts.map((conflict) => (
              <li
                key={conflict.exam_id}
                className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"
              >
                <CalendarX2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-100">{conflict.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {conflict.start_date ? formatDateTime(conflict.start_date) : 'No start'}
                    {conflict.overlap_minutes != null &&
                      ` · overlaps by ${Math.round(conflict.overlap_minutes)} min`}
                  </p>
                </div>
                <Badge tone={conflict.is_published ? 'warning' : 'muted'} size="sm">
                  {conflict.is_published ? 'Published' : 'Draft'}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            No other exam for this class overlaps the proposed window.
          </p>
        )}
      </div>

      {artifact.recommended_duration_minutes != null && (
        <Notice tone="info" title="Suggested duration" icon={<Lightbulb className="w-4 h-4" />}>
          The AI suggests {artifact.recommended_duration_minutes} minutes. This is advice only — your
          setting of {requested ?? '—'} minutes is what will be used.
        </Notice>
      )}

      {artifact.recommendations.length > 0 && (
        <div>
          <SectionTitle>Recommendations</SectionTitle>
          <ul className="space-y-2">
            {artifact.recommendations.map((rec, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg border border-gray-700 bg-gray-800/60 p-3"
              >
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-200">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <FindingsList findings={artifact.findings} emptyMessage="No scheduling problems found." />
    </div>
  );
}
