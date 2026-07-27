'use client';

import { AlertOctagon, Clock, MessageSquareQuote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { Notice } from '@/components/ui/feedback';
import { BlueprintPanel } from '@/components/assessments/artifacts/blueprint-panel';
import { CurriculumPanel } from '@/components/assessments/artifacts/curriculum-panel';
import { DifficultyPanel } from '@/components/assessments/artifacts/difficulty-panel';
import { QualityPanel } from '@/components/assessments/artifacts/quality-panel';
import { SchedulePanel } from '@/components/assessments/artifacts/schedule-panel';
import {
  AssessmentBlueprint,
  CurriculumOutline,
  DifficultyProfile,
  QualityReport,
  STAGE_META,
  SchedulePlan,
  StageKey,
  StageResponse,
} from '@/types/assessment';

/**
 * Exhaustive switch over the stage union.
 *
 * The `never` fallthrough means adding a sixth stage to StageKey becomes a
 * compile error here rather than a silently blank panel.
 */
export function ArtifactBody({
  stageKey,
  artifact,
}: {
  stageKey: StageKey;
  artifact: Record<string, unknown>;
}) {
  switch (stageKey) {
    case 'curriculum_analysis':
      return <CurriculumPanel artifact={artifact as unknown as CurriculumOutline} />;
    case 'assessment_design':
      return <BlueprintPanel artifact={artifact as unknown as AssessmentBlueprint} />;
    case 'quality_review':
      return <QualityPanel artifact={artifact as unknown as QualityReport} />;
    case 'difficulty_analysis':
      return <DifficultyPanel artifact={artifact as unknown as DifficultyProfile} />;
    case 'scheduling':
      return <SchedulePanel artifact={artifact as unknown as SchedulePlan} />;
    default: {
      const exhaustive: never = stageKey;
      return <p className="text-sm text-gray-500">Unknown stage: {String(exhaustive)}</p>;
    }
  }
}

export function StagePanel({
  stage,
  workflowError,
  children,
}: {
  stage: StageResponse;
  workflowError?: string | null;
  /** Checkpoint actions, rendered by the parent when this stage is actionable. */
  children?: React.ReactNode;
}) {
  const meta = STAGE_META[stage.stage_key];
  const isFailed = stage.status === 'failed';
  const notReached = !stage.artifact && !isFailed;

  return (
    <Card>
      <CardHeader
        title={meta.label}
        description={meta.describes}
        action={
          stage.revision > 1 ? (
            <Badge tone="warning" size="sm">
              Revision {stage.revision}
            </Badge>
          ) : undefined
        }
      />

      {/* The reviewer's feedback reads as a thread entry against this stage.
          Only the current revision's notes are available — the backend stores
          full checkpoint history but exposes no route to read it back. */}
      {stage.notes && (
        <div className="mb-5 rounded-lg border-l-2 border-primary-600 bg-gray-800/60 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <MessageSquareQuote className="w-3.5 h-3.5 text-primary-500" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-500">
              Your feedback
            </span>
          </div>
          <p className="text-sm text-gray-200 whitespace-pre-line">{stage.notes}</p>
        </div>
      )}

      {isFailed && (
        <Notice
          tone="danger"
          title="This step failed"
          icon={<AlertOctagon className="w-4 h-4" />}
          className="mb-5"
        >
          {workflowError || 'The AI could not complete this step.'}
        </Notice>
      )}

      {notReached ? (
        <div className="rounded-lg border border-dashed border-gray-700 bg-gray-800/30 p-6 text-center">
          <Clock className="w-5 h-5 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Not reached yet. When it runs, this step {meta.describes.charAt(0).toLowerCase()}
            {meta.describes.slice(1)}
          </p>
        </div>
      ) : (
        stage.artifact && (
          <ArtifactBody stageKey={stage.stage_key} artifact={stage.artifact} />
        )
      )}

      {children}
    </Card>
  );
}
