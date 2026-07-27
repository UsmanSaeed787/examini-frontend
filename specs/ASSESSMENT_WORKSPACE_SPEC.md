# Teacher AI Assessment Workspace — Frontend Spec

> **Status:** proposal for review. No code written yet.
> **Scope:** `frontend/app/teacher/assessments/**` + supporting components,
> consuming the existing `/api/ai/workflows/assessment` API.
> **Backend changes:** none. Every capability below maps to an endpoint that
> already exists (§2). Two optional, additive backend items are flagged in
> §13 as *open questions* — the workspace ships fully functional without them.

---

## 1. The problem this solves

Today a teacher generating an exam uses [teacher/exams/generate](../app/teacher/exams/generate/page.tsx):
a 518-line single-shot form. They fill in ~15 fields, press Generate, watch a
progress bar that is **simulated by a `setInterval` timer** (`simulateProgress()`,
line ~106) with no relationship to what the server is doing, and either get an
exam or an error toast. There is no analysis, no plan, no review, no revision —
and no way to understand *why* the AI produced what it produced.

Meanwhile the backend grew an entire Assessment Intelligence pipeline that no
UI has ever called. **`frontend/` contains zero references to `/api/ai`** — the
five analysis stages, the approval checkpoints, the blueprint, the quality
verdicts, the difficulty comparison against the teacher's own history, and the
materialization/publish flow are all reachable only by curl.

This workspace exposes that pipeline as the product's flagship experience.

### The design thesis

> The teacher is not filling in a form. They are **briefing a colleague, then
> reviewing its work.**

Three consequences that drive every decision below:

1. **The AI shows its reasoning, not just its output.** Every stage renders
   *what it concluded and why* — topics found, allocations chosen, verdicts per
   dimension, how this exam compares to the teacher's previous ones.
2. **Rejection is a conversation, not an error.** Rejecting a stage is the
   normal path, takes free-text notes, and re-runs that stage with the notes in
   context. The UI treats it as feedback, never as failure.
3. **The teacher is always the decision-maker.** The AI advises; the teacher
   approves each stage and is the only one who can publish. The UI must make
   that authority visible rather than implied.

---

## 2. Backend contract (verified — this is what exists)

All routes are teacher-only, bearer-authenticated, and scoped to the caller.
Mounted at `/api/ai/workflows/assessment`.

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `` | `CreateWorkflowRequest` | `WorkflowResponse` (state `draft`) |
| GET | `` | — | `WorkflowSummaryResponse[]` (max 50, newest first) |
| GET | `/{id}` | — | `WorkflowResponse` |
| POST | `/{id}/start` | — | `WorkflowResponse` |
| POST | `/{id}/stages/{stage}/approve` | `{notes?}` | `WorkflowResponse` |
| POST | `/{id}/stages/{stage}/reject` | `{notes, config_patch?}` | `WorkflowResponse` |
| POST | `/{id}/cancel` | — | `WorkflowResponse` |
| POST | `/{id}/generate` | — | `GenerationResponse` |
| GET | `/{id}/generation` | — | `GenerationResponse` |
| GET | `/{id}/generations` | — | `GenerationHistoryResponse` |
| POST | `/{id}/publish` | `{acknowledge_findings}` | `GenerationResponse` |

Supporting, already used elsewhere in the app:

- `GET /api/ai/capabilities` → `{enabled, agents[], workflows[]}` — feature detection.
- `GET /api/teachers/classes`, `GET /api/teachers/materials?class_id=` — wizard inputs.
- `GET /api/teachers/exams/{id}` → `ExamDetailResponse` **including `questions[]` with `options[]`** — this is how question preview works; no new endpoint needed.

### 2.1 Four properties of this API that dictate the architecture

**(a) Every mutation returns the complete `WorkflowResponse`.**
`start`, `approve`, `reject`, and `cancel` all return the full object: state,
`current_stage`, every stage row with its `status`/`revision`/`artifact`, the
`result`, and `error`. The client therefore **never computes next state** — it
replaces its snapshot with the server's. No client-side mirror of the state
machine, no optimistic transitions. This is the single most important
constraint in this document and §4 is built on it.

