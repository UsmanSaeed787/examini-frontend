/**
 * Assessment Intelligence workflow types.
 *
 * Hand-mirrored from the backend Pydantic models in
 * `backend/app/ai/workflows/assessment/{domain,schemas}.py`. Keep them in
 * sync — these are the contract, not a convenience shape.
 */

// ---------------------------------------------------------------- vocabulary

export type StageKey =
  | 'curriculum_analysis'
  | 'assessment_design'
  | 'quality_review'
  | 'difficulty_analysis'
  | 'scheduling';

export const STAGE_ORDER: StageKey[] = [
  'curriculum_analysis',
  'assessment_design',
  'quality_review',
  'difficulty_analysis',
  'scheduling',
];

export type WorkflowState =
  | 'draft'
  | 'in_progress'
  | 'awaiting_approval'
  | 'completed'
  | 'cancelled'
  | 'failed';

export type StageStatus =
  | 'pending'
  | 'running'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'failed';

export type ApprovalMode = 'every_stage' | 'final_only' | 'none';

export type GenerationStatus =
  | 'pending'
  | 'generating'
  | 'generated'
  | 'published'
  | 'failed'
  | 'superseded';

export type FindingSeverity = 'info' | 'warning' | 'blocker';

export type BloomLevel =
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyze'
  | 'evaluate'
  | 'create';

export type QualityDimension =
  | 'coverage'
  | 'difficulty_balance'
  | 'question_distribution'
  | 'bloom_taxonomy'
  | 'institution_policies';

export type DimensionVerdictValue = 'pass' | 'concerns' | 'fail' | 'not_assessable';

export type ScheduleReadiness = 'ready' | 'adjust' | 'blocked' | 'insufficient_information';

export type DifficultyCalibration = 'aligned' | 'easier' | 'harder' | 'uncertain';

export interface Finding {
  severity: FindingSeverity;
  message: string;
  stage: StageKey;
}

// ---------------------------------------------------------------- artifacts

export interface CurriculumUnit {
  material_id: string;
  title: string;
  file_type: string | null;
  file_size: number | null;
  /** pdf/docx/txt can feed text-based agents; other types cannot. */
  parseable: boolean;
}

export interface TopicAnalysis {
  title: string;
  subtopics: string[];
  learning_outcomes: string[];
  bloom_levels: BloomLevel[];
  source_material_ids: string[];
  emphasis: 'low' | 'medium' | 'high';
}

/** Artifact of `curriculum_analysis`. `topics`/`summary` are empty unless the
 *  Curriculum Analyst agent is enabled. */
export interface CurriculumOutline {
  class_id: string;
  class_name: string;
  units: CurriculumUnit[];
  missing_material_ids: string[];
  findings: Finding[];
  topics: TopicAnalysis[];
  summary: string | null;
}

export interface TopicAllocation {
  topic_title: string;
  question_count: number;
  question_types: Record<string, number>;
  bloom_levels: BloomLevel[];
  rationale: string | null;
}

/** Artifact of `assessment_design`. `topic_allocations`/`rationale` are empty
 *  unless the Assessment Designer agent is enabled. */
export interface AssessmentBlueprint {
  total_questions: number;
  type_mix: Record<string, number>;
  difficulty_mix: Record<string, number>;
  default_points: number;
  estimated_total_points: number;
  validation_errors: string[];
  topic_allocations: TopicAllocation[];
  rationale: string | null;
}

export interface DimensionVerdict {
  dimension: QualityDimension;
  verdict: DimensionVerdictValue;
  comment: string;
}

/** Artifact of `quality_review`. `passed` is deterministic and authoritative;
 *  `dimension_verdicts`/`summary` need the Quality Reviewer agent. */
export interface QualityReport {
  passed: boolean;
  findings: Finding[];
  dimension_verdicts: DimensionVerdict[];
  summary: string | null;
}

export interface ExamComparison {
  exam_id: string;
  title: string;
  question_count: number;
  difficulty_counts: Record<string, number>;
  /** 1.0 (all easy) .. 3.0 (all hard) */
  difficulty_index: number | null;
  /** How students actually scored on that exam. */
  average_percentage: number | null;
  result_count: number;
}

/** Artifact of `difficulty_analysis`. The statistics half is always computed;
 *  `calibration`/`assessment`/`recommendations` need LLM mode. */
export interface DifficultyProfile {
  target_distribution: Record<string, number>;
  historical_distribution: Record<string, number>;
  historical_question_count: number;
  notes: string[];
  mode: 'deterministic' | 'llm';
  difficulty_index: number | null;
  historical_difficulty_index: number | null;
  divergence: number | null;
  exam_comparisons: ExamComparison[];
  calibration: DifficultyCalibration | null;
  assessment: string | null;
  recommendations: string[];
}

export interface ScheduleConflict {
  exam_id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  overlap_minutes: number | null;
  is_published: boolean;
}

/** Artifact of `scheduling`. `readiness`/`rationale`/`recommendations` need
 *  the Scheduler agent. Nothing here publishes an exam. */
export interface SchedulePlan {
  duration_minutes: number | null;
  proposed_start: string | null;
  proposed_end: string | null;
  findings: Finding[];
  estimated_duration_minutes: number | null;
  duration_basis: Record<string, number>;
  window_minutes: number | null;
  conflicts: ScheduleConflict[];
  readiness: ScheduleReadiness | null;
  rationale: string | null;
  recommendations: string[];
  /** Suggestion only — never applied to the exam. */
  recommended_duration_minutes: number | null;
}

