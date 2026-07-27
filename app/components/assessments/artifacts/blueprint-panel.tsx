'use client';

import { AlertTriangle, PieChart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SectionTitle } from '@/components/ui/card';
import { MeterBar, Notice, StatTile } from '@/components/ui/feedback';
import { AiSummaryCard } from '@/components/assessments/findings-list';
import {
  AssessmentBlueprint,
  DIFFICULTY_LABELS,
  QUESTION_TYPE_LABELS,
} from '@/types/assessment';

const TYPE_COLORS: Record<string, string> = {
  mcq: 'bg-primary-600',
  short_answer: 'bg-sky-500',
  long_answer: 'bg-violet-500',
  true_false: 'bg-teal-500',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-500',
  medium: 'bg-amber-500',
  hard: 'bg-red-500',
};

function MixBreakdown({
  title,
  mix,
  labels,
  colors,
}: {
  title: string;
  mix: Record<string, number>;
  labels: Record<string, string>;
  colors: Record<string, string>;
}) {
  const entries = Object.entries(mix).filter(([, value]) => value > 0);
  if (!entries.length) {
    return (
      <div>
        <SectionTitle>{title}</SectionTitle>
        <p className="text-sm text-gray-500">
          Not specified — the AI was left to choose the balance.
        </p>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <MeterBar
        className="mb-3"
        segments={entries.map(([key, value]) => ({
          label: labels[key] || key,
          value,
          className: colors[key] || 'bg-gray-500',
        }))}
      />
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-sm ${colors[key] || 'bg-gray-500'}`} />
            <span className="text-sm text-gray-300">{labels[key] || key}</span>
            <span className="text-sm font-semibold text-white">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BlueprintPanel({ artifact }: { artifact: AssessmentBlueprint }) {
  return (
    <div className="space-y-6">
      <AiSummaryCard
        summary={artifact.rationale}
        fallbackTitle="Deterministic blueprint only"
        fallbackHint="Enable the Assessment Designer (AI_USE_ASSESSMENT_DESIGNER) to allocate questions across topics with a written rationale."
      />

      {artifact.validation_errors.length > 0 && (
        <Notice
          tone="danger"
          title="This blueprint has structural problems"
          icon={<AlertTriangle className="w-4 h-4" />}
        >
          <ul className="space-y-1 mt-1">
            {artifact.validation_errors.map((error, i) => (
              <li key={i}>• {error}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs opacity-80">
            The quality review will turn these into blockers. Use “Request changes” to correct the
            setup.
          </p>
        </Notice>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatTile label="Questions" value={artifact.total_questions} tone="primary" />
        <StatTile label="Points each" value={artifact.default_points} />
        <StatTile label="Total points" value={artifact.estimated_total_points} />
      </div>

      <MixBreakdown
        title="Question types"
        mix={artifact.type_mix}
        labels={QUESTION_TYPE_LABELS}
        colors={TYPE_COLORS}
      />

      <MixBreakdown
        title="Difficulty"
        mix={artifact.difficulty_mix}
        labels={DIFFICULTY_LABELS}
        colors={DIFFICULTY_COLORS}
      />

      {artifact.topic_allocations.length > 0 ? (
        <div>
          <SectionTitle hint="How the AI proposes to spread questions across your curriculum.">
            Topic allocation
          </SectionTitle>
          <ul className="space-y-2">
            {artifact.topic_allocations.map((allocation, index) => (
              <li
                key={`${allocation.topic_title}-${index}`}
                className="rounded-lg border border-gray-700 bg-gray-800/60 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{allocation.topic_title}</p>
                    {allocation.rationale && (
                      <p className="text-xs text-gray-400 mt-1">{allocation.rationale}</p>
                    )}
                  </div>
                  <Badge tone="primary" size="sm" className="shrink-0">
                    {allocation.question_count}{' '}
                    {allocation.question_count === 1 ? 'question' : 'questions'}
                  </Badge>
                </div>

                {(Object.keys(allocation.question_types).length > 0 ||
                  allocation.bloom_levels.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {Object.entries(allocation.question_types).map(([type, count]) => (
                      <Badge key={type} tone="neutral" size="sm">
                        {QUESTION_TYPE_LABELS[type] || type}: {count}
                      </Badge>
                    ))}
                    {allocation.bloom_levels.map((level) => (
                      <Badge key={level} tone="info" size="sm">
                        {level}
                      </Badge>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          <SectionTitle>Topic allocation</SectionTitle>
          <div className="rounded-lg border border-dashed border-gray-700 p-4 text-sm text-gray-500 flex items-start gap-3">
            <PieChart className="w-4 h-4 shrink-0 mt-0.5 text-gray-600" />
            <span>
              No per-topic allocation in this run. The counts above are derived from your setup;
              spreading them across topics requires the Assessment Designer agent.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
