export enum QuestionType {
  MCQ = 'mcq',
  SHORT_ANSWER = 'short_answer',
  LONG_ANSWER = 'long_answer',
  TRUE_FALSE = 'true_false',
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export interface QuestionOption {
  id: string;
  option_text: string;
  is_correct: boolean;
  order_number: number;
}

export interface Question {
  id: string;
  question_text: string;
  question_type: QuestionType;
  difficulty_level: DifficultyLevel | null;
  points: number;
  order_number: number;
  options?: QuestionOption[];
}

export interface Exam {
  id: string;
  teacher_id: string;
  class_id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  start_date: string | null;
  end_date: string | null;
  is_published: boolean;
  allow_retake: boolean;
  max_attempts: number;
  created_at: string;
  updated_at: string;
}

export interface ExamCreate {
  class_id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  start_date?: string;
  end_date?: string;
  allow_retake?: boolean;
  max_attempts?: number;
  questions: QuestionCreate[];
}

export interface QuestionCreate {
  question_text: string;
  question_type: QuestionType;
  difficulty_level?: DifficultyLevel;
  points?: number;
  order_number: number;
  options?: QuestionOptionCreate[];
}

export interface QuestionOptionCreate {
  option_text: string;
  is_correct: boolean;
  order_number: number;
}

export interface ExamGenerate {
  title: string;
  description?: string;
  class_id: string;
  material_ids: string[];
  question_config: {
    total: number;
    easy: number;
    medium: number;
    hard: number;
    mcq: number;
    short_answer: number;
    long_answer: number;
  };
  duration_minutes: number;
  start_date?: string;
  end_date?: string;
  allow_retake?: boolean;
  max_attempts?: number;
}

export interface ExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  started_at: string;
  submitted_at: string | null;
  status: string;
  time_spent_minutes: number | null;
  attempt_number: number;
}

export interface ExamResult {
  id: string;
  attempt_id: string;
  total_score: number;
  max_score: number;
  percentage: number;
  grade: string | null;
  passed: boolean | null;
  created_at: string;
}

