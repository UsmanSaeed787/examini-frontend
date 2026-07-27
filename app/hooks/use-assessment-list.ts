'use client';

import { useCallback, useEffect, useState } from 'react';
import { aiApi, assessmentApi } from '@/lib/ai/assessment-client';
import { NormalizedError, normalizeApiError } from '@/lib/errors';
import { WorkflowSummaryResponse } from '@/types/assessment';

/**
 * Workspace home data: the teacher's workflows plus whether the AI layer is
 * switched on at all. Capability detection is separate from the list because
 * `AI_DISABLED` is a full-page dead end, not a list error.
 */
export function useAssessmentList() {
  const [workflows, setWorkflows] = useState<WorkflowSummaryResponse[]>([]);
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedError | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const capabilities = await aiApi.capabilities();
      setAiEnabled(capabilities.enabled);
      if (!capabilities.enabled) {
        setWorkflows([]);
        return;
      }
      setWorkflows(await assessmentApi.list());
    } catch (err) {
      const normalized = normalizeApiError(err);
      // A 403 AI_DISABLED from either call means the same thing as
      // capabilities.enabled === false.
      if (normalized.kind === 'ai_disabled') {
        setAiEnabled(false);
        setWorkflows([]);
      } else {
        setError(normalized);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { workflows, aiEnabled, loading, error, reload: load };
}
