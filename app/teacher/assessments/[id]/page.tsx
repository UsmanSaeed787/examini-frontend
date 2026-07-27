'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertOctagon, Ban } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Notice } from '@/components/ui/feedback';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckpointActions } from '@/components/assessments/checkpoint-actions';
import { ErrorSurface } from '@/components/assessments/error-surface';
import { GenerationPanel } from '@/components/assessments/generation-panel';
import { PlanReview } from '@/components/assessments/plan-review';
import { PlanSummary } from '@/components/assessments/plan-summary';
import { PreflightPanel } from '@/components/assessments/preflight-panel';
import { PublishPanel } from '@/components/assessments/publish-panel';
import { StagePanel } from '@/components/assessments/stage-panel';
import {
  TimelineNodeKey,
  WorkflowStepper,
  WorkflowTimeline,
} from '@/components/assessments/workflow-timeline';
import { WorkflowHeader } from '@/components/assessments/workflow-header';
import { StageProgress } from '@/components/assessments/stage-progress';
import { WorkingCard } from '@/components/assessments/working-card';
import { useAssessmentWorkflow } from '@/hooks/use-assessment-workflow';
import { useAuthStore } from '@/store/auth-store';
import { teacherApi } from '@/lib/api';
import {
  QuestionConfig,

  StageKey,
  StageResponse,
  WorkflowResponse,
} from '@/types/assessment';

function WorkspaceSkeleton() {
  return (
    <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-6">
      <div className="hidden lg:block space-y-2">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" width="100%" height={44} />
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton variant="rectangular" width="100%" height={120} />
        <Skeleton variant="rectangular" width="100%" height={220} />
      </div>
    </div>
  );
}

/** The stage the teacher is being asked to decide on, if any. */
function findReviewStage(workflow: WorkflowResponse): StageResponse | null {
  return workflow.stages.find((s) => s.status === 'in_review' && s.requires_checkpoint) ?? null;
}

