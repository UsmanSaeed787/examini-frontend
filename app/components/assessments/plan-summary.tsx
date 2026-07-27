'use client';

import { CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, SectionTitle } from '@/components/ui/card';
import { StatTile } from '@/components/ui/feedback';
import { formatDateTime } from '@/lib/utils';
import { AssessmentPlan } from '@/types/assessment';

/** The five artifacts condensed into one reviewable brief, shown once the
 *  workflow reaches `completed`. */
export function PlanSummary({ plan }: { plan: AssessmentPlan }) {
  const readable = plan.outline.units.filter((u) => u.parseable).length;

  return (
    <Card tone="success">
      <CardHeader
        title="Your plan is approved"
        description={`Agreed ${formatDateTime(plan.approved_at)}. This is what the AI will build from.`}
        icon={<CheckCircle2 className="w-5 h-5 text-green-400" />}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatTile label="Questions" value={plan.blueprint.total_questions} tone="primary" />
        <StatTile label="Total points" value={plan.blueprint.estimated_total_points} />
        <StatTile label="Materials" value={`${readable} readable`} />
        <StatTile
          label="Duration"
          value={
            plan.schedule.duration_minutes ? `${plan.schedule.duration_minutes}m` : 'Not set'
          }
        />
      </div>

      <div className="space-y-4">
        {plan.outline.summary && (
          <div>
            <SectionTitle>Curriculum</SectionTitle>
            <p className="text-sm text-gray-300">{plan.outline.summary}</p>
          </div>
        )}

        {plan.blueprint.rationale && (
          <div>
            <SectionTitle>Design</SectionTitle>
            <p className="text-sm text-gray-300">{plan.blueprint.rationale}</p>
          </div>
        )}

        {plan.quality.summary && (
          <div>
            <SectionTitle>Quality</SectionTitle>
            <p className="text-sm text-gray-300">{plan.quality.summary}</p>
          </div>
        )}

        {plan.difficulty.assessment && (
          <div>
            <SectionTitle>Difficulty</SectionTitle>
            <p className="text-sm text-gray-300">{plan.difficulty.assessment}</p>
          </div>
        )}

        {plan.schedule.rationale && (
          <div>
            <SectionTitle>Scheduling</SectionTitle>
            <p className="text-sm text-gray-300">{plan.schedule.rationale}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Badge tone={plan.quality.passed ? 'success' : 'danger'} size="sm">
            Quality {plan.quality.passed ? 'passed' : 'failed'}
          </Badge>
          {plan.difficulty.calibration && (
            <Badge tone="info" size="sm">
              Difficulty: {plan.difficulty.calibration}
            </Badge>
          )}
          {plan.schedule.readiness && (
            <Badge tone="neutral" size="sm">
              Schedule: {plan.schedule.readiness.replace(/_/g, ' ')}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
