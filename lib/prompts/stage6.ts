export function generateHallucinationOptionsPrompt(
  factText: string,
  sourceContext: string,
): string {
  return `You are creating an "spot the hallucination" exercise for an 11-year-old learning AI literacy.

The TRUE fact (already verified across 3 sources): "${factText}"

Source context for grounding:
"${sourceContext.slice(0, 1500)}"

Generate 4 versions of this fact in random order:
1. CLEAN — accurate paraphrase, natural human writing tone
2. FACTUAL_ERROR — subtly wrong (wrong date by a century, swapped cause/effect, wrong place/people, invented authority name). Tone is natural.
3. AI_TELL — factually correct BUT written with cliché AI language (em-dashes, "moreover", "it's important to note that", "delve into", "in essence", "tapestry", overconfident hedging, repetitive structure)
4. BOTH — has BOTH a factual error AND AI-tell language

Return ONLY JSON in this exact shape (and SHUFFLE the order so clean isn't always first):
{
  "options": [
    {"kind": "clean" | "factual_error" | "ai_tell" | "both", "text": "...", "teach_note": "one short sentence explaining what makes this fake or real"}
  ]
}

CRITICAL:
- Each option should be 1-2 sentences, written like a kid wrote it (simple words)
- For the "ai_tell" version, EXAGGERATE the AI tone so it's spottable
- For "factual_error", make the error subtle but real
- The teach_note for the "clean" one should say "This is the accurate one"
- The teach_note for fakes should specifically name what's wrong (e.g. "Wrong date — Ottoman raids started in 1395, not 1395 BC" or "Notice 'delve into' and 'in essence' — classic AI filler")`;
}
