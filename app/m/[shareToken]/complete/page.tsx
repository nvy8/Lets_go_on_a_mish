"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { generatePDF } from "@/lib/pdf";

type ExportData = {
  display_name: string;
  mission: { title: string; topic: string };
  refined_query: string | null;
  badges: string[];
  sources: Array<{ url: string; title: string; domain: string }>;
  facts: Array<{ fact: string; explanation?: string; grade?: string }>;
  hallucination_score?: { correct: number; total: number };
  source_score?: { agree: number; total: number };
};

export default function CompletePage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = use(params);
  const [data, setData] = useState<ExportData | null>(null);

  useEffect(() => {
    fetch("/api/export")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return <main className="p-12 text-zinc-500">Loading your brief...</main>;
  }

  if (!data.mission) {
    return (
      <main className="p-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
          Couldn't load your session. <Link href={`/m/${shareToken}`}>Restart →</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <div className="text-center">
        <div className="text-7xl">🏆</div>
        <h1 className="mt-3 text-4xl font-semibold">Mission complete</h1>
        <p className="mt-2 text-lg text-zinc-600">
          Nice work, <b>{data.display_name}</b>.
        </p>
      </div>

      <div className="mt-10 rounded-3xl border-2 border-amber-300 bg-amber-50 p-6 text-center">
        <div className="text-sm font-mono uppercase tracking-wide text-amber-700">
          Badges earned
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {data.badges.length === 0 && (
            <span className="text-zinc-500 text-sm">No badges this run</span>
          )}
          {data.badges.map((b) => (
            <span
              key={b}
              className="rounded-full bg-white border-2 border-amber-400 px-4 py-2 text-sm font-semibold"
            >
              🏅 {b}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="text-xs font-mono uppercase tracking-wide text-amber-600">
          Research question
        </div>
        <div className="mt-1 text-base font-semibold">
          {data.refined_query || data.mission.topic}
        </div>

        <div className="mt-6 text-xs font-mono uppercase tracking-wide text-amber-600">
          {data.facts.length} verified facts
        </div>
        <ul className="mt-2 space-y-2 text-sm">
          {data.facts.map((f, i) => (
            <li key={i}>
              <b>{i + 1}.</b> {f.fact}
              {f.explanation && (
                <div className="ml-4 text-zinc-600 italic">"{f.explanation}"</div>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-6 text-xs font-mono uppercase tracking-wide text-amber-600">
          Sources
        </div>
        <ul className="mt-2 space-y-1 text-sm">
          {data.sources.map((s, i) => (
            <li key={i}>
              [{i + 1}] {s.title}
              <div className="text-xs text-blue-700">{s.url}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={() => generatePDF(data)}
          className="rounded-full bg-amber-500 px-6 py-3 text-base font-semibold text-white hover:bg-amber-600"
        >
          📥 Download Research Brief (PDF)
        </button>
        <Link
          href="/"
          className="rounded-full border border-zinc-300 bg-white px-6 py-3 text-center text-base text-zinc-700"
        >
          Back to start
        </Link>
      </div>

      <p className="mt-10 text-center text-xs text-zinc-500">
        Drag this PDF into your Google Classroom project assignment.
      </p>
    </main>
  );
}
