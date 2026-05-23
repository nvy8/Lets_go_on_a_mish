export function gradeExplanationPrompt(
  factText: string,
  kidExplanation: string,
  sourceTexts: string[],
): string {
  const sources = sourceTexts.map((t, i) => `[Source ${i + 1}] ${t.slice(0, 800)}`).join('\n\n');
  return `An 11-year-old student is explaining a fact in their own words.

The fact: "${factText}"

The student's explanation:
"${kidExplanation}"

For reference, the original sources said:
${sources}

Grade the student's explanation on three criteria:
1. NOT COPY-PASTED — uses their own words, not lifted verbatim from sources
2. FACTUALLY CONSISTENT — doesn't contradict the sources
3. SHOWS COMPREHENSION — explains WHY or HOW, not just restates the fact

Award one of these grades:
- "exceeding" — original phrasing + adds insight or context beyond what's in the sources
- "meeting" — own words, accurate, shows they understood
- "approaching" — mostly own words but shallow OR slightly inaccurate
- "far_from" — looks copy-pasted, factually wrong, or just one or two words

Return ONLY JSON:
{"grade": "exceeding" | "meeting" | "approaching" | "far_from", "feedback": "one short kid-friendly sentence"}

CRITICAL: Be encouraging. Even "approaching" should feel like "you're close, keep going" not "wrong". Two sentences MAX in feedback.`;
}
