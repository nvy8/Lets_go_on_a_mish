"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Example = { quality: "bad" | "ok" | "strong"; text: string };
type Critique = { verdict: "strong" | "needs_work"; feedback: string };

export function Stage1({ shareToken }: { shareToken: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"pick" | "reveal" | "draft" | "done">("pick");
  const [examples, setExamples] = useState<Example[] | null>(null);
  const [loadingExamples, setLoadingExamples] = useState(true);
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);

  const [draft, setDraft] = useState("");
  const [critique, setCritique] = useState<Critique | null>(null);
  const [critiquing, setCritiquing] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    fetch("/api/stage/1/init", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (d.examples) setExamples(d.examples);
      })
      .finally(() => setLoadingExamples(false));
  }, []);

  async function getCritique() {
    setCritiquing(true);
    try {
      const res = await fetch("/api/stage/1/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft }),
      });
      const data = await res.json();
      setCritique(data);
    } finally {
      setCritiquing(false);
    }
  }

  async function accept() {
    setAccepting(true);
    try {
      const res = await fetch("/api/stage/1/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refined_query: draft }),
      });
      if (res.ok) router.push(`/m/${shareToken}/stage/2`);
    } finally {
      setAccepting(false);
    }
  }

  if (loadingExamples) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center">
        <div className="text-4xl">🔍</div>
        <div className="mt-3 text-lg text-zinc-700">Your coach is writing some examples...</div>
        <div className="mt-1 text-sm text-zinc-500">(takes about 5 seconds)</div>
      </div>
    );
  }

  if (!examples) {
    return <div className="text-red-600">Failed to load examples. Refresh the page.</div>;
  }

  // PHASE 1: pick the strongest
  if (phase === "pick") {
    return (
      <div>
        <div className="rounded-2xl border-2 border-amber-200 bg-white p-6">
          <h2 className="text-2xl font-bold">
            🤔 Which question is best?
          </h2>
          <p className="mt-2 text-base text-zinc-700">
            Here are 3 different ways to ask about your topic. <b>Which one would help you find a real, focused answer?</b>
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            💡 Tip: a good question is specific, not too broad, and asks WHY or HOW.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            {examples.map((ex, i) => (
              <button
                key={i}
                onClick={() => setPickedIdx(i)}
                className={`rounded-2xl border-2 p-5 text-left transition ${
                  pickedIdx === i
                    ? "border-amber-500 bg-amber-50 shadow-md"
                    : "border-zinc-200 bg-white hover:border-amber-300"
                }`}
              >
                <div className="text-sm font-bold text-zinc-400">{String.fromCharCode(65 + i)}</div>
                <div className="mt-1 text-lg leading-7">{ex.text}</div>
              </button>
            ))}
          </div>
          <button
            disabled={pickedIdx === null}
            onClick={() => setPhase("reveal")}
            className="mt-6 rounded-full bg-zinc-900 px-8 py-3 text-base font-bold text-white disabled:opacity-40"
          >
            I picked one! →
          </button>
        </div>
      </div>
    );
  }

  // PHASE 2: reveal which was strongest
  if (phase === "reveal") {
    const correctIdx = examples.findIndex((e) => e.quality === "strong");
    const wasRight = pickedIdx === correctIdx;
    return (
      <div className="rounded-2xl border-2 border-zinc-200 bg-white p-6">
        <h2 className="text-2xl font-bold">
          {wasRight ? "🎯 Nice eye!" : "🤔 Almost — look again"}
        </h2>
        <p className="mt-2 text-base text-zinc-700">
          {wasRight
            ? "You picked the strongest one! That kind of question gets real, focused answers."
            : "The strongest question is the green one below. See the difference?"}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {examples.map((ex, i) => (
            <div
              key={i}
              className={`rounded-xl border p-3 ${
                ex.quality === "strong"
                  ? "border-green-400 bg-green-50"
                  : ex.quality === "ok"
                  ? "border-zinc-300 bg-white"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-mono uppercase">
                <span
                  className={
                    ex.quality === "strong"
                      ? "text-green-700"
                      : ex.quality === "ok"
                      ? "text-zinc-500"
                      : "text-red-600"
                  }
                >
                  {ex.quality === "strong" ? "✓ Strong" : ex.quality === "ok" ? "~ OK" : "✗ Too broad"}
                </span>
                {i === pickedIdx && (
                  <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white">
                    Your pick
                  </span>
                )}
              </div>
              <div className="mt-1 text-sm">{ex.text}</div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setPhase("draft")}
          className="mt-6 rounded-full bg-amber-500 px-8 py-3 text-base font-bold text-white"
        >
          Now write your own! →
        </button>
      </div>
    );
  }

  // PHASE 3: kid drafts their own
  return (
    <div className="rounded-2xl border-2 border-amber-200 bg-white p-6">
      <h2 className="text-2xl font-bold">✍️ Your turn!</h2>
      <p className="mt-2 text-base text-zinc-700">
        Write your OWN research question. Make it specific. Your coach will help you make it even better.
      </p>
      <textarea
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setCritique(null);
        }}
        placeholder="Type your research question here..."
        rows={3}
        className="mt-4 w-full rounded-xl border-2 border-zinc-300 px-4 py-3 text-lg leading-7 focus:border-amber-500 focus:outline-none"
      />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={getCritique}
          disabled={draft.length < 5 || critiquing}
          className="rounded-full bg-zinc-900 px-6 py-3 text-base font-semibold text-white disabled:opacity-40"
        >
          {critiquing ? "Coach is reading..." : "Ask the coach 🧑‍🏫"}
        </button>
        {critique && critique.verdict === "strong" && (
          <button
            onClick={accept}
            disabled={accepting}
            className="rounded-full bg-amber-500 px-6 py-3 text-base font-bold text-white disabled:opacity-50"
          >
            {accepting ? "Saving..." : "Let's go! →"}
          </button>
        )}
      </div>

      {critique && (
        <div
          className={`mt-5 rounded-xl border-2 p-5 ${
            critique.verdict === "strong"
              ? "border-green-300 bg-green-50"
              : "border-amber-300 bg-amber-50"
          }`}
        >
          <div className="text-sm font-bold uppercase">
            {critique.verdict === "strong" ? "✓ Coach says: Awesome!" : "✎ Coach says: Almost there"}
          </div>
          <div className="mt-2 text-base">{critique.feedback}</div>
        </div>
      )}
    </div>
  );
}
