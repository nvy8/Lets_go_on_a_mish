"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Option = {
  kind: "clean" | "factual_error" | "ai_tell" | "both";
  text: string;
  teach_note: string;
};
type Item = {
  fact_id: string;
  fact_text: string;
  options: Option[];
  correct_index: number;
};

const KIND_LABELS: Record<string, { label: string; color: string }> = {
  clean: { label: "✅ Accurate", color: "bg-green-100 text-green-800 border-green-300" },
  factual_error: { label: "❌ Wrong fact", color: "bg-red-100 text-red-800 border-red-300" },
  ai_tell: { label: "🤖 AI tells", color: "bg-purple-100 text-purple-800 border-purple-300" },
  both: { label: "🤖❌ Both", color: "bg-orange-100 text-orange-800 border-orange-300" },
};

export function Stage5({ shareToken }: { shareToken: string }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[] | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState<{ correct: number; total: number; earned_badge: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/stage/5/init", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (d.items) setItems(d.items);
      });
  }, []);

  function pick(factId: string, optionIdx: number) {
    if (revealed[factId]) return;
    setPicks((prev) => ({ ...prev, [factId]: optionIdx }));
  }

  function reveal(factId: string) {
    setRevealed((prev) => ({ ...prev, [factId]: true }));
  }

  function next() {
    setCurrentIdx((i) => i + 1);
  }

  async function finish() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/stage/5/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ picks }),
      });
      const data = await res.json();
      if (res.ok) setDone(data);
    } finally {
      setSubmitting(false);
    }
  }

  if (!items) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-zinc-500">
        <div className="text-2xl">🕵️</div>
        <div className="mt-2">Generating 4 versions of each fact (1 real, 3 AI-flavoured fakes)...</div>
        <div className="mt-1 text-xs">(takes 20-30s — this is the trickiest one to fake well)</div>
      </div>
    );
  }

  if (!items.length) {
    return <div className="text-red-600">No items to compare. Refresh.</div>;
  }

  if (done) {
    const allPerfect = done.earned_badge;
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-8 text-center">
        <div className="text-5xl">{allPerfect ? "🏅" : "🎓"}</div>
        <h2 className="mt-3 text-xl font-semibold">
          {allPerfect ? "Badge unlocked: Hallucination Hunter" : "Stage 5 complete"}
        </h2>
        <p className="mt-2 text-zinc-700">
          You spotted <b>{done.correct}/{done.total}</b> accurate versions.
        </p>
        <button
          onClick={() => router.push(`/m/${shareToken}/complete`)}
          className="mt-6 rounded-full bg-amber-500 px-6 py-3 text-base font-semibold text-white"
        >
          See your Research Brief →
        </button>
      </div>
    );
  }

  const current = items[currentIdx];
  const isLast = currentIdx === items.length - 1;
  const kidPick = picks[current.fact_id];
  const isRevealed = revealed[current.fact_id];

  return (
    <div>
      <div className="rounded-2xl border-2 border-amber-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl font-bold">🕵️ Spot the FAKE!</h2>
          <div className="text-sm font-bold text-amber-700">
            {currentIdx + 1} of {items.length}
          </div>
        </div>
        <p className="mt-2 text-base text-zinc-700">
          One of these 4 is the REAL version. The other 3 are <b>fakes</b> — wrong info, weird AI
          writing, or both. Pick the real one!
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          💡 Watch out for: wrong dates, weird AI words like &quot;moreover&quot; or &quot;delve into&quot;,
          em-dashes, and fancy-sounding nonsense.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
        <div className="text-sm font-bold uppercase tracking-wide text-amber-700">
          📌 The real fact (you found this in 2+ sources)
        </div>
        <div className="mt-1 text-lg font-semibold leading-7">{current.fact_text}</div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {current.options.map((opt, idx) => {
          const isPicked = kidPick === idx;
          const isCorrect = idx === current.correct_index;
          const showResult = isRevealed;
          let cardClass = "border-zinc-200 bg-white";
          if (showResult) {
            if (isCorrect) cardClass = "border-green-400 bg-green-50";
            else if (isPicked) cardClass = "border-red-400 bg-red-50";
            else cardClass = "border-zinc-200 bg-white";
          } else if (isPicked) {
            cardClass = "border-amber-500 bg-amber-50 ring-2 ring-amber-200";
          }
          return (
            <button
              key={idx}
              onClick={() => pick(current.fact_id, idx)}
              disabled={isRevealed}
              className={`rounded-xl border p-4 text-left transition ${cardClass}`}
            >
              <div className="flex items-start gap-3">
                <div className="text-xs font-mono text-zinc-400 mt-0.5">
                  {String.fromCharCode(65 + idx)}
                </div>
                <div className="flex-1">
                  <div className="text-sm">{opt.text}</div>
                  {showResult && (
                    <div className="mt-2 space-y-1">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-mono uppercase ${KIND_LABELS[opt.kind]?.color}`}
                      >
                        {KIND_LABELS[opt.kind]?.label}
                      </span>
                      <div className="text-xs italic text-zinc-600">{opt.teach_note}</div>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        {!isRevealed && kidPick !== undefined && (
          <button
            onClick={() => reveal(current.fact_id)}
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm text-white"
          >
            Lock in & reveal →
          </button>
        )}
        {isRevealed && !isLast && (
          <button
            onClick={next}
            className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Next fact →
          </button>
        )}
        {isRevealed && isLast && (
          <button
            onClick={finish}
            disabled={submitting}
            className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Saving..." : "See my final brief →"}
          </button>
        )}
      </div>
    </div>
  );
}