export default function AssessmentWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = String(params.id);

  const { isAuthenticated, user, initialized, initialize } = useAuthStore();
  const { workflow, generation, loading, pendingAction, working, error, fatal, actions } =
    useAssessmentWorkflow(workflowId);

  /**
   * What the teacher explicitly clicked, tagged with the review context it was
   * clicked in. Scoping it this way means they can browse any artifact freely
   * while deciding, but a *new* stage entering review discards the stale pick
   * and pulls focus — without an effect syncing state.
   */
  const [picked, setPicked] = useState<{ node: TimelineNodeKey; context: string } | null>(
    null
  );
  const [className, setClassName] = useState<string | null>(null);

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

  const reviewStage = workflow ? findReviewStage(workflow) : null;
  /** Changes whenever a different stage — or a new revision of one — enters
   *  review, which is precisely when a previous pick should be dropped. */
  const reviewContext = reviewStage
    ? `${reviewStage.stage_key}:${reviewStage.revision}`
    : 'none';

  /**
   * Which node the panel shows: the teacher's own choice while it is still
   * current, otherwise whatever needs their attention, otherwise the server's
   * pointer.
   */
  const selected: TimelineNodeKey | null = useMemo(() => {
    if (!workflow) return null;
    if (picked && picked.context === reviewContext) return picked.node;
    if (reviewStage) return reviewStage.stage_key;
    if (workflow.current_stage) return workflow.current_stage;
    if (workflow.state === 'completed') {
      return generation?.status === 'published' ? 'publish' : 'questions';
    }
    const lastWithArtifact = [...workflow.stages].reverse().find((s) => s.artifact);
    return lastWithArtifact?.stage_key ?? workflow.stages[0]?.stage_key ?? null;
  }, [workflow, generation, picked, reviewContext, reviewStage]);

  const selectNode = useCallback(
    (node: TimelineNodeKey) => setPicked({ node, context: reviewContext }),
    [reviewContext]
  );

  useEffect(() => {
    if (!workflow?.class_id) return;
    teacherApi
      .getClasses()
      .then((data: Array<{ id: string; name: string }>) => {
        const match = Array.isArray(data) ? data.find((c) => c.id === workflow.class_id) : null;
        setClassName(match?.name ?? null);
      })
      .catch(() => setClassName(null));
  }, [workflow?.class_id]);

  // Obsolete since progress became real: StageProgress reads the live stage
  // statuses instead of listing what we guessed was coming.
  const busy = pendingAction !== null;

  if (loading) {
    return (
      <DashboardLayout role="teacher">
        <div className="p-4 sm:p-6">
          <WorkspaceSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  if (fatal && error) {
    return (
      <DashboardLayout role="teacher">
        <div className="p-4 sm:p-6 max-w-2xl">
          <ErrorSurface error={error} onRefresh={actions.refresh} onRetry={actions.refresh} />
        </div>
      </DashboardLayout>
    );
  }

  if (!workflow) return null;

  const selectedStage = workflow.stages.find((s) => s.stage_key === selected) ?? null;
  const questionConfig = (workflow.config.question_config ?? {}) as QuestionConfig;
  const isReadOnly =
    workflow.state === 'cancelled' || generation?.status === 'published';
  const lastStageKey = workflow.stages[workflow.stages.length - 1]?.stage_key;
  const isFinalCheckpoint = reviewStage?.stage_key === lastStageKey;
  const producedCount = workflow.stages.filter((s) => s.artifact).length;

  /* ------------------------------------------------------------- main body */
  const renderBody = () => {
    // Real progress: the server records which stage is running, so this shows
    // the actual step rather than a timer pretending to know.
    if (working) {
      return <StageProgress workflow={workflow} generation={generation} />;
    }

    // Short-lived: the mutation endpoints return as soon as the work is
    // claimed, so this only covers the request itself.
    if (busy && pendingAction) {
      if (pendingAction.kind === 'publish') {
        return <WorkingCard title="Publishing" doing="Releasing the exam to your students." />;
      }
      return (
        <WorkingCard
          title="Handing this to the AI"
          doing="Recording your decision and queueing the next step."
        />
      );
    }

    if (workflow.state === 'draft') {
      return <PreflightPanel workflow={workflow} onStart={actions.start} busy={busy} />;
    }

    if (workflow.state === 'cancelled') {
      return (
        <Card tone="muted">
          <Notice tone="muted" title="This assessment was cancelled" icon={<Ban className="w-4 h-4" />}>
            Everything the AI produced is preserved above, but the workflow cannot be resumed.
          </Notice>
        </Card>
      );
    }

    if (selected === 'questions') {
      return (
        <GenerationPanel
          plan={workflow.result}
          generation={generation}
          questionConfig={questionConfig}
          onGenerate={actions.generate}
          onAdjust={async (config) => {
            const ok = await actions.adjust(config);
            if (ok) toast.success('Mix updated — the plan is being recalculated');
          }}
          busy={busy}
        />
      );
    }

    if (selected === 'publish') {
      return (
        <PublishPanel
          plan={workflow.result}
          generation={generation}
          className={className}
          onPublish={async (acknowledge) => {
            const ok = await actions.publish(acknowledge);
            if (ok) toast.success('Assessment published');
          }}
          busy={busy}
        />
      );
    }

    if (!selectedStage) return null;

    const isActionable =
      reviewStage?.stage_key === selectedStage.stage_key && !isReadOnly;

    const checkpointActions = isActionable ? (
      <CheckpointActions
        stageKey={selectedStage.stage_key as StageKey}
        currentConfig={questionConfig}
        busy={busy}
        onApprove={async (notes) => {
          const ok = await actions.approve(selectedStage.stage_key, notes);
          if (ok) toast.success('Approved');
        }}
        onReject={async (notes, patch) => {
          const ok = await actions.reject(selectedStage.stage_key, notes, patch);
          if (ok) toast.success('Feedback sent — the step is running again');
        }}
        onAdjust={async (questionConfig) => {
          const ok = await actions.adjust(questionConfig);
          if (ok) toast.success('Mix updated — the plan is being recalculated');
        }}
      />
    ) : null;

    // A single checkpoint on the last stage means approving the WHOLE plan, so
    // show the whole plan rather than just that stage's artifact.
    if (isActionable && isFinalCheckpoint && producedCount > 1) {
      return (
        <PlanReview
          stages={workflow.stages}
          reviewStageKey={selectedStage.stage_key as StageKey}
        >
          {checkpointActions}
        </PlanReview>
      );
    }

    return (
      <StagePanel stage={selectedStage} workflowError={workflow.error}>
        {checkpointActions}
      </StagePanel>
    );
  };

  return (
    <DashboardLayout role="teacher">
      <div className="p-4 sm:p-6">
        <WorkflowHeader
          workflow={workflow}
          onCancel={async () => {
            const ok = await actions.cancel();
            if (ok) toast.success('Assessment cancelled');
          }}
          onRefresh={actions.refresh}
          busy={busy}
          refreshing={pendingAction?.kind === 'refresh'}
        />

        {workflow.state === 'failed' && workflow.error && (
          <Notice
            tone="danger"
            title="This assessment stopped with an error"
            icon={<AlertOctagon className="w-4 h-4" />}
            className="mb-4"
          >
            {workflow.error}
          </Notice>
        )}

        {/* Action errors render in place, above the panel, and never replace
            the snapshot the teacher was looking at. */}
        {error && !fatal && (
          <div className="mb-4">
            <ErrorSurface error={error} onRefresh={actions.refresh} onRetry={actions.clearError} retryLabel="Dismiss" />
          </div>
        )}

        {/* Horizontal stepper below lg, vertical rail from lg up. */}
        {selected && workflow.state !== 'draft' && (
          <div className="lg:hidden mb-4">
            <WorkflowStepper
              workflow={workflow}
              generation={generation}
              selected={selected}
              onSelect={selectNode}
            />
          </div>
        )}

        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-6 lg:items-start">
          {selected && workflow.state !== 'draft' && (
            <aside className="hidden lg:block lg:sticky lg:top-20">
              <WorkflowTimeline
                workflow={workflow}
                generation={generation}
                selected={selected}
                onSelect={selectNode}
              />
            </aside>
          )}

          <main className={workflow.state === 'draft' ? 'lg:col-span-2 max-w-3xl' : 'min-w-0'}>
            {workflow.state === 'completed' && workflow.result && selected !== 'publish' && (
              <div className="mb-4">
                <PlanSummary plan={workflow.result} />
              </div>
            )}
            {renderBody()}
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}
