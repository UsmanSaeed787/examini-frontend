'use client';

import { AlertTriangle, Info, ShieldAlert, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SectionTitle } from '@/components/ui/card';
import { Finding, FindingSeverity } from '@/types/assessment';

const SEVERITY = {
  blocker: {
    icon: ShieldAlert,
    tone: 'danger' as const,
    label: 'Blocker',
    row: 'bg-red-500/10 border-red-500/30',
    text: 'text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    tone: 'warning' as const,
    label: 'Warning',
    row: 'bg-amber-500/10 border-amber-500/30',
    text: 'text-amber-400',
  },
  info: {
    icon: Info,
    tone: 'info' as const,
    label: 'Note',
    row: 'bg-gray-800/60 border-gray-700',
    text: 'text-gray-400',
  },
};

const ORDER: FindingSeverity[] = ['blocker', 'warning', 'info'];

/**
 * One severity vocabulary shared by every artifact panel. Blockers always sort
 * first and dominate visually — they are what will stop publication later.
 */
export function FindingsList({
  findings,
  title = 'Findings',
  emptyMessage,
}: {
  findings: Finding[];
  title?: string;
  emptyMessage?: string;
}) {
  if (!findings.length) {
    if (!emptyMessage) return null;
    return (
      <div>
        <SectionTitle>{title}</SectionTitle>
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  const sorted = [...findings].sort(
    (a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity)
  );

  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <ul className="space-y-2">
        {sorted.map((finding, index) => {
          const config = SEVERITY[finding.severity] ?? SEVERITY.info;
          const Icon = config.icon;
          return (
            <li
              key={`${finding.severity}-${index}`}
              className={`flex items-start gap-3 rounded-lg border p-3 ${config.row}`}
            >
              <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${config.text}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-200 break-words">{finding.message}</p>
              </div>
              <Badge tone={config.tone} size="sm" className="shrink-0">
                {config.label}
              </Badge>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Prose the agent authored for this stage.
 *
 * When the agent half of an artifact is empty — the default posture, since
 * every AI_USE_* flag ships off — we render a deliberate explanation rather
 * than a blank card or a spinner. See spec §2.1c.
 */
export function AiSummaryCard({
  summary,
  fallbackTitle,
  fallbackHint,
}: {
  summary: string | null | undefined;
  fallbackTitle: string;
  fallbackHint: string;
}) {
  if (!summary) {
    return (
      <div className="rounded-xl border border-dashed border-gray-700 bg-gray-800/30 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-400">{fallbackTitle}</p>
            <p className="text-xs text-gray-500 mt-1">{fallbackHint}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary-600/40 bg-primary-600/10 p-4">
      <div className="flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-500 mb-1.5">
            What the AI concluded
          </p>
          <p className="text-sm text-gray-100 leading-relaxed whitespace-pre-line">{summary}</p>
        </div>
      </div>
    </div>
  );
}
