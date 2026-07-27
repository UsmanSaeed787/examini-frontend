'use client';

import { BookOpen, FileText, FileX2, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SectionTitle } from '@/components/ui/card';
import { StatTile } from '@/components/ui/feedback';
import { AiSummaryCard, FindingsList } from '@/components/assessments/findings-list';
import { CurriculumOutline } from '@/types/assessment';

const EMPHASIS_TONE = {
  high: 'primary' as const,
  medium: 'neutral' as const,
  low: 'muted' as const,
};

export function CurriculumPanel({ artifact }: { artifact: CurriculumOutline }) {
  const parseable = artifact.units.filter((u) => u.parseable).length;
  const unreadable = artifact.units.length - parseable;

  return (
    <div className="space-y-6">
      <AiSummaryCard
        summary={artifact.summary}
        fallbackTitle="Deterministic inventory only"
        fallbackHint="Enable the Curriculum Analyst (AI_USE_CURRICULUM_ANALYST) to add topic extraction, learning outcomes and Bloom levels."
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatTile label="Class" value={artifact.class_name} />
        <StatTile label="Materials" value={artifact.units.length} />
        <StatTile
          label="Readable"
          value={`${parseable} of ${artifact.units.length}`}
          tone={parseable === 0 ? 'danger' : unreadable > 0 ? 'warning' : 'success'}
          sublabel={unreadable > 0 ? `${unreadable} without extractable text` : undefined}
        />
      </div>

      <div>
        <SectionTitle hint="Only files with extractable text can be used to write questions.">
          Source materials
        </SectionTitle>
        <ul className="space-y-2">
          {artifact.units.map((unit) => (
            <li
              key={unit.material_id}
              className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800/60 p-3"
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  unit.parseable ? 'bg-primary-600/20 text-primary-500' : 'bg-gray-700 text-gray-500'
                }`}
              >
                {unit.parseable ? (
                  <FileText className="w-4 h-4" />
                ) : (
                  <FileX2 className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-100 truncate">{unit.title}</p>
                <p className="text-xs text-gray-500 uppercase">{unit.file_type || 'unknown'}</p>
              </div>
              <Badge tone={unit.parseable ? 'success' : 'muted'} size="sm">
                {unit.parseable ? 'Readable' : 'No text'}
              </Badge>
            </li>
          ))}
          {artifact.units.length === 0 && (
            <li className="text-sm text-gray-500">No materials were resolved for this workflow.</li>
          )}
        </ul>
      </div>

      {artifact.topics.length > 0 ? (
        <div>
          <SectionTitle hint="Extracted from your materials by the Curriculum Analyst.">
            Topics found
          </SectionTitle>
          <ul className="space-y-3">
            {artifact.topics.map((topic, index) => (
              <li
                key={`${topic.title}-${index}`}
                className="rounded-lg border border-gray-700 bg-gray-800/60 p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h5 className="text-sm font-semibold text-white">{topic.title}</h5>
                  <Badge tone={EMPHASIS_TONE[topic.emphasis] ?? 'neutral'} size="sm">
                    {topic.emphasis} emphasis
                  </Badge>
                </div>

                {topic.subtopics.length > 0 && (
                  <p className="text-xs text-gray-400 mb-2">
                    <Layers className="w-3 h-3 inline mr-1" />
                    {topic.subtopics.join(' · ')}
                  </p>
                )}

                {topic.learning_outcomes.length > 0 && (
                  <ul className="space-y-1 mb-3">
                    {topic.learning_outcomes.map((outcome, i) => (
                      <li key={i} className="text-sm text-gray-300 flex gap-2">
                        <span className="text-primary-500 shrink-0">•</span>
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {topic.bloom_levels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {topic.bloom_levels.map((level) => (
                      <Badge key={level} tone="info" size="sm">
                        {level}
                      </Badge>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          <SectionTitle>Topics</SectionTitle>
          <div className="rounded-lg border border-dashed border-gray-700 p-4 text-sm text-gray-500 flex items-start gap-3">
            <BookOpen className="w-4 h-4 shrink-0 mt-0.5 text-gray-600" />
            <span>
              No topic breakdown in this run. The deterministic handler inventories your materials;
              topic extraction requires the Curriculum Analyst agent.
            </span>
          </div>
        </div>
      )}

      <FindingsList findings={artifact.findings} emptyMessage="Nothing to flag on your materials." />
    </div>
  );
}
