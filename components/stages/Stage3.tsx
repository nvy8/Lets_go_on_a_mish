"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type EvidencePiece = { source_id: string; snippet: string };
type Fact = {
  id: string;
  plain_text: string;
  evidence: EvidencePiece[];
  source_clicks: Record<string, "yes" | "no">;
  source_clicks_verified: Record<string, boolean>;
};
type ClientSource = { id: string; url?: string; domain: string; title: string };
type Feedback = { correct: boolean; verified: boolean; hint?: string };

export function Stage3({ shareToken }: { shareToken: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [sources, setSources] = useState<ClientSource[]>([]);

  const [factIdx, setFactIdx] = useState(0);
  const [sourceIdx, setSourceIdx] = useState(0);

  const [phase, setPhase] = useState<"ask" | "feedback" | "fact_summary">("ask");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [finalSummary, setFinalSummary] = useState<{
    triangulated_count: number;
    earned_badge: boolean;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/stage/3/extract", { method: "POST" });
      const data = await r.json();
      if (data.facts && data.sources) {
        setFacts(data.facts);
        setSources(data.sources);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center">
        <div className="text-4xl">🧩</div>
        <div className="mt-3 text-lg text-zinc-700">
          Your coach is reading all 3 websites and picking 5 facts to check...
        </div>
        <div className="mt-1 text-sm text-zinc-500">(takes 15-20 seconds)</div>
      </div>
    );
  }

  if (!facts.length || !sources.length) {
    return <div className="text-red-600">Failed to load. Refresh.</div>;
  }

  if (finalSummary) {
    return (
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-8 text-center">
        <div className="text-6xl">{finalSummary.earned_badge ? "🏅" : "📋"}</div>
        <h2 className="mt-3 text-2xl font-bold">
          {finalSummary.earned_badge
            ? "Badge unlocked: Triangulator"
            : "Stage 3 complete"}
        </h2>
        <p className="mt-3 text-base text-zinc-700">
          You triangulated <b>{finalSummary.triangulated_count}</b> out of {facts.length} facts
          across at least 2 sites.
        </p>
        <button
          onClick={() => router.push(`/m/${shareToken}/stage/4`)}
          className="mt-6 rounded-full bg-amber-500 px-8 py-3 text-lg font-bold text-white"
        >
          Continue to Explain →
        </button>
      </div>
    );
  }

  const currentFact = facts[factIdx];
  const evidenceList = (currentFact.evidence || []).filter((e) =>
    sources.find((s) => s.id === e.source_id),
  );
  const currentEvidence = evidenceList[sourceIdx];
  const currentSource = sources.find((s) => s.id === currentEvidence?.source_id);

  async function submitAnswer(answer: "yes" | "no") {
    if (!currentFact || !currentEvidence) return;
    setSubmitting(true);
    try {
      const r = await fetch("/api/stage/3/verify-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fact_id: currentFact.id,
          source_id: currentEvidence.source_id,
          kid_answer: answer,
        }),
      });
      const data: Feedback = await r.json();
      setFacts((prev) =>
        prev.map((f) =>
          f.id === currentFact.id
            ? {
                ...f,
                source_clicks: { ...f.source_clicks, [currentEvidence.source_id]: answer },
                source_clicks_verified: {
                  ...f.source_clicks_verified,
                  [currentEvidence.source_id]: data.verified,
                },
              }
            : f,
        ),
      );
      setFeedback(data);
      setPhase("feedback");
    } finally {
      setSubmitting(false);
    }
  }

  function nextStep() {
    setFeedback(null);
    if (sourceIdx < evidenceList.length - 1) {
      setSourceIdx(sourceIdx + 1);
      setPhase("ask");
    } else {
      setPhase("fact_summary");
    }
  }

  async function nextFact() {
    if (factIdx < facts.length - 1) {
      setFactIdx(factIdx + 1);
      setSourceIdx(0);
      setFeedback(null);
      setPhase("ask");
    } else {
      const r = await fetch("/api/stage/3/advance", { method: "POST" });
      const data = await r.json();
      setFinalSummary(data);
    }
  }

  if (phase === "fact_summary") {
    const verifiedForFact = Object.values(currentFact.source_clicks_verified || {}).filter(
      Boolean,
    ).length;
    const isTriangulated = verifiedForFact >= 2;
    return (
      <div className="mx-auto max-w-2xl">
        <div className="text-center text-xs font-bold uppercase tracking-wide text-amber-600">
          Fact {factIdx + 1} of {facts.length}
        </div>
        <div
          className={`mt-3 rounded-3xl border-2 p-8 text-center ${
            isTriangulated ? "border-green-300 bg-green-50" : "border-zinc-300 bg-white"
          }`}
        >
          <div className="text-5xl">{isTriangulated ? "🎯" : "🔍"}</div>
          <h2 className="mt-3 text-2xl font-bold">
            You found this fact in {verifiedForFact} out of {evidenceList.length} sites!
          </h2>
          <div className="mt-4 rounded-xl bg-white border border-zinc-200 p-4 text-left">
            <div className="text-xs font-mono uppercase text-zinc-500">📌 The fact</div>
            <div className="mt-1 text-base font-semibold">{currentFact.plain_text}</div>
          </div>
          {isTriangulated ? (
            <p className="mt-4 text-base text-green-800">
              ✓ Triangulated — you found it in at least 2 sites. That&apos;s a fact you can trust!
            </p>
          ) : (
            <p className="mt-4 text-base text-zinc-700">
              Hmm — not enough sources backed this one up. Be careful before trusting it.
            </p>
          )}
          <button
            onClick={nextFact}
            className="mt-6 rounded-full bg-amber-500 px-8 py-3 text-lg font-bold text-white"
          >
            {factIdx < facts.length - 1 ? "Next fact →" : "See my score →"}
          </button>
        </div>
      </div>
    );
  }

  const triangulatedSoFar = facts.filter((f) => {
    const v = Object.values(f.source_clicks_verified || {}).filter(Boolean).length;
    return v >= 2;
  }).length;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between text-xs">
        <div className="font-bold uppercase tracking-wide text-amber-600">
          Fact {factIdx + 1} of {facts.length} · Site {sourceIdx + 1} of {evidenceList.length}
        </div>
        <div className="text-zinc-500">
          Triangulated so far: <b className="text-amber-700">{triangulatedSoFar}</b>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
        <div className="text-xs font-bold uppercase tracking-wide text-amber-700">📌 The fact</div>
        <div className="mt-1 text-xl font-bold leading-snug">{currentFact.plain_text}</div>
      </div>

      <div className="mt-4 rounded-2xl border-2 border-zinc-200 bg-white p-5">
        <div className="text-xs font-bold uppercase tracking-wide text-zinc-500">
          🌐 What this site said
        </div>
        <div className="mt-1 text-sm font-mono text-zinc-600">{currentSource?.domain}</div>
        <div className="mt-3 rounded-lg bg-zinc-50 p-4 text-base leading-7 text-zinc-900">
          {currentEvidence?.snippet}
        </div>
        {currentSource?.url && (
          <a
            href={currentSource.url}
            target="_blank"
            rel="noopener"
            className="mt-3 inline-block text-xs text-blue-700 underline"
          >
            🔗 Open the full website
          </a>
        )}
      </div>

      {phase === "ask" && (
        <div className="mt-5">
          <div className="text-center text-base font-semibold text-zinc-700">
            Does this snippet really say the fact above?
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => submitAnswer("yes")}
              disabled={submitting}
              className="flex-1 rounded-full bg-green-500 px-6 py-4 text-lg font-bold text-white hover:bg-green-600 disabled:opacity-50"
            >
              ✓ Yes, I see it!
            </button>
            <button
              onClick={() => submitAnswer("no")}
              disabled={submitting}
              className="flex-1 rounded-full bg-red-500 px-6 py-4 text-lg font-bold text-white hover:bg-red-600 disabled:opacity-50"
            >
              ✗ No, not quite
            </button>
          </div>
        </div>
      )}

      {phase === "feedback" && feedback && (
        <div className="mt-5">
          <div
            className={`rounded-2xl border-2 p-5 ${
              feedback.correct
                ? "border-green-400 bg-green-50"
                : "border-amber-400 bg-amber-50"
            }`}
          >
            <div className="text-xl font-bold">
              {feedback.correct ? "✓ Nice eye!" : "🤔 Look again"}
            </div>
            {feedback.hint && (
              <div className="mt-2 text-base text-zinc-800">{feedback.hint}</div>
            )}
            {feedback.correct && feedback.verified && (
              <div className="mt-2 text-sm text-green-800">
                That counts as one site backing the fact!
              </div>
            )}
            {feedback.correct && !feedback.verified && (
              <div className="mt-2 text-sm text-zinc-700">
                Correct — and you noticed this site doesn&apos;t really back the fact. Sharp.
              </div>
            )}
          </div>
          <button
            onClick={nextStep}
            className="mt-4 w-full rounded-full bg-zinc-900 px-6 py-3 text-base font-bold text-white"
          >
            {sourceIdx < evidenceList.length - 1 ? "Next site →" : "See my score for this fact →"}
          </button>
        </div>
      )}
    </div>
  );
}
