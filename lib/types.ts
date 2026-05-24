import { ObjectId } from 'mongodb';

export type Teacher = {
  _id: ObjectId;
  email: string;
  password: string;
  created_at: Date;
  last_login: Date;
};

export type Project = {
  _id: ObjectId;
  teacher_id: ObjectId;
  name: string;
  description?: string;
  // Optional scheduling hint — purely metadata, not enforced.
  // Lets the teacher say "this is a 6-week unit" so the project page
  // can group missions by week.
  week_count?: number;
  created_at: Date;
  archived_at?: Date; // soft-delete; archived projects hide from default lists
};

// ─────────────────────────────────────────────────────────────────────────────
// Mission TYPES (the templates) — first-class documents
// ─────────────────────────────────────────────────────────────────────────────

export type StagePrimitive =
  | 'pick-then-write'      // current Stage 1 pattern (Sharpen your question)
  | 'judge-list'           // current Stage 2 pattern (Investigate sources)
  | 'find-evidence'        // current Stage 3 pattern (Triangulate facts)
  | 'explain-grade'        // current Stage 4 pattern (Explain in own words)
  | 'multiple-choice'      // current Stage 5 pattern (Spot Hallucinations)
  | 'task-checkoff'        // NEW: kid sees description, taps "I did it"
  | 'breath-timer'         // NEW: animated breathing exercise on a timer
  | 'read-then-quiz'       // NEW: read passage, AI-graded quiz
  | 'gratitude-list';      // NEW: write 3 things, AI gentle feedback

export type BadgeDefinition = {
  slug: string;            // stable id, e.g. "url-detective"
  name: string;            // kid-facing label, e.g. "URL Detective"
  icon: string;            // lucide icon name or asset path
};

export type StageSpec = {
  id: string;              // stable within mission type, e.g. "query-design"
  name: string;            // kid-facing stage name
  description: string;     // 1-line teacher/parent description
  kind: StagePrimitive;    // dispatch key for renderer + handler
  prompts?: Record<string, string>;     // prompt templates with {placeholders}
  config?: Record<string, unknown>;     // primitive-specific config
  badge_on_complete?: string;           // badge slug awarded if completed well
};

export type MissionType = {
  _id: ObjectId;
  slug: string;            // unique, e.g. "sources-vetting"
  name: string;            // teacher/parent-facing
  description: string;     // shows in wizard type-picker grid
  icon: string;            // lucide icon name or asset path
  audience: 'teacher' | 'parent' | 'both';
  default_badges: BadgeDefinition[];
  stages_spec: StageSpec[];
  is_builtin: boolean;     // true for seeded; false for user-created via orchestrator
  created_at: Date;
  created_by?: ObjectId;   // teacher who created (for user-created types)
};

// ─────────────────────────────────────────────────────────────────────────────
// Existing notepad/session sub-types — preserved unchanged
// ─────────────────────────────────────────────────────────────────────────────

export type SourceEntry = {
  id: string;
  url: string;
  title: string;
  domain: string;
  preview_text: string;
  origin: 'web' | 'ai';
  kid_verdict?: 'legit' | 'sus';
  ai_verdict?: 'legit' | 'sus';
  ai_reasoning?: string;
};

export type EvidencePiece = {
  source_id: string;
  snippet: string;
};

export type FactEntry = {
  id: string;
  plain_text: string;
  evidence?: EvidencePiece[];
  source_clicks: { [sourceId: string]: 'yes' | 'no' };
  source_clicks_verified: { [sourceId: string]: boolean };
  triangulated?: boolean;
  kid_explanation?: string;
  ai_grade?: 'approaching' | 'meeting' | 'exceeding';
  ai_feedback?: string;
};

export type HallucinationResult = {
  fact_id: string;
  options: Array<{ kind: 'clean' | 'factual_error' | 'ai_tell' | 'both'; text: string }>;
  kid_pick_index?: number;
  correct_index: number;
};

export type Notepad = {
  refined_query?: string;
  candidate_sources?: SourceEntry[];
  selected_source_ids?: string[];
  verified_source_ids?: string[];
  facts?: FactEntry[];
  hallucinations?: HallucinationResult[];
  // ── new primitive notepads (loose typing — each primitive owns its own slice)
  [key: string]: unknown;
};

// ─────────────────────────────────────────────────────────────────────────────
// Mission INSTANCES (existing — extended with type ref + wizard config)
// ─────────────────────────────────────────────────────────────────────────────

export type RewardsConfig = {
  points_per_completion?: number;
  badges_offered: string[];        // badge slugs from mission_type.default_badges or custom
};

export type Mission = {
  _id: ObjectId;
  teacher_id: ObjectId;
  title: string;
  topic: string;
  knowledge_base_text?: string;
  share_token: string;
  created_at: Date;
  // ── platform refactor additions (all optional for backward compat)
  mission_type_id?: ObjectId;                // foreign key to MissionType; if absent, defaults to 'sources-vetting'
  audience_role?: 'teacher' | 'parent';      // who created this instance
  timer_seconds?: number;                    // optional soft countdown
  rewards_config?: RewardsConfig;            // badges offered + points
  custom_badge_definitions?: BadgeDefinition[]; // per-mission badge overrides
  extracted_facts?: string[];                // populated by PDF extraction orchestrator
  // ── project grouping (dev-tudor): Mission can belong to a multi-week Project
  project_id?: ObjectId | null;              // null/missing = standalone mission
  position?: number;                         // ordering within the project
  week_number?: number;                      // week hint within a multi-week project
};

// StageNumber widened from literal to number (mission types can have any stage count)
export type StageNumber = number;

export type Session = {
  _id: ObjectId;
  mission_id: ObjectId;
  display_name: string;
  current_stage: StageNumber;
  badges_earned: string[];
  notepad: Notepad;
  created_at: Date;
  last_active_at: Date;
  // ── timer tracking
  started_at?: Date;       // when kid first lands on stage 1
  completed_at?: Date;     // when finishing last stage
};
