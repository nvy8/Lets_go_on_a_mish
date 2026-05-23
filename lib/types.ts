import { ObjectId } from 'mongodb';

export type Teacher = {
  _id: ObjectId;
  email: string;
  password: string;
  created_at: Date;
  last_login: Date;
};

export type Mission = {
  _id: ObjectId;
  teacher_id: ObjectId;
  title: string;
  topic: string;
  knowledge_base_text?: string;
  share_token: string;
  created_at: Date;
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

export type FactEntry = {
  id: string;
  plain_text: string;
  source_clicks: { [sourceId: string]: boolean };
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

export type StageNumber = 1 | 2 | 3 | 4 | 5 | 6;

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
