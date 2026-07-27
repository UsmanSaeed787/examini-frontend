'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, PlugZap, Plus, Sparkles } from 'lucide-react';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Badge, BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/feedback';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorSurface } from '@/components/assessments/error-surface';
import { useAssessmentList } from '@/hooks/use-assessment-list';
import { useAuthStore } from '@/store/auth-store';
import { formatDate } from '@/lib/utils';
import { STAGE_META, WorkflowState } from '@/types/assessment';

const STATE: Record<WorkflowState, { tone: BadgeTone; label: string }> = {
  draft: { tone: 'muted', label: 'Not started' },
  in_progress: { tone: 'primary', label: 'In progress' },
  awaiting_approval: { tone: 'warning', label: 'Needs your review' },
  completed: { tone: 'success', label: 'Plan approved' },
  cancelled: { tone: 'muted', label: 'Cancelled' },
  failed: { tone: 'danger', label: 'Failed' },
};

export default function AssessmentsPage() {
  const router = useRouter();
  const { isAuthenticated, user, initialized, initialize } = useAuthStore();
  const { workflows, aiEnabled, loading, error, reload } = useAssessmentList();

  useEffect(() => {
    if (!initialized) initialize();
  }, [initialized, initialize]);

  useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated || !user) {
      router.push('/login');
    } else if (user.role !== 'teacher') {
      router.push('/dashboard');
    }
  }, [initialized, isAuthenticated, user, router]);

  const active = workflows.filter(
    (w) => !['completed', 'cancelled', 'failed'].includes(w.state)
  );
  const past = workflows.filter((w) => ['completed', 'cancelled', 'failed'].includes(w.state));

  const renderRow = (workflow: (typeof workflows)[number]) => {
    const state = STATE[workflow.state];
    return (
      <Link key={workflow.id} href={`/teacher/assessments/${workflow.id}`} className="block">
        <div className="flex items-center gap-4 rounded-lg border border-gray-700 bg-gray-800/60 hover:bg-gray-800 hover:border-gray-600 p-4 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-primary-600/20 text-primary-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{workflow.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatDate(workflow.created_at)}
              {workflow.current_stage &&
                ` · ${STAGE_META[workflow.current_stage]?.label ?? workflow.current_stage}`}
            </p>
          </div>
          <Badge tone={state.tone} size="sm" className="shrink-0 hidden sm:inline-flex">
            {state.label}
          </Badge>
          <ArrowRight className="w-4 h-4 text-gray-600 shrink-0" />
        </div>
      </Link>
    );
  };

  return (
    <DashboardLayout role="teacher">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Guided assessments</h1>
            <p className="text-sm text-gray-400 mt-1">
              For exams that matter: the AI proposes a plan, you approve it, then it writes the
              questions.
            </p>
          </div>
          {aiEnabled !== false && (
            <Link href="/teacher/assessments/new">
              <Button variant="primary" className="w-full sm:w-auto">
                <span className="flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  New assessment
                </span>
              </Button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" width="100%" height={74} />
            ))}
          </div>
        ) : aiEnabled === false ? (
          <Card>
            <EmptyState
              icon={<PlugZap className="w-6 h-6" />}
              title="AI features are turned off"
              description="Guided assessments need the AI layer enabled by an administrator. In the meantime you can still put an exam together as a quick quiz."
              action={
                <Link href="/teacher/exams/generate">
                  <Button variant="outline">Create a quick quiz</Button>
                </Link>
              }
            />
          </Card>
        ) : error ? (
          <ErrorSurface error={error} onRetry={reload} />
        ) : workflows.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Sparkles className="w-6 h-6" />}
              title="No assessments yet"
              description="Instead of filling in a form, brief the AI on what you want to assess — then review the curriculum analysis, blueprint and quality checks before a single question is written."
              action={
                <Link href="/teacher/assessments/new">
                  <Button variant="primary">
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Create your first assessment
                    </span>
                  </Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="space-y-6">
            {active.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  In flight
                </h2>
                <div className="space-y-2">{active.map(renderRow)}</div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  History
                </h2>
                <div className="space-y-2">{past.map(renderRow)}</div>
              </section>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
