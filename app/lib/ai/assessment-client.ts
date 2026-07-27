/**
 * Typed client for the Assessment Intelligence workflow API.
 *
 * Goes through the shared axios instance in `lib/api.ts`, so bearer auth and
 * transparent 401 refresh apply unchanged. This module adds no logic beyond
 * shaping requests and responses — all behaviour lives in the backend.
 */
import api from '@/lib/api';
import {
  AiCapabilitiesResponse,
  CreateWorkflowRequest,
  GenerationHistoryResponse,
  GenerationResponse,
  QuestionConfig,
  StageKey,
  WorkflowResponse,
  WorkflowSummaryResponse,
} from '@/types/assessment';

const BASE = '/api/ai/workflows/assessment';

/**
 * Long-running calls. The pipeline runs synchronously inside the request and a
 * single stage may take up to AI_RUN_TIMEOUT_SECONDS (180s by default); an
 * approve under `final_only`/`none` can chain several. We allow generous
 * headroom over that so the client does not give up on work the server is
 * still committing.
 */
const LONG_RUNNING = { timeout: 15 * 60 * 1000 };

export const assessmentApi = {
  // -------------------------------------------------------------- workflow
  create: async (payload: CreateWorkflowRequest): Promise<WorkflowResponse> => {
    const { data } = await api.post(BASE, payload);
    return data;
  },

  list: async (): Promise<WorkflowSummaryResponse[]> => {
    const { data } = await api.get(BASE);
    return data;
  },

  get: async (id: string): Promise<WorkflowResponse> => {
    const { data } = await api.get(`${BASE}/${id}`);
    return data;
  },

  start: async (id: string): Promise<WorkflowResponse> => {
    const { data } = await api.post(`${BASE}/${id}/start`, undefined, LONG_RUNNING);
    return data;
  },

  approve: async (id: string, stage: StageKey, notes?: string): Promise<WorkflowResponse> => {
    const { data } = await api.post(
      `${BASE}/${id}/stages/${stage}/approve`,
      { notes: notes || null },
      LONG_RUNNING
    );
    return data;
  },

  reject: async (
    id: string,
    stage: StageKey,
    notes: string,
    configPatch?: QuestionConfig | null
  ): Promise<WorkflowResponse> => {
    const { data } = await api.post(
      `${BASE}/${id}/stages/${stage}/reject`,
      { notes, config_patch: configPatch ? { question_config: configPatch } : null },
      LONG_RUNNING
    );
    return data;
  },

  /**
   * Change the question mix without a model call. The counterpart to reject:
   * reject asks the AI to reconsider, adjust states what the numbers are.
   * Still long-running-capable because the downstream stages recompute.
   */
  adjust: async (id: string, questionConfig: QuestionConfig): Promise<WorkflowResponse> => {
    const { data } = await api.post(
      `${BASE}/${id}/adjust`,
      { question_config: questionConfig },
      LONG_RUNNING
    );
    return data;
  },

  cancel: async (id: string): Promise<WorkflowResponse> => {
    const { data } = await api.post(`${BASE}/${id}/cancel`);
    return data;
  },

  // -------------------------------------------------------- materialization
  generate: async (id: string): Promise<GenerationResponse> => {
    const { data } = await api.post(`${BASE}/${id}/generate`, undefined, LONG_RUNNING);
    return data;
  },

  getGeneration: async (id: string): Promise<GenerationResponse> => {
    const { data } = await api.get(`${BASE}/${id}/generation`);
    return data;
  },

  getGenerationHistory: async (id: string): Promise<GenerationHistoryResponse> => {
    const { data } = await api.get(`${BASE}/${id}/generations`);
    return data;
  },

  publish: async (id: string, acknowledgeFindings: boolean): Promise<GenerationResponse> => {
    const { data } = await api.post(`${BASE}/${id}/publish`, {
      acknowledge_findings: acknowledgeFindings,
    });
    return data;
  },
};

export const aiApi = {
  capabilities: async (): Promise<AiCapabilitiesResponse> => {
    const { data } = await api.get('/api/ai/capabilities');
    return data;
  },
};
