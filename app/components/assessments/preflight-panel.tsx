'use client';

import { Play, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, SectionTitle } from '@/components/ui/card';
import { StatTile } from '@/components/ui/feedback';
import { formatDateTime } from '@/lib/utils';
import {
  ApprovalMode,
  DIFFICULTY_LABELS,
  QUESTION_TYPE_LABELS,
  STAGE_META,
  StageKey,
  WorkflowResponse,
} from '@/types/assessment';

const MODE_LABEL: Record<ApprovalMode, string> = {
  every_stage: 'You review each step',
  final_only: 'You review once at the end',
  none: 'Fully automatic',
};

/**
 * What a `draft` workflow shows. Creation never auto-starts — this is the
 * teacher's last look before spending a model run.
 */
export function PreflightPanel({
  workflow,
  onStart,
  busy,
}: {
  workflow: WorkflowResponse;
  onStart: () => void;
  busy: boolean;
}) {
  const config = workflow.config.question_config ?? {};
  const materialCount = workflow.config.material_ids?.length ?? 0;

  const typeEntries = Object.entries(config).filter(
    ([key, value]) => key in QUESTION_TYPE_LABELS && (value ?? 0) > 0
  );
  const difficultyEntries = Object.entries(config).filter(
    ([key, value]) => key in DIFFICULTY_LABELS && (value ?? 0) > 0
  );

  return (
    <Card>
      <CardHeader
        title="Ready when you are"
        description="Nothing has run yet. Here is what the AI will work from."
        icon={<Sparkles className="w-5 h-5" />}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatTile label="Materials" value={materialCount} />
        <StatTile label="Questions" value={config.total ?? '—'} tone="primary" />
        <StatTile
          label="Duration"
          value={workflow.config.duration_minutes ? `${workflow.config.duration_minutes}m` : '—'}
        />
        <StatTile label="Review mode" value={<span className="text-sm">{MODE_LABEL[workflow.approval_mode]}</span>} />
      </div>

      {(typeEntries.length > 0 || difficultyEntries.length > 0) && (
        <div className="mb-6">
          <SectionTitle>Your question mix</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {typeEntries.map(([key, value]) => (
              <Badge key={key} tone="neutral" size="sm">
                {QUESTION_TYPE_LABELS[key]}: {value}
              </Badge>
            ))}
            {difficultyEntries.map(([key, value]) => (
              <Badge key={key} tone="info" size="sm">
                {DIFFICULTY_LABELS[key]}: {value}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {(workflow.config.proposed_start || workflow.config.proposed_end) && (
        <div className="mb-6">
          <SectionTitle>Proposed window</SectionTitle>
          <p className="text-sm text-gray-300">
            {workflow.config.proposed_start
              ? formatDateTime(workflow.config.proposed_start)
              : 'No start'}
            {workflow.config.proposed_end
              ? ` → ${formatDateTime(workflow.config.proposed_end)}`
              : ''}
          </p>
        </div>
      )}

      <div className="mb-6">
        <SectionTitle hint="Each step produces something you can read and question.">
          {workflow.stages.length} steps will run
        </SectionTitle>
        <ol className="space-y-2">
          {workflow.stages.map((stage, index) => (
            <li key={stage.stage_key} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-gray-700 text-gray-400 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-gray-200">
                  {STAGE_META[stage.stage_key as StageKey]?.label ?? stage.stage_key}
                </p>
                <p className="text-xs text-gray-500">
                  {STAGE_META[stage.stage_key as StageKey]?.describes}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <Button variant="primary" onClick={onStart} disabled={busy} className="w-full sm:w-auto">
        <span className="flex items-center justify-center gap-2">
          <Play className="w-4 h-4" />
          Start the analysis
        </span>
      </Button>
    </Card>
  );
}
