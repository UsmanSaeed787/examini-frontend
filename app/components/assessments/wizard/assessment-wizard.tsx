'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  FileText,
  FileX2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/form-controls';
import { EmptyState, Notice } from '@/components/ui/feedback';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorSurface } from '@/components/assessments/error-surface';
import {
  QuestionMixEditor,
  validateQuestionConfig,
} from '@/components/assessments/question-mix-editor';
import { WIZARD_STEPS, WizardProgress, WizardStep } from './wizard-shell';
import { assessmentApi } from '@/lib/ai/assessment-client';
import { teacherApi } from '@/lib/api';
import { NormalizedError, normalizeApiError } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { ApprovalMode, QuestionConfig } from '@/types/assessment';

const DRAFT_KEY = 'examini:assessment-wizard-draft';
/** Mirrors AI_MAX_MATERIALS_PER_RUN, which defaults to 5. */
const MATERIAL_SOFT_LIMIT = 5;
const PARSEABLE = ['pdf', 'docx', 'txt'];

interface ClassOption {
  id: string;
  name: string;
}

interface MaterialOption {
  id: string;
  title: string;
  file_type: string | null;
  class_id: string;
}

interface WizardDraft {
  title: string;
  classId: string;
  materialIds: string[];
  questionConfig: QuestionConfig;
  durationMinutes: number;
  proposedStart: string;
  proposedEnd: string;
  approvalMode: ApprovalMode;
}

const EMPTY_DRAFT: WizardDraft = {
  title: '',
  classId: '',
  materialIds: [],
  questionConfig: { total: 10, mcq: 5, short_answer: 3, long_answer: 2, easy: 3, medium: 4, hard: 3 },
  durationMinutes: 60,
  proposedStart: '',
  proposedEnd: '',
  // One consolidated checkpoint, not offered as a choice.
  //
  // A teacher has two real decisions — "is this the right plan?" then "are these
  // the right questions?" — and cannot usefully pick a review rhythm before
  // seeing the product work once. The API still supports every_stage and none;
  // they are simply not a wizard question. Fully automatic would save exactly
  // one click (Generate and Publish are mandatory in every mode), at the cost of
  // the moment where the plan is still worth changing.
  approvalMode: 'final_only',
};

