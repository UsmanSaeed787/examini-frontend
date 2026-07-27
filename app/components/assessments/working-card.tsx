'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { IndeterminateBar } from '@/components/ui/feedback';

/**
 * Honest progress for a long-running AI call.
 *
 * The workflow API exposes no progress signal — no job id, no polling, no
 * stream — so this component deliberately shows NO percentage, NO "question N
 * of M", and NO estimate. The only number displayed is elapsed time, which we
 * genuinely know. See spec §7.
 */
export function WorkingCard({
  title,
  doing,
  /** Stages that will run before this call returns (approve under final_only/none). */
  upcoming,
}: {
  title: string;
  doing: string;
  upcoming?: string[];
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const clock = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <Card tone="accent" className="text-center py-8">
      <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-primary-600/20 border border-primary-600/40 flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-primary-500 animate-pulse" />
      </div>

      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-gray-300 mt-1.5 max-w-md mx-auto">{doing}</p>

      <div className="max-w-xs mx-auto mt-5">
        <IndeterminateBar />
      </div>

      <p className="text-xs text-gray-400 mt-3 tabular-nums">{clock} elapsed</p>

      {upcoming && upcoming.length > 0 && (
        <ul className="mt-5 space-y-1.5 text-left max-w-xs mx-auto">
          {upcoming.map((stage) => (
            <li key={stage} className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
              {stage}
            </li>
          ))}
        </ul>
      )}

      {elapsed >= 20 && (
        <p className="text-xs text-gray-400 mt-5">
          Still working — AI analysis can take up to three minutes.
        </p>
      )}
      {elapsed >= 90 && (
        <p className="text-xs text-gray-500 mt-1.5">
          You can safely leave this page; progress is saved on the server.
        </p>
      )}
    </Card>
  );
}
