'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { assessmentApi } from '@/lib/ai/assessment-client';
import { NormalizedError, normalizeApiError } from '@/lib/errors';
import {
  GenerationResponse,
  QuestionConfig,
  StageKey,
  WorkflowState,
  WorkflowResponse,
} from '@/types/assessment';

export type PendingAction =
  | { kind: 'start' }
  | { kind: 'approve'; stage: StageKey }
  | { kind: 'reject'; stage: StageKey }
  | { kind: 'adjust' }
  | { kind: 'cancel' }
  | { kind: 'generate' }
  | { kind: 'publish' }
  | { kind: 'refresh' };

/** How often to re-read state while the server is working. Stages take tens of
 *  seconds, so this is about responsiveness, not precision. */
const POLL_INTERVAL_MS = 2500;

/** Is the server still doing something we are waiting on? Derived purely from
 *  persisted state — the backend commits `running` before invoking a handler,
 *  so this is genuine progress rather than an inference. */
export function isWorking(
  workflow: WorkflowResponse | null,
  generation: GenerationResponse | null
): boolean {
  if (generation?.status === 'generating') return true;
  if (!workflow) return false;
  if (workflow.stages.some((s) => s.status === 'running')) return true;
  // in_progress with nothing running means a stage is queued to run next.
  return workflow.state === 'in_progress';
}

/**
 * The workspace's single source of truth.
 *
 * Every mutation on this API returns the COMPLETE WorkflowResponse, so this
 * hook never computes the next state and never applies an optimistic update:
 * it replaces its snapshot with whatever the server returned. A failed action
 * must leave the previous snapshot untouched — a rejected approve must not
 * leave a stage looking approved.
 */
export function useAssessmentWorkflow(workflowId: string) {
  const [workflow, setWorkflow] = useState<WorkflowResponse | null>(null);
  const [generation, setGeneration] = useState<GenerationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [error, setError] = useState<NormalizedError | null>(null);
  /** Errors from the initial load are fatal to the page; action errors are not. */
  const [fatal, setFatal] = useState(false);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /**
   * Generation state only exists once something has been generated, and the
   * backend only allows an attempt on a COMPLETED workflow — so before then
   * there is nothing to ask for, and asking just 404s on every poll. A 404 that
   * does slip through is still the normal "nothing yet" case, not an error.
   */
  const loadGeneration = useCallback(async (id: string, state: WorkflowState) => {
    if (state !== 'completed') {
      if (mounted.current) setGeneration(null);
      return;
    }
    try {
      const data = await assessmentApi.getGeneration(id);
      if (mounted.current) setGeneration(data);
    } catch (err) {
      const normalized = normalizeApiError(err);
      if (mounted.current && normalized.kind === 'not_found') setGeneration(null);
    }
  }, []);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      try {
        const data = await assessmentApi.get(workflowId);
        if (!mounted.current) return;
        setWorkflow(data);
        setError(null);
        setFatal(false);
        await loadGeneration(workflowId, data.state);
      } catch (err) {
        if (!mounted.current) return;
        setError(normalizeApiError(err));
        setFatal(true);
      } finally {
        if (mounted.current) setLoading(false);
      }
    },
    [workflowId, loadGeneration]
  );

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * Poll while the server is working.
   *
   * The mutation endpoints now return as soon as the work is *claimed*, so the
   * request no longer blocks for minutes. Progress arrives by re-reading the
   * ordinary GET endpoint — the stage rows already carry `running`, so no job
   * ids, polling endpoints or streams were needed.
   */
  const working = isWorking(workflow, generation);
  useEffect(() => {
    if (!working) return;
    const id = setInterval(() => {
      // setState happens in the promise callbacks inside load(), never in this
      // effect body.
      void load({ silent: true });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [working, load]);

  /**
   * Runs one mutation. On success the snapshot is replaced; on failure the old
   * snapshot survives and the error is surfaced for the caller to render in
   * place. Returns true when the action succeeded.
   */
  const run = useCallback(
    async (action: PendingAction, fn: () => Promise<void>): Promise<boolean> => {
      setPendingAction(action);
      setError(null);
      try {
        await fn();
        return true;
      } catch (err) {
        if (mounted.current) setError(normalizeApiError(err));
        return false;
      } finally {
        if (mounted.current) setPendingAction(null);
      }
    },
    []
  );

  const start = useCallback(
    () =>
      run({ kind: 'start' }, async () => {
        const data = await assessmentApi.start(workflowId);
        if (mounted.current) setWorkflow(data);
      }),
    [run, workflowId]
  );

  const approve = useCallback(
    (stage: StageKey, notes?: string) =>
      run({ kind: 'approve', stage }, async () => {
        const data = await assessmentApi.approve(workflowId, stage, notes);
        if (mounted.current) setWorkflow(data);
      }),
    [run, workflowId]
  );

  const reject = useCallback(
    (stage: StageKey, notes: string, configPatch?: QuestionConfig | null) =>
      run({ kind: 'reject', stage }, async () => {
        const data = await assessmentApi.reject(workflowId, stage, notes, configPatch);
        if (mounted.current) setWorkflow(data);
      }),
    [run, workflowId]
  );

  const adjust = useCallback(
    (questionConfig: QuestionConfig) =>
      run({ kind: 'adjust' }, async () => {
        const data = await assessmentApi.adjust(workflowId, questionConfig);
        if (mounted.current) setWorkflow(data);
      }),
    [run, workflowId]
  );

  const cancel = useCallback(
    () =>
      run({ kind: 'cancel' }, async () => {
        const data = await assessmentApi.cancel(workflowId);
        if (mounted.current) setWorkflow(data);
      }),
    [run, workflowId]
  );

  const generate = useCallback(
    () =>
      run({ kind: 'generate' }, async () => {
        const data = await assessmentApi.generate(workflowId);
        if (mounted.current) setGeneration(data);
      }),
    [run, workflowId]
  );

  const publish = useCallback(
    (acknowledgeFindings: boolean) =>
      run({ kind: 'publish' }, async () => {
        const data = await assessmentApi.publish(workflowId, acknowledgeFindings);
        if (mounted.current) setGeneration(data);
      }),
    [run, workflowId]
  );

  /** Recovery path for a dropped connection: the server may have finished. */
  const refresh = useCallback(
    () => run({ kind: 'refresh' }, async () => load({ silent: true })),
    [run, load]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    workflow,
    generation,
    loading,
    pendingAction,
    /** True while the server is executing a stage or generating questions. */
    working,
    error,
    fatal,
    actions: { start, approve, reject, adjust, cancel, generate, publish, refresh, clearError },
  };
}
