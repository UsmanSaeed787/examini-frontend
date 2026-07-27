'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { GenerationResponse, STAGE_META, StageKey, WorkflowResponse } from '@/types/assessment';

/**
 * Real progress — not a simulation.
 *
 * The backend commits `stage.status = 'running'` before invoking a handler, so
 * polling the ordinary GET endpoint tells us exactly which step is executing
 * and which have finished. This replaced an elapsed-timer card that could only
 * say "something is happening": there is still no percentage, because per-stage
 * duration genuinely is not knowable, but *which* stage is now honest fact.
 */
export function StageProgress({
  workflow,
  generation,
}: {
  workflow: WorkflowResponse;
  generation: GenerationResponse | null;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const minutes = Math.floor(elapsed / 60);
  const clock = minutes > 0 ? `${minutes}m ${elapsed % 60}s` : `${elapsed}s`;

  const generating = generation?.status === 'generating';
  const runningStage = workflow.stages.find((s) => s.status === 'running');
  const activeLabel = generating
    ? 'Writing your questions'
    : runningStage
      ? STAGE_META[runningStage.stage_key as StageKey]?.doing
      : 'Preparing the next step';

  return (
    <Card tone="accent">
      <div className="text-center mb-5">
        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-primary-600/20 border border-primary-600/40 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary-500 animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold text-white">
          {generating ? 'Generating questions' : 'The AI is working'}
        </h3>
        <p className="text-sm text-gray-300 mt-1.5 max-w-md mx-auto">{activeLabel}</p>
        <p className="text-xs text-gray-400 mt-2 tabular-nums">{clock} elapsed</p>
      </div>

      {!generating && (
        <ol className="space-y-1">
          {workflow.stages.map((stage) => {
            const meta = STAGE_META[stage.stage_key as StageKey];
            const done = stage.status === 'approved' || stage.status === 'in_review';
            const running = stage.status === 'running';
            const failed = stage.status === 'failed';

            return (
              <li
                key={stage.stage_key}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2',
                  running && 'bg-primary-600/10 border border-primary-600/30'
                )}
              >
                <span className="shrink-0 w-5 h-5 flex items-center justify-center">
                  {done && <Check className="w-4 h-4 text-primary-500" strokeWidth={3} />}
                  {running && <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />}
                  {failed && <span className="text-red-400 text-sm">!</span>}
                  {!done && !running && !failed && (
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                  )}
                </span>
                <span
                  className={cn(
                    'text-sm',
                    running ? 'text-white font-medium' : done ? 'text-gray-300' : 'text-gray-500'
                  )}
                >
                  {meta?.label ?? stage.stage_key}
                </span>
                {running && (
                  <span className="ml-auto text-[11px] text-primary-500 uppercase tracking-wider">
                    Running
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <p className="text-xs text-gray-500 text-center mt-5">
        You can leave this page — the work continues on the server and progress is saved.
      </p>
    </Card>
  );
}