/**
 * Discriminated union of a stage and its artifact. Switching on `stage_key`
 * gives exhaustive checking in the artifact renderer, so adding a sixth stage
 * becomes a compile error rather than a blank panel.
 */
export type StageArtifact =
  | { stage_key: 'curriculum_analysis'; artifact: CurriculumOutline }
  | { stage_key: 'assessment_design'; artifact: AssessmentBlueprint }
  | { stage_key: 'quality_review'; artifact: QualityReport }
  | { stage_key: 'difficulty_analysis'; artifact: DifficultyProfile }
  | { stage_key: 'scheduling'; artifact: SchedulePlan };

export interface AssessmentPlan {
  workflow_id: string;
  title: string;
  class_id: string;
  outline: CurriculumOutline;
  blueprint: AssessmentBlueprint;
  quality: QualityReport;
  difficulty: DifficultyProfile;
  schedule: SchedulePlan;
  approved_at: string;
}

// ---------------------------------------------------------------- API DTOs

export interface QuestionConfig {
  total?: number;
  mcq?: number;
  short_answer?: number;
  long_answer?: number;
  true_false?: number;
  easy?: number;
  medium?: number;
  hard?: number;
  points_per_question?: number;
  [key: string]: number | undefined;
}

export interface CreateWorkflowRequest {
  title: string;
  class_id: string;
  material_ids: string[];
  question_config: QuestionConfig;
  duration_minutes?: number | null;
  proposed_start?: string | null;
  proposed_end?: string | null;
  approval_mode: ApprovalMode;
}

export interface StageResponse {
  stage_key: StageKey;
  sequence: number;
  status: StageStatus;
  revision: number;
  requires_checkpoint: boolean;
  artifact: Record<string, unknown> | null;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface WorkflowResponse {
  id: string;
  title: string;
  state: WorkflowState;
  current_stage: StageKey | null;
  approval_mode: ApprovalMode;
  class_id: string;
  config: {
    material_ids?: string[];
    question_config?: QuestionConfig;
    duration_minutes?: number | null;
    proposed_start?: string | null;
    proposed_end?: string | null;
    [key: string]: unknown;
  };
  stages: StageResponse[];
  result: AssessmentPlan | null;
  error: string | null;
  created_at: string;
  finished_at: string | null;
}

export interface WorkflowSummaryResponse {
  id: string;
  title: string;
  state: WorkflowState;
  current_stage: StageKey | null;
  created_at: string;
}

export interface GenerationResponse {
  workflow_id: string;
  status: GenerationStatus;
  attempt: number;
  exam_id: string | null;
  run_id: string | null;
  question_count: number;
  findings: string[];
  error: string | null;
  is_published: boolean;
  created_at: string | null;
  generated_at: string | null;
  published_at: string | null;
}

export interface GenerationHistoryResponse {
  workflow_id: string;
  current: GenerationResponse | null;
  attempts: GenerationResponse[];
}

export interface AiCapabilitiesResponse {
  enabled: boolean;
  agents: Array<{ agent_key: string; description: string; uses_session: boolean }>;
  workflows: Array<{
    kind: string;
    title: string;
    description: string | null;
    stage_keys: string[];
  }>;
}

// ---------------------------------------------------------------- presentation

export const STAGE_META: Record<
  StageKey,
  { label: string; short: string; doing: string; describes: string }
> = {
  curriculum_analysis: {
    label: 'Curriculum analysis',
    short: 'Curriculum',
    doing: 'Reading your materials to identify topics and learning outcomes',
    describes: 'Takes an inventory of your materials and extracts the topics they cover.',
  },
  assessment_design: {
    label: 'Assessment design',
    short: 'Design',
    doing: 'Designing the question blueprint across your topics',
    describes: 'Turns your question mix into a blueprint and allocates questions across topics.',
  },
  quality_review: {
    label: 'Quality review',
    short: 'Quality',
    doing: 'Reviewing the blueprint for coverage, balance and policy fit',
    describes: 'Checks the plan for coverage, difficulty balance, distribution and Bloom spread.',
  },
  difficulty_analysis: {
    label: 'Difficulty analysis',
    short: 'Difficulty',
    doing: 'Comparing this exam against your previous ones',
    describes: 'Compares the target difficulty against the exams you have set before.',
  },
  scheduling: {
    label: 'Scheduling',
    short: 'Schedule',
    doing: 'Checking duration and calendar collisions for this class',
    describes: 'Estimates how long the exam needs and finds clashes with other exams.',
  },
};

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  mcq: 'Multiple choice',
  short_answer: 'Short answer',
  long_answer: 'Long answer',
  true_false: 'True / false',
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export const DIMENSION_LABELS: Record<QualityDimension, string> = {
  coverage: 'Coverage',
  difficulty_balance: 'Difficulty balance',
  question_distribution: 'Question distribution',
  bloom_taxonomy: "Bloom's taxonomy",
  institution_policies: 'Institution policies',
};

export const ALL_DIMENSIONS: QualityDimension[] = [
  'coverage',
  'difficulty_balance',
  'question_distribution',
  'bloom_taxonomy',
  'institution_policies',
];

export const QUESTION_TYPE_KEYS = ['mcq', 'short_answer', 'long_answer', 'true_false'] as const;
export const DIFFICULTY_KEYS = ['easy', 'medium', 'hard'] as const;
