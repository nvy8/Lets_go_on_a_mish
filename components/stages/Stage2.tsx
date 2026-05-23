"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SourceEntry } from "@/lib/types";

export function Stage2({ shareToken }: { shareToken: string }) {
  const router = useRouter();
  const [sources, setSources] = useState<SourceEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/stage/2/search", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (d.sources) setSources(d.sources);
      })
      .finally(() => setLoading(false));
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      return next;
    });
  }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/stage/2/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected_ids: [...selected] }),
      });
      if (res.ok) router.push(`/m/${shareToken}/stage/3`);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-zinc-500">
        <div className="text-2xl">🔎</div>
        <div className="mt-2">Searching the web AND asking an AI search engine...</div>
        <div className="mt-1 text-xs">(takes ~10s — two real searches happening in parallel)</div>
      </div>
    );
  }

  if (!sources) {
    return <div className="text-red-600">Failed to load search results.</div>;
  }

  const webResults = sources.filter((s) => s.origin === "web");
  const aiResults = sources.filter((s) => s.origin === "ai");

  return (
    <div>
      <div className="rounded-2xl border-2 border-amber-200 bg-white p-6">
        <h2 className="text-2xl font-bold">🔎 We did 2 searches for you</h2>
        <p className="mt-2 text-base text-zinc-700">
          5 results from a normal web search. 5 from an AI search engine.{" "}
          <b>Pick the 3 websites you'd actually trust the most.</b>
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          💡 Tip: not every result is good. Look at the website name (the domain) and the description.
        </p>
        <div className="mt-3 text-lg font-bold text-amber-700">
          Picked: {selected.size} / 3
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SourceColumn
          title="🌐 Web Search"
          subtitle="Classic search engine results"
          sources={webResults}
          selected={selected}
          onToggle={toggle}
        />
        <SourceColumn
          title="🤖 AI Search"
          subtitle="AI-generated answer with sources"
          sources={aiResults}
          selected={selected}
          onToggle={toggle}
        />
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={submit}
          disabled={selected.size !== 3 || submitting}
          className="rounded-full bg-amber-500 px-8 py-4 text-lg font-bold text-white disabled:opacity-40"
        >
          {submitting ? "Saving..." : "I picked my 3! →"}
        </button>
      </div>
    </div>
  );
}

function SourceColumn({
  title,
  subtitle,
  sources,
  selected,
  onToggle,
}: {
  title: string;
  subtitle: string;
  sources: SourceEntry[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-3">
        <div className="text-base font-semibold">{title}</div>
        <div className="text-xs text-zinc-500">{subtitle}</div>
      </div>
      <div className="flex flex-col gap-3">
        {sources.map((s) => {
          const isSelected = selected.has(s.id);
          return (
            <button
              key={s.id}
              onClick={() => onToggle(s.id)}
              className={`rounded-xl border p-4 text-left transition ${
                isSelected
                  ? "border-amber-500 bg-amber-50 ring-2 ring-amber-200"
                  : "border-zinc-200 bg-white hover:border-zinc-400"
              }`}
            >
              <div className="flex items-start gap-2">
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                    isSelected ? "border-amber-500 bg-amber-500" : "border-zinc-300"
                  }`}
                >
                  {isSelected && (
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3 w-3 text-white"
                    >
                      <path d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0L4.3 9.7a1 1 0 011.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-mono text-zinc-500">{s.domain}</div>
                  <div className="mt-0.5 text-sm font-semibold text-zinc-900">{s.title}</div>
                  <div className="mt-1 line-clamp-2 text-xs text-zinc-600">{s.preview_text}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