**(b) The pipeline runs synchronously inside the request.**
`POST /start` executes stages until it hits a checkpoint and only then responds.
`approve` resumes the same loop. With all AI flags off these are fast
(deterministic handlers, milliseconds). With agent stages enabled each stage is
a model run — `AI_RUN_TIMEOUT_SECONDS` defaults to **180s**, and `approve` can
trigger *several* stages when `approval_mode` is `final_only` or `none`.

So a single click can legitimately block for minutes. There is **no job id, no
polling endpoint, and no progress stream.** §7 addresses this honestly rather
than by faking a timer.

**(c) Artifacts have a deterministic half and an agent half, and the agent half
is empty by default.** Every `AI_USE_*` flag ships **off**. In that posture:

| Stage | Always present | Empty unless the flag is on |
|---|---|---|
| `curriculum_analysis` | `units[]`, `parseable`, `findings[]` | `topics[]`, `summary` |
| `assessment_design` | counts, mixes, points | `topic_allocations[]`, `rationale` |
| `quality_review` | `passed`, `findings[]` | `dimension_verdicts[]`, `summary` |
| `difficulty_analysis` | distributions, index, `exam_comparisons[]` | `calibration`, `assessment`, `recommendations[]` |
| `scheduling` | window, duration estimate, `conflicts[]` | `readiness`, `rationale`, `recommendations[]` |

**The workspace must look deliberate, not broken, when these are empty.** This
is a first-class requirement, not an edge case — it is the default deployment.
Every artifact panel specifies its degraded rendering in §6.

**(d) Errors use one envelope.** `{"error": {code, message, details}}` for both
app errors (`AUTHENTICATION_ERROR`, `AUTHORIZATION_ERROR`, `NOT_FOUND`,
`VALIDATION_ERROR`) and AI errors (`AI_DISABLED` 403, `AI_QUOTA_EXCEEDED` 429,
`AI_GUARDRAIL_REJECTED` 422, `AI_RUN_TIMEOUT` 504, `AI_RUN_FAILED` 502). Raw
provider text is never forwarded. §9 maps each code to teacher-facing copy.

---

## 3. Routes and information architecture

```
/teacher/assessments                  Workspace home — active + history
/teacher/assessments/new              Creation wizard (4 steps)
/teacher/assessments/[id]             The workspace itself
```