export function AssessmentWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  /**
   * Restored from sessionStorage on first render so a refresh mid-wizard does
   * not lose input. Safe as a lazy initializer because this component is
   * loaded with `ssr: false` — there is no server render to mismatch against.
   */
  const [draft, setDraft] = useState<WizardDraft>(() => {
    try {
      const stored = sessionStorage.getItem(DRAFT_KEY);
      return stored ? { ...EMPTY_DRAFT, ...JSON.parse(stored) } : EMPTY_DRAFT;
    } catch {
      return EMPTY_DRAFT; // a corrupt or unavailable draft just starts clean
    }
  });

  const [classes, setClasses] = useState<ClassOption[]>([]);
  /** Materials plus the class they belong to, so "is this list stale?" is
   *  derived rather than tracked with a separate loading flag. */
  const [materialsFor, setMaterialsFor] = useState<{ classId: string; items: MaterialOption[] }>({
    classId: '',
    items: [],
  });
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<NormalizedError | null>(null);

  const materials = materialsFor.classId === draft.classId ? materialsFor.items : [];
  const loadingMaterials = Boolean(draft.classId) && materialsFor.classId !== draft.classId;

  // Persisted on every change; cleared once the workflow is created.
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* storage full or unavailable — the wizard still works */
    }
  }, [draft]);

  useEffect(() => {
    teacherApi
      .getClasses()
      .then((data) => setClasses(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Could not load your classes'))
      .finally(() => setLoadingClasses(false));
  }, []);

  useEffect(() => {
    const classId = draft.classId;
    if (!classId) return;
    let active = true;
    teacherApi
      .getMaterials(classId, 1, 100)
      .then((data) => {
        if (active) setMaterialsFor({ classId, items: data.items || [] });
      })
      .catch(() => {
        if (active) {
          toast.error('Could not load materials for this class');
          setMaterialsFor({ classId, items: [] });
        }
      });
    return () => {
      active = false;
    };
  }, [draft.classId]);

  const update = useCallback(
    <K extends keyof WizardDraft>(key: K, value: WizardDraft[K]) =>
      setDraft((prev) => ({ ...prev, [key]: value })),
    []
  );

  const configErrors = useMemo(
    () => validateQuestionConfig(draft.questionConfig),
    [draft.questionConfig]
  );

  const windowInvalid =
    Boolean(draft.proposedStart && draft.proposedEnd) &&
    new Date(draft.proposedEnd) <= new Date(draft.proposedStart);

  const canContinue = (() => {
    switch (step) {
      case 1:
        return draft.title.trim().length > 0 && draft.classId.length > 0;
      case 2:
        return draft.materialIds.length > 0;
      case 3:
        return configErrors.length === 0;
      case 4:
        return draft.durationMinutes > 0 && !windowInvalid;
      default:
        return false;
    }
  })();

  const toggleMaterial = (id: string) =>
    setDraft((prev) => ({
      ...prev,
      materialIds: prev.materialIds.includes(id)
        ? prev.materialIds.filter((m) => m !== id)
        : [...prev.materialIds, id],
    }));

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const workflow = await assessmentApi.create({
        title: draft.title.trim(),
        class_id: draft.classId,
        material_ids: draft.materialIds,
        question_config: draft.questionConfig,
        duration_minutes: draft.durationMinutes,
        proposed_start: draft.proposedStart ? new Date(draft.proposedStart).toISOString() : null,
        proposed_end: draft.proposedEnd ? new Date(draft.proposedEnd).toISOString() : null,
        approval_mode: draft.approvalMode,
      });
      sessionStorage.removeItem(DRAFT_KEY);
      router.push(`/teacher/assessments/${workflow.id}`);
    } catch (err) {
      setError(normalizeApiError(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <WizardProgress current={step} />

      <Card>
        {step === 1 && (
          <WizardStep
            title="What are you assessing?"
            description="Give it a name and pick the class it is for."
          >
            <div className="space-y-4">
              <Input
                label="Assessment title"
                placeholder="e.g. Physics Midterm — Kinematics"
                value={draft.title}
                onChange={(e) => update('title', e.target.value)}
                maxLength={255}
                autoFocus
              />
              {loadingClasses ? (
                <div className="space-y-2">
                  <Skeleton variant="text" width={80} height={14} />
                  <Skeleton variant="rectangular" width="100%" height={40} />
                </div>
              ) : classes.length === 0 ? (
                <Notice tone="warning" icon={<AlertTriangle className="w-4 h-4" />}>
                  You are not assigned to any class yet. Ask an administrator to assign you one.
                </Notice>
              ) : (
                <Select
                  label="Class"
                  value={draft.classId}
                  onChange={(e) => {
                    update('classId', e.target.value);
                    update('materialIds', []);
                  }}
                >
                  <option value="">Select a class…</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </WizardStep>
        )}

        {step === 2 && (
          <WizardStep
            title="What should the AI read?"
            description="It will only write questions from the material you choose here."
          >
            {loadingMaterials ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} variant="rectangular" width="100%" height={56} />
                ))}
              </div>
            ) : materials.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-6 h-6" />}
                title="No materials for this class"
                description="Upload course material first — the AI needs something to read."
                action={
                  <Button variant="outline" onClick={() => router.push('/teacher/materials')}>
                    Go to materials
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {draft.materialIds.length > MATERIAL_SOFT_LIMIT && (
                  <Notice
                    tone="warning"
                    title={`Most deployments cap generation at ${MATERIAL_SOFT_LIMIT} materials`}
                    icon={<AlertTriangle className="w-4 h-4" />}
                  >
                    You have selected {draft.materialIds.length}. Analysis will still run, but
                    question generation may be rejected later.
                  </Notice>
                )}

                <ul className="space-y-2">
                  {materials.map((material) => {
                    const selected = draft.materialIds.includes(material.id);
                    const readable = PARSEABLE.includes((material.file_type || '').toLowerCase());
                    return (
                      <li key={material.id}>
                        <button
                          type="button"
                          onClick={() => toggleMaterial(material.id)}
                          className={cn(
                            'w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                            selected
                              ? 'border-primary-600 bg-primary-600/10'
                              : 'border-gray-700 bg-gray-800/60 hover:border-gray-600'
                          )}
                        >
                          <span
                            className={cn(
                              'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                              readable
                                ? 'bg-primary-600/20 text-primary-500'
                                : 'bg-gray-700 text-gray-500'
                            )}
                          >
                            {readable ? (
                              <FileText className="w-4 h-4" />
                            ) : (
                              <FileX2 className="w-4 h-4" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm text-gray-100 truncate">
                              {material.title}
                            </span>
                            <span className="block text-xs text-gray-500 uppercase">
                              {material.file_type || 'unknown'}
                            </span>
                          </span>
                          {!readable && (
                            <Badge tone="muted" size="sm">
                              No text
                            </Badge>
                          )}
                          {selected && (
                            <Badge tone="primary" size="sm">
                              Selected
                            </Badge>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <p className="text-xs text-gray-500">
                  Files marked “No text” cannot be read — scanned PDFs and images have nothing to
                  extract.
                </p>
              </div>
            )}
          </WizardStep>
        )}

        {step === 3 && (
          <WizardStep
            title="What should the exam look like?"
            description="Set as much or as little as you like — anything you leave blank, the AI decides."
          >
            <QuestionMixEditor
              config={draft.questionConfig}
              onChange={(config) => update('questionConfig', config)}
            />
          </WizardStep>
        )}

        {step === 4 && (
          <WizardStep
            title="When should it run?"
            description="The window is optional — you can set dates on the exam later."
          >
            <div className="space-y-5">
              <Input
                label="Duration (minutes)"
                type="number"
                min={1}
                value={draft.durationMinutes}
                onChange={(e) => update('durationMinutes', parseInt(e.target.value, 10) || 0)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Opens (optional)"
                  type="datetime-local"
                  value={draft.proposedStart}
                  onChange={(e) => update('proposedStart', e.target.value)}
                />
                <Input
                  label="Closes (optional)"
                  type="datetime-local"
                  value={draft.proposedEnd}
                  onChange={(e) => update('proposedEnd', e.target.value)}
                  error={windowInvalid ? 'Must be after the opening time' : undefined}
                />
              </div>


              <p className="text-xs text-gray-500">
                The AI will work through every step, then stop once so you can review the whole
                plan before any question is written.
              </p>
            </div>
          </WizardStep>
        )}

        {error && (
          <div className="mt-5">
            <ErrorSurface error={error} onRetry={submit} />
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-6 pt-5 border-t border-gray-700">
          <Button
            variant="ghost"
            onClick={() => (step === 1 ? router.push('/teacher/assessments') : setStep(step - 1))}
            disabled={submitting}
            className="text-gray-300"
          >
            <span className="flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              {step === 1 ? 'Cancel' : WIZARD_STEPS[step - 2].label}
            </span>
          </Button>

          {step < 4 ? (
            <Button variant="primary" onClick={() => setStep(step + 1)} disabled={!canContinue}>
              <span className="flex items-center justify-center gap-2">
                {WIZARD_STEPS[step].label}
                <ArrowRight className="w-4 h-4" />
              </span>
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={submit}
              disabled={!canContinue || submitting}
              isLoading={submitting}
            >
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Create assessment
              </span>
            </Button>
          )}
        </div>
      </Card>

      <p className="text-xs text-gray-500 mt-4">
        Creating an assessment does not start the AI — you get a final look before anything runs.
      </p>
    </div>
  );
}
