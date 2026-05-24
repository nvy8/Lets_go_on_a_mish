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

export type Mission = {
  _id: ObjectId;
  teacher_id: ObjectId;
  title: string;
  topic: string;
  knowledge_base_text?: string;
  share_token: string;
  created_at: Date;
  // Optional project membership. Null/missing = standalone mission.
  project_id?: ObjectId | null;
  // Ordering within the project. Lower position renders first.
  position?: number;
  // Optional week hint when grouped under a multi-week project.
  week_number?: number;
};

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
};

export type StageNumber = 1 | 2 | 3 | 4 | 5;

export type Session = {
  _id: ObjectId;
  mission_id: ObjectId;
  display_name: string;
  current_stage: StageNumber;
  badges_earned: string[];
  notepad: Notepad;
  created_at: Date;
  last_active_at: Date;
};
