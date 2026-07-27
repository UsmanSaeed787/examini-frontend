'use client';

import { AlertCircle, Check } from 'lucide-react';
import { NumberStepper } from '@/components/ui/form-controls';
import { SectionTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  DIFFICULTY_KEYS,
  DIFFICULTY_LABELS,
  QUESTION_TYPE_KEYS,
  QUESTION_TYPE_LABELS,
  QuestionConfig,
} from '@/types/assessment';

export const PRESETS: Record<string, { label: string; description: string; apply: (total: number) => QuestionConfig }> = {
  balanced: {
    label: 'Balanced',
    description: 'Even spread of formats and difficulty',
    apply: (total) => ({
      total,
      mcq: Math.round(total * 0.5),
      short_answer: Math.round(total * 0.3),
      long_answer: total - Math.round(total * 0.5) - Math.round(total * 0.3),
      true_false: 0,
      easy: Math.round(total * 0.3),
      medium: Math.round(total * 0.4),
      hard: total - Math.round(total * 0.3) - Math.round(total * 0.4),
    }),
  },
  recall: {
    label: 'Recall-heavy',
    description: 'Mostly multiple choice, easier weighting',
    apply: (total) => ({
      total,
      mcq: Math.round(total * 0.7),
      true_false: total - Math.round(total * 0.7),
      short_answer: 0,
      long_answer: 0,
      easy: Math.round(total * 0.5),
      medium: Math.round(total * 0.35),
      hard: total - Math.round(total * 0.5) - Math.round(total * 0.35),
    }),
  },
  application: {
    label: 'Application-heavy',
    description: 'More written answers, harder weighting',
    apply: (total) => ({
      total,
      mcq: Math.round(total * 0.2),
      short_answer: Math.round(total * 0.4),
      long_answer: total - Math.round(total * 0.2) - Math.round(total * 0.4),
      true_false: 0,
      easy: Math.round(total * 0.2),
      medium: Math.round(total * 0.4),
      hard: total - Math.round(total * 0.2) - Math.round(total * 0.4),
    }),
  },
};

/**
 * Mirrors `validate_question_config` client-side so the teacher never
 * round-trips to discover a mismatch. The backend rule: if ANY count in a
 * group is specified, that group must sum to `total`. Leaving a group entirely
 * at zero is valid and means "the AI chooses".
 */
export function validateQuestionConfig(config: QuestionConfig): string[] {
  const errors: string[] = [];
  const total = config.total ?? 0;

  if (total < 1) errors.push('Set a total of at least 1 question.');
  if (total > 100) errors.push('The maximum is 100 questions per exam.');

  const typeSum = QUESTION_TYPE_KEYS.reduce((sum, key) => sum + (config[key] ?? 0), 0);
  const difficultySum = DIFFICULTY_KEYS.reduce((sum, key) => sum + (config[key] ?? 0), 0);

  if (typeSum > 0 && typeSum !== total) {
    errors.push(`Question types add up to ${typeSum}, but the total is ${total}.`);
  }
  if (difficultySum > 0 && difficultySum !== total) {
    errors.push(`Difficulty counts add up to ${difficultySum}, but the total is ${total}.`);
  }
  return errors;
}

function GroupAllocation({
  title,
  hint,
  keys,
  labels,
  config,
  total,
  onChange,
}: {
  title: string;
  hint: string;
  keys: readonly string[];
  labels: Record<string, string>;
  config: QuestionConfig;
  total: number;
  onChange: (key: string, value: number) => void;
}) {
  const sum = keys.reduce((acc, key) => acc + (config[key] ?? 0), 0);
  const untouched = sum === 0;
  const matches = sum === total;

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4 className="text-sm font-semibold text-white">{title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
        </div>
        <span
          className={cn(
            'text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap flex items-center gap-1.5',
            untouched
              ? 'bg-gray-700 text-gray-400'
              : matches
                ? 'bg-green-500/15 text-green-400'
                : 'bg-amber-500/15 text-amber-400'
          )}
        >
          {!untouched && matches && <Check className="w-3 h-3" />}
          {!untouched && !matches && <AlertCircle className="w-3 h-3" />}
          {untouched ? 'AI decides' : `${sum} of ${total}`}
        </span>
      </div>

      {!untouched && (
        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden mb-3">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              matches ? 'bg-green-500' : 'bg-amber-500'
            )}
            style={{ width: `${Math.min(100, total > 0 ? (sum / total) * 100 : 0)}%` }}
          />
        </div>
      )}

      <div className="space-y-2.5">
        {keys.map((key) => (
          <NumberStepper
            key={key}
            label={labels[key] || key}
            value={config[key] ?? 0}
            onChange={(value) => onChange(key, value)}
            max={100}
          />
        ))}
      </div>
    </div>
  );
}

export function QuestionMixEditor({
  config,
  onChange,
  showPresets = true,
}: {
  config: QuestionConfig;
  onChange: (config: QuestionConfig) => void;
  showPresets?: boolean;
}) {
  const total = config.total ?? 0;
  const errors = validateQuestionConfig(config);

  const setKey = (key: string, value: number) => onChange({ ...config, [key]: value });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4">
        <NumberStepper
          label="Total questions"
          value={total}
          onChange={(value) => setKey('total', value)}
          min={1}
          max={100}
        />
      </div>

      {showPresets && (
        <div>
          <SectionTitle hint="A starting point — adjust anything afterwards.">
            Quick start
          </SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() => onChange(preset.apply(total || 10))}
                className="text-left rounded-lg border border-gray-700 bg-gray-800/60 hover:bg-gray-800 hover:border-gray-600 p-3 transition-colors"
              >
                <span className="block text-sm font-medium text-white">{preset.label}</span>
                <span className="block text-xs text-gray-400 mt-0.5">{preset.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <GroupAllocation
        title="Question types"
        hint="Leave every row at zero and the AI will choose the balance."
        keys={QUESTION_TYPE_KEYS}
        labels={QUESTION_TYPE_LABELS}
        config={config}
        total={total}
        onChange={setKey}
      />

      <GroupAllocation
        title="Difficulty"
        hint="Leave every row at zero and the AI will choose the balance."
        keys={DIFFICULTY_KEYS}
        labels={DIFFICULTY_LABELS}
        config={config}
        total={total}
        onChange={setKey}
      />

      {errors.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <ul className="space-y-1">
            {errors.map((error, i) => (
              <li key={i} className="text-sm text-amber-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
