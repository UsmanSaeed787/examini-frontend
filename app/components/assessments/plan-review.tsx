'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { Notice, StatTile } from '@/components/ui/feedback';
import { ArtifactBody } from '@/components/assessments/stage-panel';
import { cn } from '@/lib/utils';
import {
  AssessmentBlueprint,
  CurriculumOutline,
  Finding,
  QualityReport,
  STAGE_META,
  StageKey,
  StageResponse,
} from '@/types/assessment';

/**
 * The single consolidated checkpoint.
 *
 * Under `final_only` (and `none`) the pipeline stops once, on the last stage —
 * so showing only that stage's artifact would ask the teacher to approve an
 * entire plan while looking at a duration estimate. This stacks every artifact
 * produced so far, with the stage actually under review expanded.
 */
export function PlanReview({
  stages,
  reviewStageKey,
  children,
}: {
  stages: StageResponse[];
  reviewStageKey: StageKey;
  /** Checkpoint actions, rendered by the parent. */
  children?: React.ReactNode;
}) {
  const produced = stages.filter((s) => s.artifact);
  const [open, setOpen] = useState<Set<string>>(new Set([reviewStageKey]));

  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const artifactFor = <T,>(key: StageKey): T | null =>
    (produced.find((s) => s.stage_key === key)?.artifact as T | undefined) ?? null;

  const blueprint = artifactFor<AssessmentBlueprint>('assessment_design');
  const quality = artifactFor<QualityReport>('quality_review');
  const outline = artifactFor<CurriculumOutline>('curriculum_analysis');
  const readable = outline?.units.filter((u) => u.parseable).length ?? 0;

  /**
   * Blockers decide whether this plan can become an exam at all, so they belong
   * at the top of the decision — not folded inside a collapsed section the
   * teacher has to go looking for.
   */
  const blockers = produced
    .flatMap((s) => ((s.artifact as { findings?: Finding[] })?.findings ?? []))
    .filter((f) => f.severity === 'blocker');
  const seen = new Set<string>();
  const uniqueBlockers = blockers.filter((f) =>
    seen.has(f.message) ? false : (seen.add(f.message), true)
  );

  return (
    <Card>
      <CardHeader
        title="Review the full plan"
        description="Everything the AI produced, in one place. Approving releases it for question generation."
        icon={<ClipboardCheck className="w-5 h-5" />}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatTile label="Questions" value={blueprint?.total_questions ?? '—'} tone="primary" />
        <StatTile label="Total points" value={blueprint?.estimated_total_points ?? '—'} />
        <StatTile label="Materials" value={`${readable} readable`} />
        <StatTile
          label="Quality"
          value={
            quality ? (
              <span className="flex items-center gap-1.5 text-base">
                {quality.passed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Passed
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-400" />
                    Failed
                  </>
                )}
              </span>
            ) : (
              '—'
            )
          }
          tone={quality?.passed ? 'success' : quality ? 'danger' : 'default'}
        />
      </div>

      {uniqueBlockers.length > 0 && (
        <Notice
          tone="danger"
          title={
            uniqueBlockers.length === 1
              ? 'This plan cannot become an exam yet'
              : `${uniqueBlockers.length} problems block this plan`
          }
          icon={<ShieldAlert className="w-4 h-4" />}
          className="mb-5"
        >
          <ul className="space-y-1 mt-1">
            {uniqueBlockers.map((f, i) => (
              <li key={i}>• {f.message}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs opacity-80">
            Question generation will refuse a plan with unresolved blockers. Fix the cause, then
            use “Request changes” to re-run.
          </p>
        </Notice>
      )}

      <div className="space-y-2">
        {produced.map((stage) => {
          const meta = STAGE_META[stage.stage_key];
          const isOpen = open.has(stage.stage_key);
          const isUnderReview = stage.stage_key === reviewStageKey;

          return (
            <div
              key={stage.stage_key}
              className={cn(
                'rounded-xl border overflow-hidden',
                isUnderReview ? 'border-primary-600/40' : 'border-gray-700'
              )}
            >
              <button
                type="button"
                onClick={() => toggle(stage.stage_key)}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-3 p-3 bg-gray-800/60 hover:bg-gray-800 transition-colors text-left"
              >
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-white">{meta.label}</span>
                  <span className="block text-xs text-gray-500">{meta.describes}</span>
                </span>
                {stage.revision > 1 && (
                  <Badge tone="warning" size="sm" className="shrink-0">
                    Rev {stage.revision}
                  </Badge>
                )}
              </button>

              {isOpen && stage.artifact && (
                <div className="p-4 border-t border-gray-700">
                  <ArtifactBody stageKey={stage.stage_key} artifact={stage.artifact} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {children}
    </Card>
  );
}