Nav: add **"AI Assessments"** to `teacherNavItems` in
[dashboard-layout.tsx](../app/components/layouts/dashboard-layout.tsx#L31),
between *Exams* and *Results*, with a `Sparkles` icon (lucide-react).

**The legacy `/teacher/exams/generate` page stays untouched and reachable.** It
is the fast path (one form, one exam) and it is the only path that works with
`AI_ENABLED=false`. `/teacher/exams` gains a secondary "Plan with AI →" link
next to the existing Generate button. Removing or rewriting the legacy page is
explicitly **out of scope**.

---

## 4. State architecture

### 4.1 One server-owned snapshot

```ts
// app/lib/ai/assessment-client.ts   — thin typed wrapper over the shared axios instance
export const assessmentApi = {
  create, list, get, start, approve, reject, cancel,
  generate, getGeneration, getGenerationHistory, publish,
};

// app/hooks/use-assessment-workflow.ts
function useAssessmentWorkflow(id: string) {
  return {
    workflow: WorkflowResponse | null,
    generation: GenerationResponse | null,
    status: 'idle' | 'loading' | 'working' | 'error',
    pendingAction: { kind: 'start'|'approve'|'reject'|'generate'|'publish', stage?: StageKey } | null,
    error: NormalizedError | null,
    actions: { start, approve, reject, cancel, generate, publish, refresh },
  };
}
```

Every action follows one rule:

```
set pendingAction → await POST → replace snapshot with the response → clear pendingAction
                                ↳ on failure: normalize error, keep the OLD snapshot, surface it
```

**No optimistic updates anywhere.** A failed approve must not leave the
timeline showing an approved stage. The server's response *is* the state.

### 4.2 No new data-fetching dependency

The codebase uses plain `axios` + `useState`/`useEffect` with no react-query or
SWR. This spec **does not introduce one** — two hooks (`useAssessmentWorkflow`,
`useAssessmentList`) cover every need, and adding a cache layer would be the
largest new concept in a codebase that has deliberately avoided one.

*Trade-off accepted:* no background refetch or cross-tab sync. Given that a
workflow is single-teacher-owned and mutations return fresh state, staleness is
only reachable by leaving a tab open — handled by a manual Refresh control
(§7.4) rather than a polling loop.

### 4.3 Types

New file `app/types/assessment.ts`, hand-written to mirror the backend Pydantic
models exactly: `StageKey`, `WorkflowState`, `StageStatus`, `ApprovalMode`,
`GenerationStatus`, `Finding`, the five artifact interfaces, `AssessmentPlan`,
`WorkflowResponse`, `GenerationResponse`, `GenerationHistoryResponse`.

Artifacts are typed as a **discriminated union keyed by `stage_key`**, so the
artifact renderer (§6) is exhaustively checked by TypeScript — adding a sixth
stage later becomes a compile error rather than a blank panel.

---

## 5. The creation wizard — `/teacher/assessments/new`

Four steps, one screen each, progress rail on top. Zod + react-hook-form per
the existing convention. **Draft persisted to `sessionStorage`** so a refresh
mid-wizard doesn't lose input.

| Step | Fields | Validation |
|---|---|---|
| 1 · Subject | `title`, `class_id` | title 1–255; class required |
| 2 · Materials | `material_ids[]` (multi-select, filtered by class) | ≥1; **warn above 5** — `AI_MAX_MATERIALS_PER_RUN` defaults to 5 and generation will reject more |
| 3 · Blueprint | `question_config`: total, per-type, per-difficulty | see below |
| 4 · Schedule & mode | `duration_minutes`, `proposed_start/end`, `approval_mode` | end > start; duration > 0 |

### 5.1 Step 3 is the one that must not feel like a form

This is where the "AI collaborator" framing is won or lost. The step mirrors
`validate_question_config` **live, client-side**, so the teacher never
round-trips to discover a mismatch:

- A **type mix** and a **difficulty mix** row, each a set of steppers with a
  live "N of M allocated" bar.
- The rule the backend enforces — *if you specify any counts in a group, they
  must sum to `total`* — is shown as a live constraint, not an error after
  submit. Leaving a group entirely empty is valid and means "you decide".
- **Presets** ("Balanced", "Recall-heavy", "Application-heavy") fill both mixes
  in one click. These are pure client-side conveniences.
- Copy frames it as delegation: *"Leave a row blank and the AI will choose the
  balance for you."*

### 5.2 Step 4 — approval mode is a first-class choice

Rendered as three cards, not a dropdown, because it determines the entire
rhythm of the workspace:

| Mode | Card copy | Effect |
|---|---|---|
| `every_stage` *(default)* | **Review each step** — "See the AI's work after every stage." | 5 checkpoints |
| `final_only` | **Review at the end** — "The AI works through the plan, you approve once." | 1 checkpoint; one long request |
| `none` | **Fully automatic** — "Run the whole plan without stopping." | 0 checkpoints; one long request |

The two non-default modes carry an inline warning that the resulting request
may run for **several minutes** (§2.1b), so the choice is informed.

**Submit** creates the workflow (`draft`) and routes to `/teacher/assessments/[id]`.
Starting is a separate, explicit action there — creation never auto-runs, which
mirrors the API and gives the teacher a last look before spending quota.

---

## 6. The workspace — `/teacher/assessments/[id]`

### 6.1 Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ ← Assessments   "Physics Midterm"      [state pill]   ⋯ Cancel   │
├────────────────────┬─────────────────────────────────────────────┤
│  STAGE TIMELINE    │  ARTIFACT PANEL                             │
│  (rail, sticky)    │                                             │
│  ● Curriculum   ✓  │   ┌─ AI summary card ──────────────────┐   │
│  ● Design       ✓  │   │  what this stage concluded, prose  │   │
│  ◉ Quality      ⏸  │   └────────────────────────────────────┘   │
│  ○ Difficulty      │   ┌─ evidence: tables / mixes / verdicts ┐  │
│  ○ Schedule        │   └────────────────────────────────────┘   │
│  ─────────────     │   ┌─ findings (info/warning/blocker) ───┐  │
│  ○ Questions       │   └────────────────────────────────────┘   │
│  ○ Publish         │                                             │
│                    │   [ Request changes ]      [ Approve → ]    │
└────────────────────┴─────────────────────────────────────────────┘
```

The rail shows **7 nodes: the 5 pipeline stages, then Questions and Publish**
below a divider. The divider is meaningful — it marks where planning ends and
materialization begins, matching the backend's boundary (`COMPLETED` is
terminal; generation is a downstream consumer). The last two nodes derive from
`GenerationResponse`, not from `stages[]`.

Node visual state maps directly off `StageStatus` — `pending` (hollow),
`running` (pulsing), `in_review` (amber, the only actionable one), `approved`
(check), `rejected`/`failed` (red). A `revision > 1` badge appears on any stage
that was sent back, and stays — the revision count is part of the story.

Selecting a node shows its artifact. Default selection = `current_stage`, else
the last approved stage.

### 6.2 Artifact panels

Each of the five gets a purpose-built panel. Common shell: **AI summary card on
top** (prose, `Sparkles` icon, agent-authored), evidence below, findings last.
When the agent half is empty (§2.1c), the summary card is replaced by a
neutral note — *"Deterministic analysis only. Enable the Curriculum Analyst to
add topic extraction."* — never a blank card or a spinner.

| Panel | Evidence rendering | Degraded (flag off) |
|---|---|---|
| **Curriculum** | Material cards with type icon + a clear **parseable / no extractable text** badge; topic list with Bloom chips and per-topic source materials | Inventory only; topic section replaced by the note |
| **Blueprint** | Two horizontal stacked bars (type mix, difficulty mix) + total points; topic allocation table with per-topic counts and rationale | Mixes only; allocation table hidden |
| **Quality** | Big **PASS / FAIL** verdict driven by `passed`; a 5-row dimension table (coverage, difficulty balance, distribution, Bloom, policies) with pass/concerns/fail/**not_assessable** chips | `passed` + structural findings only; dimension table shows all five as `not_assessable` with an explanatory caption |
| **Difficulty** | Target vs historical distribution as paired bars; difficulty index gauge (1.0–3.0); `exam_comparisons` table — previous exam, question count, index, **average score students actually got** | Statistics render fully (they are deterministic); `calibration`/`assessment` block hidden |
| **Schedule** | Window summary, estimated vs requested duration with the per-type basis, conflict list linking to the colliding exams | Window + estimate + conflicts; readiness verdict hidden |

**Findings** get one shared component used across all panels:
`info` (slate) / `warning` (amber) / `blocker` (red), icon + message. A blocker
is always visually dominant — it is what will stop publication later.

### 6.3 Approve / reject

Visible only when `status === 'in_review'` **and** `requires_checkpoint`.

- **Approve** — optional notes, one confirm. Then §7's working state, because
  approving triggers the next stage(s) server-side.
- **Request changes** (never labelled "Reject") — modal, **notes required**
  (1–2000 chars, matching `RejectRequest`). Copy: *"What should the AI do
  differently?"* Quick-insert chips seed common feedback ("Too many hard
  questions", "Missing a topic", "Wrong difficulty balance") into the textarea.
- **`config_patch`** — an "Also correct the setup" disclosure inside the same
  modal, exposing the `question_config` editor from wizard step 3, prefilled
  from the current workflow config. This is the only way a teacher can fix a
  bad config after creation, so it is surfaced, not hidden. Sent only when
  touched.

After a rejection the stage returns to `pending` with `revision + 1` and
re-runs. The timeline shows the bump; the notes appear as a **quoted feedback
entry attached to that stage**, so the exchange reads as a thread.

### 6.4 Completion

When `state === 'completed'`, the panel shows a **Plan summary** assembled from
`result` (the `AssessmentPlan`) — the five artifacts condensed into one
reviewable brief — and the rail's *Questions* node becomes actionable.

---

## 7. Long-running actions — honest progress

The hard problem (§2.1b): the server gives us **no progress signal**, and a call
can take minutes. The current page's answer is a fake timer. This spec's answer:

### 7.1 Never fabricate determinate progress

No percentage, no "question 7 of 20", no ETA — the client cannot know any of
those. Anything that implies measured progress is prohibited in this workspace.

### 7.2 Show *what is running* and *what is known*

While `pendingAction` is set, the affected timeline node pulses and the panel
is replaced by a **working card**:

- The stage name and what that stage actually does, in one line
  (*"Reading your materials to identify topics and learning outcomes"*).
- An **indeterminate** shimmer bar (the existing `.animate-shimmer` utility).
- An **elapsed timer** — honest, and the only number shown.
- For `approve` under `final_only`/`none`: the list of stages that will run,
  each ticking to "done" only when the response confirms it.

After **20s**: *"Still working — AI analysis can take up to three minutes."*
After **90s**: add *"You can safely leave this page; progress is saved on the
server."* — true, because completed stages are already committed.

### 7.3 Non-blocking navigation

Because state lives server-side, leaving mid-request is safe. The workspace
warns on navigation (`beforeunload`) but does **not** block it, and re-entering
the page refetches the real state. This is a genuine advantage of the
synchronous API that the UI should exploit rather than hide.

### 7.4 Manual refresh

A refresh control in the header (with `Loader` state) re-fetches workflow +
generation. Its purpose is recovering from a client-side timeout where the
server actually finished — the one failure mode the synchronous API creates
(§9.3).

---

## 8. Generation, question preview, and publish

### 8.1 Generate

Enabled only when `state === 'completed'`. Pre-flight card restates what will
happen: *"The AI will write N questions following your approved blueprint. The
result is a draft — nothing reaches students until you publish."*

`POST /generate` is the longest call in the product (full LLM run over all
material text). Same working card as §7, wording adjusted.

On failure, the attempt is recorded server-side as `failed` with the reason;
the UI shows it and offers **Try again** (a new attempt), since the backend
supersedes rather than blocks.

### 8.2 Question preview

On success we hold `GenerationResponse` with `exam_id` and `question_count`.
Questions are then loaded from the **existing** `GET /api/teachers/exams/{id}`.

The preview renders the exam as a student would see it, plus teacher-only
overlays: correct options marked, difficulty and type chips, points, and — when
present — the `topic` each question was written for.

A summary strip above it reconciles **delivered vs blueprint**: total, per-type,
per-difficulty. This is the payoff of the whole planning pipeline and deserves
to be explicit.

### 8.3 The publish gate

Publish is the one irreversible, outward-facing action in the workspace — it
makes the exam visible to students — so the UI treats it with the same weight
the backend does (`PUBLISHED` is terminal; only a human can reach it).

The confirm modal states plainly: **class, question count, window, duration**.

When `generation.findings` is non-empty the modal changes shape: every finding
is listed, and the primary button is **disabled behind an explicit checkbox** —
*"I've reviewed these findings and want to publish anyway"* — which maps 1:1 to
the API's `acknowledge_findings`. The mechanism is the backend's; the UI must
not paper over it with a silent `true`.

On success: success state, link to the published exam in the existing exams
area, and the rail completes. Post-publish the workspace becomes **read-only** —
Generate is disabled with the reason (*"Unpublish the exam first"*), matching
the backend's terminal-state rule instead of letting the teacher discover it as
a 422.

---

## 9. Error handling

### 9.1 One normalizer

`normalizeApiError(err)` reads `error.error.code|message`, falling back to
`detail`, then to a generic message. Nothing in the workspace ever renders a
raw axios error or a bare `err.message`.

### 9.2 Code → teacher-facing copy

| Code | HTTP | Presentation |
|---|---|---|
| `AI_DISABLED` | 403 | Full-page empty state: "AI features are turned off for this workspace." + link to the classic generator |
| `AI_QUOTA_EXCEEDED` | 429 | Inline, non-destructive: "You've reached today's AI limit. It resets at midnight UTC." Retry disabled |
| `AI_GUARDRAIL_REJECTED` | 422 | **Most important case.** "The AI's output didn't meet the required standard, so it was rejected." Surface `details`, offer Try again. Frame as *the system caught it*, not as teacher error |
| `AI_RUN_TIMEOUT` | 504 | "That took longer than allowed." + Refresh hint (§9.3) |
| `AI_RUN_FAILED` | 502 | "The AI service had a problem." + Try again |
| `VALIDATION_ERROR` | 422 | Inline on the offending control where mappable; otherwise a panel banner |
| `AUTHORIZATION_ERROR` | 403 | Redirect to `/dashboard` with a toast |
| network / timeout | — | §9.3 |

### 9.3 The synchronous-API failure mode

A client-side timeout or dropped connection does **not** mean the server
failed — stages may have completed and committed. So on any network-level
failure the workspace shows a **recovery card**, never a plain error:

> *"We lost contact while the AI was working. Your progress is saved on the
> server."* → **[Check current status]** (refetch, §7.4)

Anything else risks a teacher re-running work that already succeeded.

### 9.4 Boundaries and toasts

- `error.tsx` per route segment for render-time crashes.
- Toasts (`react-hot-toast`, existing) for **transient confirmations only** —
  "Stage approved", "Feedback sent". Never for errors needing a decision;
  those are inline where the action was taken.

---

## 10. Loading and empty states

| Situation | Treatment |
|---|---|
| Workspace first load | Skeleton mirroring the real layout — rail with 7 muted nodes, panel with header/body blocks. Existing `Skeleton` primitive; no spinners |
| List first load | 3 skeleton rows |
| No workflows yet | Illustrated empty state, one-line pitch, primary **New assessment** |
| Workflow `draft` | Panel is a **pre-flight brief** — class, N materials, question mix, mode, plus "5 stages will run" — with **Start** as the only action |
| Stage `pending` (not reached) | Muted panel: what this stage *will* do. Never blank |
| Stage `failed` | Error card with the workflow's `error`, plus what remains valid |
| Workflow `cancelled` | Read-only, dimmed, with a "Start a new one from this setup" affordance (client-side prefill of the wizard) |
| AI disabled | §9.2 |

---

## 11. Responsive design

Existing breakpoints (`sm` 640 / `lg` 1024) and `DashboardLayout` are reused
unchanged.

- **≥1024px** — two columns; rail 280px sticky, panel fluid.
- **768–1023px** — rail collapses to a **horizontal stepper** above the panel,
  scrollable, with the active node auto-scrolled into view.
- **<768px** — horizontal stepper with abbreviated labels; artifact panel full
  width; **approve/reject actions become a sticky bottom bar** so the primary
  decision is always reachable without scrolling past long artifacts. Tables
  (comparisons, allocations, dimensions) become stacked definition lists rather
  than horizontally scrolling grids. Modals are full-screen sheets under `sm`.

Touch targets ≥44px. The question preview is single-column on mobile with
sticky question numbering.

---

## 12. Component inventory

`components/ui/` currently holds only **button, input, skeleton**. The
workspace needs these additions, built in the existing style (dark surfaces
`gray-800`/`gray-700`, primary `#2ab6a5`, `rounded-lg`/`rounded-2xl`, the
existing `.modal-enter` animation):

