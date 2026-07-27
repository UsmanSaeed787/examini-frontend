'use client';

import {
  AlertOctagon,
  Database,
  PlugZap,
  RefreshCw,
  ShieldAlert,
  Timer,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/feedback';
import { NormalizedError } from '@/lib/errors';

const ICONS = {
  ai_disabled: PlugZap,
  quota: Timer,
  guardrail: ShieldAlert,
  timeout: Timer,
  run_failed: AlertOctagon,
  validation: AlertOctagon,
  server: Database,
  not_found: AlertOctagon,
  forbidden: ShieldAlert,
  network: WifiOff,
  unknown: AlertOctagon,
} as const;

/**
 * Renders an action error in place, where the action was taken.
 *
 * A dropped connection is treated specially: the synchronous API means the
 * server may well have finished the work, so we offer "Check current status"
 * rather than an error the teacher might respond to by re-running everything.
 */
export function ErrorSurface({
  error,
  onRetry,
  onRefresh,
  retryLabel = 'Try again',
}: {
  error: NormalizedError;
  onRetry?: () => void;
  onRefresh?: () => void;
  retryLabel?: string;
}) {
  const Icon = ICONS[error.kind] ?? AlertOctagon;
  const isNetwork = error.kind === 'network' || error.kind === 'timeout';

  const tone =
    error.kind === 'quota' || error.kind === 'guardrail' || isNetwork ? 'warning' : 'danger';

  const details =
    error.details && typeof error.details === 'object'
      ? (error.details as Record<string, unknown>)
      : null;
  const detailErrors = Array.isArray(details?.errors) ? (details.errors as string[]) : null;

  return (
    <Notice
      tone={tone}
      title={error.title}
      icon={<Icon className="w-4 h-4" />}
      action={
        <>
          {isNetwork && onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Check current status
              </span>
            </Button>
          )}
          {error.retryable && !isNetwork && onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              {retryLabel}
            </Button>
          )}
        </>
      }
    >
      <p>{error.message}</p>
      {detailErrors && detailErrors.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs opacity-90">
          {detailErrors.map((item, i) => (
            <li key={i}>• {item}</li>
          ))}
        </ul>
      )}
      {error.hint && <p className="mt-2 text-xs opacity-80">{error.hint}</p>}
    </Notice>
  );
}
