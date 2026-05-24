// Mission type registry — maps slug → display metadata + runner reference.
// New mission types register here. Stage router uses this to dispatch.

export type TypeMeta = {
  slug: string;
  name: string;
  description: string;
  audience: 'teacher' | 'parent' | 'both';
  stageNames: string[];   // index 0 unused, [1..N] are kid-facing stage names
  totalStages: number;
};

export const TYPE_REGISTRY: Record<string, TypeMeta> = {
  'sources-vetting': {
    slug: 'sources-vetting',
    name: 'Sources Vetting',
    description:
      'Classic research-skills loop — kids sharpen a question, judge sources, triangulate facts, explain, and spot AI hallucinations.',
    audience: 'teacher',
    stageNames: [
      '',
      'Sharpen your question',
      'Investigate',
      'Triangulate',
      'Explain',
      'Spot Hallucinations',
    ],
    totalStages: 5,
  },
  'chore-check': {
    slug: 'chore-check',
    name: 'Chore Check',
    description:
      'Parent gives kid a real-world task. Kid taps "I did it!" when done. Honour code — parent honours the reward.',
    audience: 'parent',
    stageNames: ['', 'Do the task'],
    totalStages: 1,
  },
  'dopamine-reset': {
    slug: 'dopamine-reset',
    name: 'Dopamine Reset',
    description:
      'Quick 4-step reset — box breathing, gratitude list, a real-world micro-task, and a closing breath.',
    audience: 'both',
    stageNames: ['', 'Breathe in', 'Three things', 'Step away', 'Calm close'],
    totalStages: 4,
  },
  'reading-drill': {
    slug: 'reading-drill',
    name: 'Reading Drill',
    description:
      'Kid reads a short passage from the knowledge base, then explains the main ideas in their own words.',
    audience: 'teacher',
    stageNames: ['', 'Read', 'Explain in your own words'],
    totalStages: 2,
  },
};

export function getTypeMeta(slug: string | undefined): TypeMeta {
  return TYPE_REGISTRY[slug || 'sources-vetting'] || TYPE_REGISTRY['sources-vetting'];
}