**New primitives** — `card`, `badge`, `modal`, `textarea`, `select`,
`checkbox`, `progress-bar` (indeterminate), `tooltip`, `empty-state`,
`stat-tile`.

**New feature components** — `components/assessments/`:

```
workflow-timeline.tsx          rail + horizontal stepper (responsive variants)
workflow-header.tsx            title, state pill, cancel, refresh
stage-panel.tsx                shell + exhaustive artifact switch
artifacts/curriculum-panel.tsx
artifacts/blueprint-panel.tsx
artifacts/quality-panel.tsx
artifacts/difficulty-panel.tsx
artifacts/schedule-panel.tsx
findings-list.tsx              shared severity vocabulary
checkpoint-actions.tsx         approve + request-changes
reject-modal.tsx               notes + config_patch disclosure
working-card.tsx               §7 honest progress
generation-panel.tsx           pre-flight, working, result
question-preview.tsx           reuses GET /api/teachers/exams/{id}
publish-modal.tsx              §8.3 acknowledge gate
plan-summary.tsx               the completed AssessmentPlan brief
wizard/*.tsx                   4 steps + progress rail + question-mix editor
```

Reused as-is: `DashboardLayout`, `Button`, `Input`, `Skeleton`, the shared
`api` axios instance, `useAuthStore`, `react-hot-toast`, `lucide-react`,
`date-fns`, `zod` + `react-hook-form`.

