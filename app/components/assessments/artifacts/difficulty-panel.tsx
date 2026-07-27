'use client';

import { History, Lightbulb } from 'lucide-react';
import { Badge, BadgeTone } from '@/components/ui/badge';
import { SectionTitle } from '@/components/ui/card';
import { StatTile } from '@/components/ui/feedback';
import { AiSummaryCard } from '@/components/assessments/findings-list';
import {
  DIFFICULTY_KEYS,
  DIFFICULTY_LABELS,
  DifficultyCalibration,
  DifficultyProfile,
} from '@/types/assessment';

const CALIBRATION: Record<DifficultyCalibration, { tone: BadgeTone; label: string }> = {
  aligned: { tone: 'success', label: 'In line with your history' },
  easier: { tone: 'warning', label: 'Easier than your history' },
  harder: { tone: 'warning', label: 'Harder than your history' },
  uncertain: { tone: 'muted', label: 'Not enough history to compare' },
};

const BAR_COLORS: Record<string, string> = {
  easy: 'bg-green-500',
  medium: 'bg-amber-500',
  hard: 'bg-red-500',
};

function DistributionRow({
  label,
  distribution,
  muted,
}: {
  label: string;
  distribution: Record<string, number>;
  muted?: boolean;
}) {
  const hasData = DIFFICULTY_KEYS.some((key) => (distribution[key] ?? 0) > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-xs font-medium ${muted ? 'text-gray-500' : 'text-gray-300'}`}>
          {label}
        </span>
      </div>
      {hasData ? (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2.5 bg-gray-700 rounded-full overflow-hidden flex">
            {DIFFICULTY_KEYS.map((key) => {
              const fraction = distribution[key] ?? 0;
              if (fraction <= 0) return null;
              return (
                <div
                  key={key}
                  className={`h-full ${BAR_COLORS[key]} ${muted ? 'opacity-50' : ''}`}
                  style={{ width: `${fraction * 100}%` }}
                  title={`${DIFFICULTY_LABELS[key]}: ${Math.round(fraction * 100)}%`}
                />
              );
            })}
          </div>
          <div className="text-xs text-gray-400 tabular-nums shrink-0 w-32 text-right">
            {DIFFICULTY_KEYS.filter((k) => (distribution[k] ?? 0) > 0)
              .map((k) => `${Math.round((distribution[k] ?? 0) * 100)}% ${k}`)
              .join(' · ')}
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-500">No data.</p>
      )}
    </div>
  );
}

export function DifficultyPanel({ artifact }: { artifact: DifficultyProfile }) {
  const calibration = artifact.calibration ? CALIBRATION[artifact.calibration] : null;
  const hasHistory = artifact.historical_question_count > 0;

  return (
    <div className="space-y-6">
      <AiSummaryCard
        summary={artifact.assessment}
        fallbackTitle="Statistics only"
        fallbackHint="The numbers below are always computed. Set AI_DIFFICULTY_ANALYSIS_MODE=llm to add the analyst's interpretation of them."
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile
          label="This exam"
          value={artifact.difficulty_index?.toFixed(2) ?? '—'}
          sublabel="1.0 easy → 3.0 hard"
          tone="primary"
        />
        <StatTile
          label="Your history"
          value={artifact.historical_difficulty_index?.toFixed(2) ?? '—'}
          sublabel={`${artifact.historical_question_count} questions`}
        />
        <StatTile
          label="Divergence"
          value={artifact.divergence != null ? `${Math.round(artifact.divergence * 100)}%` : '—'}
          sublabel="0% identical"
        />
        <StatTile label="Mode" value={artifact.mode === 'llm' ? 'Interpreted' : 'Statistical'} />
      </div>

      {calibration && (
        <div>
          <SectionTitle>Calibration</SectionTitle>
          <Badge tone={calibration.tone}>{calibration.label}</Badge>
        </div>
      )}

      <div className="space-y-4">
        <SectionTitle hint="How this exam's difficulty spread compares with the exams you have set before.">
          Difficulty distribution
        </SectionTitle>
        <DistributionRow label="This exam" distribution={artifact.target_distribution} />
        <DistributionRow
          label="Your previous exams"
          distribution={artifact.historical_distribution}
          muted
        />
      </div>

      {artifact.exam_comparisons.length > 0 ? (
        <div>
          <SectionTitle hint="Including how students actually scored.">
            Compared with your previous exams
          </SectionTitle>

          {/* Table on desktop, stacked cards on mobile. */}
          <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-800">
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-3 py-2 font-medium">Exam</th>
                  <th className="px-3 py-2 font-medium text-right">Questions</th>
                  <th className="px-3 py-2 font-medium text-right">Index</th>
                  <th className="px-3 py-2 font-medium text-right">Avg score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {artifact.exam_comparisons.map((exam) => (
                  <tr key={exam.exam_id} className="bg-gray-800/40">
                    <td className="px-3 py-2 text-gray-100">{exam.title}</td>
                    <td className="px-3 py-2 text-right text-gray-300 tabular-nums">
                      {exam.question_count}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-300 tabular-nums">
                      {exam.difficulty_index?.toFixed(2) ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {exam.average_percentage != null ? (
                        <span className="text-gray-100">
                          {Math.round(exam.average_percentage)}%
                          <span className="text-gray-500 text-xs ml-1">
                            ({exam.result_count})
                          </span>
                        </span>
                      ) : (
                        <span className="text-gray-500">no results</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="sm:hidden space-y-2">
            {artifact.exam_comparisons.map((exam) => (
              <li
                key={exam.exam_id}
                className="rounded-lg border border-gray-700 bg-gray-800/60 p-3"
              >
                <p className="text-sm font-medium text-gray-100 mb-2">{exam.title}</p>
                <dl className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <dt className="text-gray-500">Questions</dt>
                    <dd className="text-gray-200 tabular-nums">{exam.question_count}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Index</dt>
                    <dd className="text-gray-200 tabular-nums">
                      {exam.difficulty_index?.toFixed(2) ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Avg score</dt>
                    <dd className="text-gray-200 tabular-nums">
                      {exam.average_percentage != null
                        ? `${Math.round(exam.average_percentage)}%`
                        : '—'}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-700 p-4 text-sm text-gray-500 flex items-start gap-3">
          <History className="w-4 h-4 shrink-0 mt-0.5 text-gray-600" />
          <span>
            {hasHistory
              ? 'No comparable exams were found for this class.'
              : 'This is the first exam of its kind for you, so there is nothing to compare against yet.'}
          </span>
        </div>
      )}

      {artifact.recommendations.length > 0 && (
        <div>
          <SectionTitle>Recommendations</SectionTitle>
          <ul className="space-y-2">
            {artifact.recommendations.map((rec, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg border border-gray-700 bg-gray-800/60 p-3"
              >
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-200">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {artifact.notes.length > 0 && (
        <div>
          <SectionTitle>Notes</SectionTitle>
          <ul className="space-y-1">
            {artifact.notes.map((note, i) => (
              <li key={i} className="text-sm text-gray-400 flex gap-2">
                <span className="text-gray-600 shrink-0">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
