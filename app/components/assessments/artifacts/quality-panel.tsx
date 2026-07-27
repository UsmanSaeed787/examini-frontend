'use client';

import { CheckCircle2, HelpCircle, XCircle } from 'lucide-react';
import { Badge, BadgeTone } from '@/components/ui/badge';
import { SectionTitle } from '@/components/ui/card';
import { AiSummaryCard, FindingsList } from '@/components/assessments/findings-list';
import {
  ALL_DIMENSIONS,
  DIMENSION_LABELS,
  DimensionVerdictValue,
  QualityDimension,
  QualityReport,
} from '@/types/assessment';

const VERDICT: Record<DimensionVerdictValue, { tone: BadgeTone; label: string }> = {
  pass: { tone: 'success', label: 'Pass' },
  concerns: { tone: 'warning', label: 'Concerns' },
  fail: { tone: 'danger', label: 'Fail' },
  not_assessable: { tone: 'muted', label: 'Not assessable' },
};

export function QualityPanel({ artifact }: { artifact: QualityReport }) {
  const byDimension = new Map<QualityDimension, { verdict: DimensionVerdictValue; comment: string }>();
  artifact.dimension_verdicts.forEach((v) => {
    byDimension.set(v.dimension, { verdict: v.verdict, comment: v.comment });
  });
  const hasAgentReview = artifact.dimension_verdicts.length > 0;

  return (
    <div className="space-y-6">
      {/* The pass/fail gate is deterministic and authoritative — the agent can
          add blockers but can never clear one. */}
      <div
        className={`rounded-xl border p-5 flex items-center gap-4 ${
          artifact.passed
            ? 'bg-green-500/10 border-green-500/40'
            : 'bg-red-500/10 border-red-500/40'
        }`}
      >
        {artifact.passed ? (
          <CheckCircle2 className="w-9 h-9 text-green-400 shrink-0" />
        ) : (
          <XCircle className="w-9 h-9 text-red-400 shrink-0" />
        )}
        <div>
          <p
            className={`text-xl font-bold ${artifact.passed ? 'text-green-400' : 'text-red-400'}`}
          >
            {artifact.passed ? 'Plan passed review' : 'Plan did not pass'}
          </p>
          <p className="text-sm text-gray-300 mt-0.5">
            {artifact.passed
              ? 'No structural blockers were found in the plan.'
              : 'This must be resolved before questions can be generated.'}
          </p>
        </div>
      </div>

      <AiSummaryCard
        summary={artifact.summary}
        fallbackTitle="Structural checks only"
        fallbackHint="Enable the Quality Reviewer (AI_USE_QUALITY_REVIEWER) to add a per-dimension review of coverage, balance, distribution, Bloom spread and policy fit."
      />

      <div>
        <SectionTitle
          hint={
            hasAgentReview
              ? undefined
              : 'These dimensions need the Quality Reviewer agent — the deterministic handler checks structure only, and reports honestly rather than assuming a pass.'
          }
        >
          Review dimensions
        </SectionTitle>
        <ul className="divide-y divide-gray-700 rounded-lg border border-gray-700 overflow-hidden">
          {ALL_DIMENSIONS.map((dimension) => {
            const entry = byDimension.get(dimension);
            const config = VERDICT[entry?.verdict ?? 'not_assessable'];
            return (
              <li key={dimension} className="bg-gray-800/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-100">
                      {DIMENSION_LABELS[dimension]}
                    </p>
                    {entry?.comment ? (
                      <p className="text-xs text-gray-400 mt-1">{entry.comment}</p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                        <HelpCircle className="w-3 h-3" />
                        No data available for this dimension in this run.
                      </p>
                    )}
                  </div>
                  <Badge tone={config.tone} size="sm" className="shrink-0">
                    {config.label}
                  </Badge>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <FindingsList
        findings={artifact.findings}
        emptyMessage="No structural problems were found."
      />
    </div>
  );
}
