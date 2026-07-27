'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, FileText } from 'lucide-react';
import { Badge, BadgeTone } from '@/components/ui/badge';
import { SectionTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatTile } from '@/components/ui/feedback';
import { ErrorSurface } from '@/components/assessments/error-surface';
import { teacherApi } from '@/lib/api';
import { NormalizedError, normalizeApiError } from '@/lib/errors';
import {
  AssessmentBlueprint,
  DIFFICULTY_LABELS,
  QUESTION_TYPE_LABELS,
} from '@/types/assessment';

interface PreviewOption {
  id: string;
  option_text: string;
  is_correct: boolean;
  order_number: number;
}

interface PreviewQuestion {
  id: string;
  question_text: string;
  question_type: string;
  difficulty_level: string | null;
  points: number;
  order_number: number;
  options: PreviewOption[] | null;
}

interface PreviewExam {
  id: string;
  title: string;
  duration_minutes: number;
  is_published: boolean;
  questions: PreviewQuestion[];
}

const DIFFICULTY_TONE: Record<string, BadgeTone> = {
  easy: 'success',
  medium: 'warning',
  hard: 'danger',
};

/** Delivered vs blueprint — the payoff of the whole planning pipeline. */
function Reconciliation({
  questions,
  blueprint,
}: {
  questions: PreviewQuestion[];
  blueprint: AssessmentBlueprint | null;
}) {
  if (!blueprint) return null;

  const countBy = (key: 'question_type' | 'difficulty_level') =>
    questions.reduce<Record<string, number>>((acc, q) => {
      const value = q[key] || 'unspecified';
      acc[value] = (acc[value] ?? 0) + 1;
      return acc;
    }, {});

  const actualTypes = countBy('question_type');
  const actualDifficulty = countBy('difficulty_level');

  const rows = [
    ...Object.entries(blueprint.type_mix).map(([key, planned]) => ({
      label: QUESTION_TYPE_LABELS[key] || key,
      planned,
      actual: actualTypes[key] ?? 0,
    })),
    ...Object.entries(blueprint.difficulty_mix).map(([key, planned]) => ({
      label: DIFFICULTY_LABELS[key] || key,
      planned,
      actual: actualDifficulty[key] ?? 0,
    })),
  ];

  return (
    <div>
      <SectionTitle hint="What the AI delivered, against the blueprint you approved.">
        Delivered vs planned
      </SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatTile
          label="Questions"
          value={`${questions.length} of ${blueprint.total_questions}`}
          tone={questions.length === blueprint.total_questions ? 'success' : 'warning'}
        />
        <StatTile
          label="Total points"
          value={questions.reduce((sum, q) => sum + Number(q.points || 0), 0)}
        />
      </div>

      {rows.length > 0 && (
        <ul className="space-y-1.5">
          {rows.map((row) => (
            <li
              key={row.label}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2"
            >
              <span className="text-sm text-gray-300">{row.label}</span>
              <span className="text-sm tabular-nums">
                <span
                  className={row.actual === row.planned ? 'text-green-400' : 'text-amber-400'}
                >
                  {row.actual}
                </span>
                <span className="text-gray-500"> / {row.planned}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Callers pass `key={examId}` so a different exam remounts this component —
 *  which is why the fetch below never has to reset state synchronously. */
export function QuestionPreview({
  examId,
  blueprint,
}: {
  examId: string;
  blueprint: AssessmentBlueprint | null;
}) {
  const [exam, setExam] = useState<PreviewExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedError | null>(null);

  useEffect(() => {
    let active = true;
    // Reuses the existing teacher exam endpoint — it already returns questions
    // with options, so materialization needed no new read API.
    teacherApi
      .getExam(examId)
      .then((data) => {
        if (active) setExam(data);
      })
      .catch((err) => {
        if (active) setError(normalizeApiError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [examId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-700 bg-gray-800/60 p-4 space-y-3">
            <Skeleton variant="text" width="70%" height={16} />
            <Skeleton variant="text" width="45%" height={12} />
          </div>
        ))}
      </div>
    );
  }

  if (error) return <ErrorSurface error={error} />;
  if (!exam) return null;

  const sorted = [...exam.questions].sort((a, b) => a.order_number - b.order_number);

  return (
    <div className="space-y-6">
      <Reconciliation questions={sorted} blueprint={blueprint} />

      <div>
        <SectionTitle hint="Shown as a student would see it, with the answer key visible to you.">
          Questions
        </SectionTitle>

        {sorted.length === 0 ? (
          <p className="text-sm text-gray-500">This exam has no questions.</p>
        ) : (
          <ol className="space-y-3">
            {sorted.map((question) => (
              <li
                key={question.id}
                className="rounded-lg border border-gray-700 bg-gray-800/60 p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-gray-700 text-gray-300 text-sm font-semibold flex items-center justify-center shrink-0">
                    {question.order_number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-100 whitespace-pre-line">
                      {question.question_text}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      <Badge tone="neutral" size="sm">
                        {QUESTION_TYPE_LABELS[question.question_type] || question.question_type}
                      </Badge>
                      {question.difficulty_level && (
                        <Badge
                          tone={DIFFICULTY_TONE[question.difficulty_level] ?? 'neutral'}
                          size="sm"
                        >
                          {DIFFICULTY_LABELS[question.difficulty_level] ||
                            question.difficulty_level}
                        </Badge>
                      )}
                      <Badge tone="muted" size="sm">
                        {question.points} {Number(question.points) === 1 ? 'point' : 'points'}
                      </Badge>
                    </div>

                    {question.options && question.options.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {[...question.options]
                          .sort((a, b) => a.order_number - b.order_number)
                          .map((option) => (
                            <li
                              key={option.id}
                              className={`flex items-start gap-2 rounded-md px-2.5 py-1.5 text-sm ${
                                option.is_correct
                                  ? 'bg-green-500/10 text-green-200'
                                  : 'text-gray-300'
                              }`}
                            >
                              {option.is_correct ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                              ) : (
                                <Circle className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" />
                              )}
                              <span>{option.option_text}</span>
                            </li>
                          ))}
                      </ul>
                    )}

                    {!question.options && (
                      <p className="mt-2.5 text-xs text-gray-500 flex items-center gap-1.5">
                        <FileText className="w-3 h-3" />
                        Written answer — marked manually
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
