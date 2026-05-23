"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Fact = {
  id: string;
  plain_text: string;
  kid_explanation?: string;
  ai_grade?: "exceeding" | "meeting" | "approaching" | "far_from";
  ai_feedback?: string;
};

const GRADE_LABELS: Record<string, { label: string; color: string }> = {
  exceeding: { label: "✨ Exceeding", color: "bg-purple-100 text-purple-800 border-purple-300" },
  meeting: { label: "✓ Meeting", color: "bg-green-100 text-green-800 border-green-300" },
  approaching: { label: "~ Approaching", color: "bg-amber-100 text-amber-800 border-amber-300" },
  far_from: { label: "✗ Far from", color: "bg-red-100 text-red-800 border-red-300" },
};

export function Stage5({ shareToken }: { shareToken: string }) {
  const router = useRouter();
  const [facts, setFacts] = useState<Fact[] | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [draft, setDraft] = useState("");
  const [grading, setGrading] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [done, setDone] = useState(false);
  const [doneBadge, setDoneBadge] = useState(false);

  useEffect(() => {
    fetch("/api/stage/5/init")
      .then((r) => r.json())
      .then((d) => {
        if (d.facts) {
          setFacts(d.facts);
          // Find first ungraded
          const firstUngraded = d.facts.findIndex((f: Fact) => !f.ai_grade);
          if (firstUngraded >= 0) setCurrentIdx(firstUngraded);
          else setCurrentIdx(d.facts.length - 1);
        }
      });
  }, []);

  async function gradeCurrent() {
    if (!facts || !facts[currentIdx]) return;
    const f = facts[currentIdx];
    setGrading(true);
    try {
      const res = await fetch("/api/stage/5/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fact_id: f.id, explanation: draft }),
      });
      const data = await res.json();
      if (res.ok) {
        const updated = [...facts];
        updated[currentIdx] = {
          ...f,
          kid_explanation: draft,
          ai_grade: data.grade,
          ai_feedback: data.feedback,
        };
        setFacts(updated);
      }
    } finally {
      setGrading(false);
    }
  }

  function nextFact() {
    setDraft("");
    setCurrentIdx((i) => i + 1);
  }

  async function finish() {
    setAdvancing(true);
    try {
      const r = await fetch("/api/stage/5/advance", { method: "POST" });
      const d = await r.json();
      if (r.ok) {
        setDoneBadge(d.earned_badge);
        setDone(true);
      }
    } finally {
      setAdvancing(false);
    }
  }

  if (!facts) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-zinc-500">
        Loading your triangulated facts...
      </div>
    );
  }

  if (!facts.length) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        No triangulated facts to explain. You may need to redo Stage 4.
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-8 text-center">
        <div className="text-5xl">{doneBadge ? "🏅" : "📋"}</div>
        <h2 className="mt-3 text-xl font-semibold">
          {doneBadge ? "Badge unlocked: Wordsmith" : "Stage 5 complete"}
        </h2>
        <p className="mt-2 text-zinc-700">
          {doneBadge
            ? "All your explanations hit Meeting or Exceeding. Real comprehension."
            : "Some explanations could be sharper. Keep practising paraphrasing."}
        </p>
        <button
          onClick={() => router.push(`/m/${shareToken}/stage/6`)}
          className="mt-6 rounded-full bg-amber-500 px-6 py-3 text-base font-semibold text-white"
        >
          Continue to Spot Hallucinations →
        </button>
      </div>
    );
  }

  const current = facts[currentIdx];
  const allGraded = facts.every((f) => f.ai_grade);
  const isLast = currentIdx === facts.length - 1;

  return (
    <div>
      <div className="rounded-2xl border-2 border-amber-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl font-bold">✍️ Tell me in YOUR words</h2>
          <div className="text-sm font-bold text-amber-700">
            {currentIdx + 1} of {facts.length}
          </div>
        </div>
        <p className="mt-2 text-base text-zinc-700">
          No copy-pasting! Explain it like you&apos;re telling a friend who&apos;s never heard of
          this. <b>Bonus points if you say WHY it matters.</b>
        </p>
      </div>

      <div className="mt-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
        <div className="text-sm font-bold uppercase tracking-wide text-amber-700">
          📌 The fact
        </div>
        <div className="mt-1 text-lg font-semibold leading-7">{current.plain_text}</div>
      </div>

      {!current.ai_grade ? (
        <div className="mt-4">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="In my own words: this means..."
            rows={5}
            className="w-full rounded-xl border-2 border-zinc-300 px-4 py-3 text-lg leading-7 focus:border-amber-500 focus:outline-none"
          />
          <button
            onClick={gradeCurrent}
            disabled={draft.length < 10 || grading}
            className="mt-3 rounded-full bg-zinc-900 px-6 py-3 text-base font-semibold text-white disabled:opacity-40"
          >
            {grading ? "Coach is reading..." : "Ask the coach 🧑‍🏫"}
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="text-xs font-mono uppercase text-zinc-500">Your explanation</div>
            <div className="mt-1 text-sm">{current.kid_explanation}</div>
          </div>
          <div
            className={`rounded-xl border p-4 ${GRADE_LABELS[current.ai_grade]?.color || "border-zinc-200"}`}
          >
            <div className="text-xs font-mono uppercase">
              {GRADE_LABELS[current.ai_grade]?.label || current.ai_grade}
            </div>
            <div className="mt-1 text-sm">{current.ai_feedback}</div>
          </div>
          <div className="flex justify-end gap-2">
            {!isLast ? (
              <button
                onClick={nextFact}
                className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Next fact →
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={!allGraded || advancing}
                className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
              >
                {advancing ? "Saving..." : "Finish Stage 5 →"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
