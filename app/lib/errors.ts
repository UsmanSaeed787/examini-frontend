/**
 * One normalizer for every error surfaced in the AI workspace.
 *
 * The backend renders both app errors and AI errors through the same envelope
 * (`{"error": {code, message, details}}`) — see
 * `backend/app/middleware/error_handler.py` and `backend/app/ai/runtime/errors.py`.
 * Nothing in the workspace should ever render a raw axios error.
 */
import { AxiosError } from 'axios';

export type ErrorKind =
  /** The AI layer is switched off entirely — a dead end, not a retry. */
  | 'ai_disabled'
  /** Daily quota spent; retrying now cannot help. */
  | 'quota'
  /** The model's output failed a guardrail. The system caught it. */
  | 'guardrail'
  /** The run exceeded its time budget server-side. */
  | 'timeout'
  /** The provider or run itself failed. */
  | 'run_failed'
  /** Input the server rejected. */
  | 'validation'
  /** The server failed to persist — commonly a schema/migration problem. */
  | 'server'
  | 'not_found'
  | 'forbidden'
  /** We never heard back — the server may well have succeeded. */
  | 'network'
  | 'unknown';

export interface NormalizedError {
  kind: ErrorKind;
  code: string;
  /** Server-authored message, safe to display. */
  message: string;
  /** Teacher-facing headline for this class of failure. */
  title: string;
  /** What the teacher can do about it, if anything. */
  hint?: string;
  details?: unknown;
  /** Whether offering "Try again" makes sense. */
  retryable: boolean;
  status?: number;
}

const CODE_MAP: Record<string, Omit<NormalizedError, 'code' | 'message' | 'details' | 'status'>> = {
  AI_DISABLED: {
    kind: 'ai_disabled',
    title: 'AI features are turned off',
    hint: 'An administrator needs to enable the AI layer for this workspace.',
    retryable: false,
  },
  AI_QUOTA_EXCEEDED: {
    kind: 'quota',
    title: "You've reached today's AI limit",
    hint: 'Your allowance resets at midnight UTC.',
    retryable: false,
  },
  AI_PROVIDER_RATE_LIMITED: {
    kind: 'quota',
    // Distinct from the above: this is the deployment's own AI plan, not the
    // teacher's allowance, so "wait" and "tell an administrator" are both valid.
    title: 'The AI service is busy or out of quota',
    hint: 'This is a limit on the service itself, not your account. Try again shortly — if it keeps happening, an administrator needs to check the AI plan.',
    retryable: true,
  },
  AI_GUARDRAIL_REJECTED: {
    kind: 'guardrail',
    title: "The AI's output didn't meet the required standard",
    hint: 'It was rejected before anything was saved. Running it again usually produces a valid result.',
    retryable: true,
  },
  AI_RUN_TIMEOUT: {
    kind: 'timeout',
    title: 'That took longer than allowed',
    hint: 'Some work may have been saved. Check the current status before retrying.',
    retryable: true,
  },
  AI_RUN_FAILED: {
    kind: 'run_failed',
    title: 'The AI service had a problem',
    hint: 'This is usually temporary.',
    retryable: true,
  },
  DATABASE_ERROR: {
    kind: 'server',
    title: 'The server could not save this',
    // The backend collapses every SQLAlchemyError into one opaque message, so
    // the most common cause is worth naming: a migration that has not been run
    // leaves the table missing and every write fails this way.
    hint: 'If this is a new install, check that all database migrations have been applied (alembic upgrade head).',
    retryable: true,
  },
  VALIDATION_ERROR: {
    kind: 'validation',
    title: "That didn't pass validation",
    retryable: false,
  },
  NOT_FOUND: {
    kind: 'not_found',
    title: 'Not found',
    retryable: false,
  },
  AUTHORIZATION_ERROR: {
    kind: 'forbidden',
    title: 'You do not have access to this',
    retryable: false,
  },
  AUTHENTICATION_ERROR: {
    kind: 'forbidden',
    title: 'Your session has expired',
    retryable: false,
  },
};

interface ErrorEnvelope {
  error?: { code?: string; message?: string; details?: unknown };
  detail?: unknown;
}

export function normalizeApiError(err: unknown): NormalizedError {
  const axiosError = err as AxiosError<ErrorEnvelope>;

  // No response at all: timeout, offline, CORS, dropped connection. This is
  // NOT proof the server failed — see the recovery card in the workspace.
  if (axiosError?.isAxiosError && !axiosError.response) {
    return {
      kind: 'network',
      code: axiosError.code || 'NETWORK_ERROR',
      title: 'We lost contact while the AI was working',
      message: 'Your progress is saved on the server.',
      hint: 'Check the current status before starting again.',
      retryable: true,
    };
  }

  const status = axiosError?.response?.status;
  const body = axiosError?.response?.data;
  const envelope = body?.error;

  if (envelope?.code) {
    const mapped = CODE_MAP[envelope.code];
    if (mapped) {
      return {
        ...mapped,
        code: envelope.code,
        message: envelope.message || mapped.title,
        details: envelope.details,
        status,
      };
    }
    return {
      kind: 'unknown',
      code: envelope.code,
      title: 'Something went wrong',
      message: envelope.message || 'An unexpected error occurred.',
      details: envelope.details,
      retryable: true,
      status,
    };
  }

  // FastAPI's own 422 shape, or a plain `detail` string.
  const detail = body?.detail;
  if (typeof detail === 'string') {
    return {
      kind: status === 404 ? 'not_found' : 'validation',
      code: 'DETAIL',
      title: status === 404 ? 'Not found' : "That didn't pass validation",
      message: detail,
      retryable: false,
      status,
    };
  }
  if (Array.isArray(detail)) {
    const first = detail[0] as { msg?: string } | undefined;
    return {
      kind: 'validation',
      code: 'REQUEST_VALIDATION',
      title: "That didn't pass validation",
      message: first?.msg || 'Please check the values you entered.',
      details: detail,
      retryable: false,
      status,
    };
  }

  return {
    kind: 'unknown',
    code: 'UNKNOWN',
    title: 'Something went wrong',
    message: axiosError?.message || 'An unexpected error occurred.',
    retryable: true,
    status,
  };
}
