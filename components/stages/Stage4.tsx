"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SourceDoc = { id: string; url?: string; domain: string; title: string; text: string };
type Fact = {
  id: string;
  plain_text: string;
  source_clicks: Record<string, boolean>;
  source_clicks_verified: Record<string, boolean>;
};
type ClickState = "idle" | "checking" | "ok" | "rejected";

export function Stage4({ shareToken }: { shareToken: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<SourceDoc[]>([]);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [clickState, setClickState] = useState<Record<string, ClickState>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [focusedFactId, setFocusedFactId] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    triangulated_count: number;
    earned_badge: boolean;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/stage/4/extract", { method: "POST" });
      const data = await r.json();
      if (data.sources && data.facts) {
        setSources(data.sources);
        setFacts(data.facts);
      }
      setLoading(false);
    })();
  }, []);

  function clickKey(factId: string, sourceId: string) {
    return `${factId}::${sourceId}`;
  }

  async function handleClick(factId: string, sourceId: string) {
    const key = clickKey(factId, sourceId);
    if (clickState[key] === "checking" || clickState[key] === "ok") return;

    // Optimistic
    setClickState((prev) => ({ ...prev, [key]: "checking" }));
    setFacts((prev) =>
      prev.map((f) =>
        f.id === factId
          ? { ...f, source_clicks: { ...f.source_clicks, [sourceId]: true } }
          : f,
      ),
    );

    try {
      const res = await fetch("/api/stage/4/verify-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fact_id: factId, source_id: sourceId }),
      });
      const data = await res.json();

      if (data.supported) {
        setClickState((prev) => ({ ...prev, [key]: "ok" }));
        setFacts((prev) =>
          prev.map((f) =>
            f.id === factId
              ? {
                  ...f,
                  source_clicks_verified: {
                    ...f.source_clicks_verified,
                    [sourceId]: true,
                  },
                }
              : f,
          ),
        );
      } else {
        setClickState((prev) => ({ ...prev, [key]: "rejected" }));
        setFacts((prev) =>
          prev.map((f) =>
            f.id === factId
              ? {
                  ...f,
                  source_clicks: { ...f.source_clicks, [sourceId]: false },
                }
              : f,
          ),
        );
        setToast(data.reason || "Hmm — that fact isn't in this source. Look again.");
        setTimeout(() => setToast(null), 4000);
        setTimeout(() => {
          setClickState((prev) => {
            const next = { ...prev };
            if (next[key] === "rejected") delete next[key];
            return next;
          });
        }, 1500);
      }
    } catch {
      setClickState((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  async function advance() {
    setAdvancing(true);
    try {
      const r = await fetch("/api/stage/4/advance", { method: "POST" });
      const data = await r.json();
      setSummary(data);
    } finally {
      setAdvancing(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-zinc-500">
        <div className="text-2xl">🧩</div>
        <div className="mt-2">Your coach is reading all 3 sources and pulling out candidate facts...</div>
        <div className="mt-1 text-xs">(takes 10-20s — this is the hardest stage)</div>
      </div>
    );
  }

  if (summary) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-8 text-center">
        <div className="text-5xl">{summary.earned_badge ? "🏅" : "📋"}</div>
        <h2 className="mt-3 text-xl font-semibold">
          {summary.earned_badge
            ? "Badge unlocked: Triangulator"
            : "Stage 4 complete"}
        </h2>
        <p className="mt-2 text-zinc-700">
          You triangulated <b>{summary.triangulated_count}</b> facts across all 3 sources.
        </p>
        <button
          onClick={() => router.push(`/m/${shareToken}/stage/5`)}
          className="mt-6 rounded-full bg-amber-500 px-6 py-3 text-base font-semibold text-white"
        >
          Continue to Explain →
        </button>
      </div>
    );
  }

  if (!sources.length || !facts.length) {
    return <div className="text-red-600">Failed to load. Refresh.</div>;
  }

  const currentSource = sources[currentIdx];
  const isLastSource = currentIdx === sources.length - 1;
  const triangulatedCount = facts.filter(
    (f) =>
      Object.values(f.source_clicks_verified).filter(Boolean).length >= 2,
  ).length;

  return (
    <div className="relative">
      {toast && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-4 rounded-2xl border-2 border-amber-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="text-xs font-bold uppercase tracking-wide text-amber-600">
              📖 Reading website {currentIdx + 1} of {sources.length}
            </div>
            <div className="mt-1 text-xl font-bold leading-tight">{currentSource.title}</div>
            <div className="text-sm text-zinc-500">{currentSource.domain}</div>
          </div>
          <div className="text-right text-sm">
            <div className="text-zinc-500">You&apos;ve found</div>
            <div className="text-2xl font-bold text-amber-700">
              {triangulatedCount} / {facts.length}
            </div>
            <div className="text-xs text-zinc-500">facts in 2+ sites</div>
          </div>
        </div>
        {currentSource.url && (
          <a
            href={currentSource.url}
            target="_blank"
            rel="noopener"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
          >
            🔗 Open this website in a new tab
          </a>
        )}
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <b>How to play:</b> Read the text below. Whenever you spot one of the facts on the right,
          tap the <span className="font-mono">{currentIdx + 1}</span> next to it. Find each fact in
          at least 2 websites to triangulate it. 🧩
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* SOURCE TEXT — 2/3 cols */}
        <div className="lg:col-span-2">
          <div className="max-h-[65vh] overflow-y-auto rounded-2xl border-2 border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-2xl font-bold">{currentSource.title}</h3>
            <div className="mt-1 text-sm text-zinc-500">{currentSource.domain}</div>
            <div className="mt-4 whitespace-pre-wrap text-base leading-8 text-zinc-900">
              {currentSource.text || (
                <span className="italic text-zinc-500">
                  Couldn&apos;t auto-load this website&apos;s text. Open it in a new tab using the
                  blue button above to read it directly.
                </span>
              )}
            </div>
          </div>
          <div className="mt-3 flex justify-between gap-2">
            <button
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              className="rounded-full border-2 border-zinc-300 px-5 py-2.5 text-base font-semibold disabled:opacity-30"
            >
              ← Previous website
            </button>
            {!isLastSource ? (
              <button
                onClick={() => setCurrentIdx((i) => i + 1)}
                className="rounded-full bg-zinc-900 px-5 py-2.5 text-base font-semibold text-white"
              >
                Next website →
              </button>
            ) : (
              <button
                onClick={advance}
                disabled={advancing}
                className="rounded-full bg-amber-500 px-6 py-2.5 text-base font-bold text-white disabled:opacity-50"
              >
                {advancing ? "Saving..." : "I'm done — check my facts →"}
              </button>
            )}
          </div>
        </div>

        {/* FACTS SIDEBAR — 1/3 cols */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 max-h-[80vh] overflow-y-auto rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
            <div className="mb-3 text-sm font-bold uppercase tracking-wide text-amber-800">
              ✨ {facts.length} facts to find
            </div>
            <div className="text-xs text-amber-700 mb-3">
              Tap <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-white border border-zinc-400 text-xs font-mono">{currentIdx + 1}</span> when you spot a fact in this website.
            </div>
            <div className="flex flex-col gap-3">
              {facts.map((f) => {
                const verifiedCount = Object.values(f.source_clicks_verified).filter(Boolean).length;
                const triangulated = verifiedCount >= 2;
                const isFocused = focusedFactId === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => setFocusedFactId(isFocused ? null : f.id)}
                    className={`cursor-pointer rounded-xl border-2 bg-white p-3 transition ${
                      triangulated
                        ? "border-green-400 shadow-sm"
                        : isFocused
                        ? "border-amber-400 ring-2 ring-amber-200"
                        : "border-zinc-200"
                    }`}
                  >
                    <div className="text-sm font-semibold leading-snug text-zinc-900">
                      {triangulated && <span className="mr-1">🎯</span>}
                      {f.plain_text}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {sources.map((s, idx) => {
                        const key = clickKey(f.id, s.id);
                        const state = clickState[key];
                        const verified = f.source_clicks_verified[s.id];
                        const isCurrentSource = s.id === currentSource.id;
                        return (
                          <button
                            key={s.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isCurrentSource) handleClick(f.id, s.id);
                            }}
                            disabled={!isCurrentSource || verified || state === "checking"}
                            title={`Website ${idx + 1}: ${s.domain}`}
                            className={`flex h-9 w-9 items-center justify-center rounded-lg text-base font-bold transition ${
                              verified
                                ? "bg-green-500 text-white shadow"
                                : state === "checking"
                                ? "bg-amber-400 text-white animate-pulse"
                                : state === "rejected"
                                ? "bg-red-500 text-white animate-pulse"
                                : isCurrentSource
                                ? "border-2 border-amber-400 bg-white text-amber-700 hover:bg-amber-100"
                                : "border-2 border-zinc-200 bg-zinc-50 text-zinc-300"
                            }`}
                          >
                            {verified ? "✓" : state === "rejected" ? "✗" : idx + 1}
                          </button>
                        );
                      })}
                      <div className="ml-auto text-xs font-bold text-zinc-500">
                        {verifiedCount}/2+
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
