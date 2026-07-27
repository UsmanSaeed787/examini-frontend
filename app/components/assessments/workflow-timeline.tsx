'use client';

import { useEffect, useRef } from 'react';
import { Check, Circle, FileQuestion, Loader2, PauseCircle, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  GenerationResponse,
  STAGE_META,
  StageKey,
  StageResponse,
  StageStatus,
  WorkflowResponse,
} from '@/types/assessment';

/** The two materialization nodes live below a divider — they are a downstream
 *  consumer of the completed plan, not pipeline stages. */
export type TimelineNodeKey = StageKey | 'questions' | 'publish';

type NodeVisual = 'done' | 'active' | 'review' | 'failed' | 'pending';

interface TimelineNode {
  key: TimelineNodeKey;
  label: string;
  short: string;
  visual: NodeVisual;
  revision?: number;
  selectable: boolean;
}

function stageVisual(status: StageStatus): NodeVisual {
  switch (status) {
    case 'approved':
      return 'done';
    case 'running':
      return 'active';
    case 'in_review':
      return 'review';
    case 'failed':
    case 'rejected':
      return 'failed';
    default:
      return 'pending';
  }
}

export function buildTimelineNodes(
  workflow: WorkflowResponse,
  generation: GenerationResponse | null
): TimelineNode[] {
  const stageNodes: TimelineNode[] = workflow.stages.map((stage: StageResponse) => ({
    key: stage.stage_key,
    label: STAGE_META[stage.stage_key]?.label ?? stage.stage_key,
    short: STAGE_META[stage.stage_key]?.short ?? stage.stage_key,
    visual: stageVisual(stage.status),
    revision: stage.revision,
    // A stage with no artifact yet is still selectable so the teacher can read
    // what it will do — the panel renders a "not reached yet" explanation.
    selectable: true,
  }));

  const completed = workflow.state === 'completed';
  const status = generation?.status;
  const generated = status === 'generated' || status === 'published';
  const published = status === 'published';

  stageNodes.push({
    key: 'questions',
    label: 'Questions',
    short: 'Questions',
    visual: status === 'failed' ? 'failed' : generated ? 'done' : completed ? 'review' : 'pending',
    selectable: completed,
  });
  stageNodes.push({
    key: 'publish',
    label: 'Publish',
    short: 'Publish',
    visual: published ? 'done' : generated ? 'review' : 'pending',
    selectable: generated,
  });

  return stageNodes;
}

function NodeIcon({ visual, nodeKey }: { visual: NodeVisual; nodeKey: TimelineNodeKey }) {
  const base = 'w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2';

  if (visual === 'done') {
    return (
      <span className={cn(base, 'bg-primary-600 border-primary-600')}>
        <Check className="w-4 h-4 text-white" strokeWidth={3} />
      </span>
    );
  }
  if (visual === 'active') {
    return (
      <span className={cn(base, 'bg-primary-600/20 border-primary-600')}>
        <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
      </span>
    );
  }
  if (visual === 'review') {
    return (
      <span className={cn(base, 'bg-amber-500/20 border-amber-500')}>
        {nodeKey === 'publish' ? (
          <Send className="w-3.5 h-3.5 text-amber-400" />
        ) : nodeKey === 'questions' ? (
          <FileQuestion className="w-3.5 h-3.5 text-amber-400" />
        ) : (
          <PauseCircle className="w-4 h-4 text-amber-400" />
        )}
      </span>
    );
  }
  if (visual === 'failed') {
    return (
      <span className={cn(base, 'bg-red-500/20 border-red-500')}>
        <X className="w-4 h-4 text-red-400" strokeWidth={3} />
      </span>
    );
  }
  return (
    <span className={cn(base, 'bg-gray-800 border-gray-600')}>
      <Circle className="w-2 h-2 text-gray-600 fill-gray-600" />
    </span>
  );
}

interface TimelineProps {
  workflow: WorkflowResponse;
  generation: GenerationResponse | null;
  selected: TimelineNodeKey;
  onSelect: (key: TimelineNodeKey) => void;
}

/** Vertical rail — lg and up. */
export function WorkflowTimeline({ workflow, generation, selected, onSelect }: TimelineProps) {
  const nodes = buildTimelineNodes(workflow, generation);
  const planCount = workflow.stages.length;

  return (
    <nav aria-label="Assessment progress" className="space-y-1">
      {nodes.map((node, index) => {
        const isSelected = node.key === selected;
        const isDivider = index === planCount;

        return (
          <div key={node.key}>
            {isDivider && (
              <div className="flex items-center gap-2 py-3 pl-1">
                <span className="h-px flex-1 bg-gray-700" />
                <span className="text-[10px] uppercase tracking-wider text-gray-600 font-medium">
                  After approval
                </span>
                <span className="h-px flex-1 bg-gray-700" />
              </div>
            )}
            <button
              type="button"
              onClick={() => node.selectable && onSelect(node.key)}
              disabled={!node.selectable}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors',
                isSelected ? 'bg-gray-700/70' : 'hover:bg-gray-800',
                !node.selectable && 'opacity-50 cursor-not-allowed hover:bg-transparent'
              )}
              aria-current={isSelected ? 'step' : undefined}
            >
              <NodeIcon visual={node.visual} nodeKey={node.key} />
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block text-sm truncate',
                    isSelected ? 'text-white font-medium' : 'text-gray-300'
                  )}
                >
                  {node.label}
                </span>
                {node.revision != null && node.revision > 1 && (
                  <span className="block text-[11px] text-amber-400 mt-0.5">
                    Revision {node.revision}
                  </span>
                )}
              </span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}

/** Horizontal stepper — below lg. Auto-scrolls the active node into view. */
export function WorkflowStepper({ workflow, generation, selected, onSelect }: TimelineProps) {
  const nodes = buildTimelineNodes(workflow, generation);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selected]);

  return (
    <div
      ref={containerRef}
      className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
      role="tablist"
      aria-label="Assessment progress"
    >
      {nodes.map((node) => {
        const isSelected = node.key === selected;
        return (
          <button
            key={node.key}
            ref={isSelected ? activeRef : undefined}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => node.selectable && onSelect(node.key)}
            disabled={!node.selectable}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 shrink-0 transition-colors',
              isSelected
                ? 'bg-gray-700/70 border-gray-600'
                : 'bg-gray-800/60 border-gray-700 hover:bg-gray-800',
              !node.selectable && 'opacity-50 cursor-not-allowed'
            )}
          >
            <NodeIcon visual={node.visual} nodeKey={node.key} />
            <span
              className={cn(
                'text-sm whitespace-nowrap',
                isSelected ? 'text-white font-medium' : 'text-gray-300'
              )}
            >
              {node.short}
            </span>
            {node.revision != null && node.revision > 1 && (
              <span className="text-[11px] text-amber-400">r{node.revision}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