**Client-side only. No new npm dependencies.** All pages are `'use client'`
(they need auth from localStorage), consistent with every existing teacher page.

---

## 13. Open questions — RESOLVED as built

All five were resolved with the proposed defaults when this was implemented:

1. **Nav placement** — sibling of Exams (`AI Assessments`), between *Exams* and
   *Results*.
2. **Legacy generate page** — kept, untouched, and still linked. `/teacher/exams`
   gained a secondary "Plan with AI →" control.
3. **Background generation** — *not* implemented. No backend was changed; §7's
   elapsed-timer card is what ships. Still the highest-value follow-up.
4. **Checkpoint history endpoint** — *not* implemented. The feedback thread in
   §6.3 shows the current revision's `stage.notes` only.
5. **Draft persistence** — `sessionStorage`, restored via a lazy initializer.
   The wizard is loaded with `next/dynamic({ ssr: false })` so there is no
   server render to mismatch against.

### Original text

1. **Nav placement** — "AI Assessments" as a sibling of Exams (proposed), or
   nested under Exams as a sub-item? Sibling is proposed for discoverability,
   at the cost of a longer nav.
2. **Legacy generate page** — keep indefinitely (proposed), or deprecate with a
   banner pointing at the workspace once this ships?
3. *(Optional backend, additive)* **Background generation.** `POST /api/ai/runs`
   already supports `background=true` with `GET /runs/{id}` polling; the
   workflow endpoints do not. Adding it would replace §7's elapsed-timer card
   with real per-stage progress. **Not required** — the workspace is fully
   functional without it — but it is the single highest-value backend follow-up.
