"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Trophy, Award, Download, Pin, FileText, Globe } from "lucide-react";
import { generatePDF } from "@/lib/pdf";
import { HDCard } from "@/components/handdrawn/HDCard";
import { HDButton } from "@/components/handdrawn/HDButton";
import { COLOR, RADIUS, SHADOW, KALAM, pencilAlpha, PAPER_BG } from "@/lib/design-tokens";

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
    return (
      <main
        className="flex flex-1 items-center justify-center p-12"
        style={PAPER_BG}
      >
        <div style={{ ...KALAM, color: pencilAlpha("99") }}>Loading your brief…</div>
      </main>
    );
  }

  if (!data.mission) {
    return (
      <main className="flex flex-1 items-center justify-center p-12" style={PAPER_BG}>
        <HDCard variant="postItPink" className="p-6 max-w-md">
          Couldn&apos;t load your session.{" "}
          <Link
            href={`/m/${shareToken}`}
            className="underline"
            style={{ color: COLOR.red }}
          >
            Restart →
          </Link>
        </HDCard>
      </main>
    );
  }

  return (
    <main className="flex-1" style={PAPER_BG}>
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/svg/brand/mascot-celebrate.svg"
            alt=""
            aria-hidden="true"
            className="mx-auto h-36 w-36 animate-sleuth-pop-in"
          />
          <div
            className="mx-auto -mt-3 inline-flex h-14 w-14 items-center justify-center border-[3px] rotate-3"
            style={{
              borderColor: COLOR.pencil,
              backgroundColor: COLOR.gold,
              borderRadius: RADIUS.oval,
              boxShadow: SHADOW.md,
            }}
          >
            <Trophy size={30} strokeWidth={2.5} color={COLOR.pencil} />
          </div>
          <h1
            className="mt-5 text-5xl"
            style={{ ...KALAM, color: COLOR.pencil }}
          >
            Mission complete!
          </h1>
          <p
            className="mt-3 text-lg"
            style={{ color: pencilAlpha("cc") }}
          >
            Nice work,{" "}
            <span style={{ ...KALAM, color: COLOR.red }}>{data.display_name}</span>.
          </p>
        </div>

        <HDCard variant="postIt" className="mt-10 p-6 text-center" decoration="tape">
          <div
            className="text-sm"
            style={{ ...KALAM, color: COLOR.red, fontSize: "1rem" }}
          >
            Badges earned
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            {data.badges.length === 0 && (
              <span
                className="text-sm"
                style={{ color: pencilAlpha("99") }}
              >
                No badges this run
              </span>
            )}
            {data.badges.map((b, i) => {
              const tilt = i % 2 === 0 ? "rotate-2" : "-rotate-2";
              return (
                <span
                  key={b}
                  className={`inline-flex items-center gap-1 px-4 py-2 border-[3px] ${tilt}`}
                  style={{
                    ...KALAM,
                    backgroundColor: "white",
                    color: COLOR.pencil,
                    borderColor: COLOR.pencil,
                    borderRadius: RADIUS.chip,
                    boxShadow: SHADOW.sm,
                  }}
                >
                  <Award size={16} strokeWidth={2.5} color={COLOR.gold} />
                  {b}
                </span>
              );
            })}
          </div>
        </HDCard>

        <HDCard className="mt-8 p-6">
          <div
            className="flex items-center gap-2 text-sm"
            style={{ ...KALAM, color: COLOR.red, fontSize: "1rem" }}
          >
            <Pin size={16} strokeWidth={2.5} />
            Research question
          </div>
          <div className="mt-1 text-lg" style={{ ...KALAM, color: COLOR.pencil }}>
            {data.refined_query || data.mission.topic}
          </div>

          <div
            className="mt-6 flex items-center gap-2 text-sm"
            style={{ ...KALAM, color: COLOR.red, fontSize: "1rem" }}
          >
            <FileText size={16} strokeWidth={2.5} />
            {data.facts.length} verified facts
          </div>
          <ul className="mt-2 space-y-3 text-base">
            {data.facts.map((f, i) => (
              <li key={i} style={{ color: COLOR.pencil }}>
                <b style={{ ...KALAM, color: COLOR.red }}>{i + 1}.</b> {f.fact}
                {f.explanation && (
                  <div
                    className="ml-4 mt-1 text-sm italic"
                    style={{ color: pencilAlpha("99") }}
                  >
                    &ldquo;{f.explanation}&rdquo;
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div
            className="mt-6 flex items-center gap-2 text-sm"
            style={{ ...KALAM, color: COLOR.red, fontSize: "1rem" }}
          >
            <Globe size={16} strokeWidth={2.5} />
            Sources
          </div>
          <ul className="mt-2 space-y-2 text-sm">
            {data.sources.map((s, i) => (
              <li key={i} style={{ color: COLOR.pencil }}>
                <b style={{ ...KALAM, color: COLOR.red }}>[{i + 1}]</b> {s.title}
                <div className="text-xs" style={{ color: COLOR.blue }}>
                  {s.url}
                </div>
              </li>
            ))}
          </ul>
        </HDCard>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <HDButton variant="primary" size="lg" onClick={() => generatePDF(data)}>
            <Download size={22} strokeWidth={2.5} />
            Download Research Brief (PDF)
          </HDButton>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border-[3px] border-dashed"
            style={{
              ...KALAM,
              borderColor: pencilAlpha("66"),
              color: pencilAlpha("cc"),
              borderRadius: RADIUS.button,
            }}
          >
            Back to start
          </Link>
        </div>

        <p
          className="mt-10 text-center text-xs"
          style={{ color: pencilAlpha("99") }}
        >
          Drag this PDF into your Google Classroom project assignment.
        </p>
      </div>
    </main>
  );
}