4. *(Optional backend, additive)* **Checkpoint history endpoint.** Rejection
   notes are persisted to `ai_workflow_checkpoints` but no route reads them
   back, so §6.3's feedback thread can only show the *current* revision's
   notes (from `stage.notes`). A `GET /{id}/checkpoints` would make the full
   exchange visible across revisions.
5. **Draft persistence** — `sessionStorage` for the wizard (proposed), or
   create the workflow in `draft` at step 1 and patch as they go? The latter
   needs no client storage but creates abandoned rows.

---

## 14. Acceptance criteria

A reviewer should be able to check each of these against the built UI:

1. A teacher creates an assessment through the wizard and lands on the
   workspace in `draft` **without anything having run**.
2. Start runs the pipeline and stops at the first checkpoint; the timeline
   reflects real server state at every step.
3. Each of the five artifacts renders with its own purpose-built panel, and
   **all five render correctly with every `AI_USE_*` flag off** (§2.1c).
4. Approving advances; requesting changes with notes bumps the revision,
   re-runs the stage, and the notes are visible against that stage.
5. A `config_patch` sent with a rejection is reflected in the re-run artifact.
6. Completion shows the assembled plan; Generate produces a **draft** exam and
   the preview reconciles delivered questions against the blueprint.
7. Publishing with findings present is **impossible without ticking the
   acknowledgement**; publishing without findings takes one confirm.
8. After publish the workspace is read-only and the exam appears in the
   existing exams area as published.
9. No fabricated progress anywhere — no percentage or ETA is shown for any AI
   call (§7.1).
10. Every error in §9.2 renders its mapped copy; a mid-request network drop
    produces the recovery card, not a failure message.
11. The full journey is usable at 375px width, with checkpoint actions
    reachable without scrolling past the artifact.
12. `npm run build` and `npm run lint` pass; no new npm dependencies.
