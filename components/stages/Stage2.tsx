"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SourceEntry } from "@/lib/types";

type Preview = {
  url: string;
  domain: string;
  title: string;
  favicon: string;
  preview_text: string;
  fetched_ok: boolean;
};

type Judgment = { id: string; verdict: "legit" | "sus"; one_line_reason: string };

type JudgeResp = {
  judgments: Judgment[];
  top_3_ids: string[];
  agree_count: number;
  total: number;
  earned_badge: boolean;
};

export function Stage2({ shareToken }: { shareToken: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"judge" | "results">("judge");
  const [candidates, setCandidates] = useState<SourceEntry[] | null>(null);
  const [previews, setPreviews] = useState<Record<string, Preview>>({});
  const [verdicts, setVerdicts] = useState<Record<string, "legit" | "sus">>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<JudgeResp | null>(null);

  useEffect(() => {
    (async () => {
      const sRes = await fetch("/api/session/state");
      if (!sRes.ok) return;
      const sData = await sRes.json();
      const c: SourceEntry[] = sData.session?.notepad?.candidate_sources || [];
      setCandidates(c);
      const pRes = await fetch("/api/stage/2/previews", { method: "POST" });
      if (pRes.ok) {
        const pData = await pRes.json();
        setPreviews(pData.previews || {});
      }
      setLoading(false);
    })();
  }, []);

  function setVerdict(id: string, v: "legit" | "sus") {
    setVerdicts((prev) => ({ ...prev, [id]: v }));
  }

  async function submitJudgments() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/stage/2/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kid_verdicts: verdicts }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setPhase("results");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function next() {
    await fetch("/api/stage/2/advance", { method: "POST" });
    router.push(`/m/${shareToken}/stage/3`);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-zinc-500">
        <div className="text-2xl">📄</div>
        <div className="mt-2">Fetching previews from each source page...</div>
        <div className="mt-1 text-xs">(takes ~10s — actually loading 10 web pages)</div>
      </div>
    );
  }

  if (!candidates) {
    return <div className="text-red-600">Failed to load sources.</div>;
  }

  if (phase === "results" && result) {
    const judgeById: Record<string, Judgment> = {};
    for (const j of result.judgments) judgeById[j.id] = j;
    return (
      <div className="space-y-6">
        <div
          className={`rounded-2xl border p-6 ${
            result.earned_badge
              ? "border-amber-300 bg-amber-50"
              : "border-zinc-200 bg-white"
          }`}
        >
          <h2 className="text-lg font-semibold">
            {result.earned_badge ? "🏅 Badge unlocked: URL Detective" : "📋 Here's the breakdown"}
          </h2>
          <p className="mt-1 text-sm text-zinc-700">
            You agreed with your coach on <b>{result.agree_count}/{result.total}</b> sources.{" "}
            {result.earned_badge
              ? "Nice — you've got a sharp eye for sources."
              : "Read each one's reason — they're worth knowing for next time."}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {candidates.map((c) => {
            const j = judgeById[c.id];
            const kid = verdicts[c.id];
            const agree = kid && j && kid === j.verdict;
            const p = previews[c.id];
            return (
              <div
                key={c.id}
                className={`rounded-xl border p-4 ${
                  agree ? "border-green-300 bg-green-50/50" : "border-zinc-200 bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  {p?.favicon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.favicon} alt="" className="mt-1 h-5 w-5 shrink-0 rounded" />
                  )}
                  <div className="flex-1">
                    <div className="text-xs font-mono text-zinc-500">{c.domain}</div>
                    <div className="text-sm font-semibold">{c.title}</div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          kid === "legit"
                            ? "bg-green-100 text-green-800"
                            : kid === "sus"
                            ? "bg-red-100 text-red-800"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        You: {kid || "skipped"}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          j?.verdict === "legit"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        Coach: {j?.verdict || "?"}
                      </span>
                    </div>
                    <div className="mt-2 text-xs italic text-zinc-600">{j?.one_line_reason}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button
            onClick={next}
            className="rounded-full bg-amber-500 px-6 py-3 text-base font-semibold text-white"
          >
            Continue to Triangulate →
          </button>
        </div>
      </div>
    );
  }

  const allJudged = candidates.every((c) => verdicts[c.id]);

  return (
    <div>
      <div className="rounded-2xl border-2 border-amber-200 bg-white p-6">
        <h2 className="text-2xl font-bold">🕵️ Check each website</h2>
        <p className="mt-2 text-base text-zinc-700">
          For each one: <b>open the website in a new tab</b>, look at it, then come back and pick
          <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-800">✓ Trust it</span>
          {" "}or{" "}
          <span className="rounded-full bg-red-100 px-2 py-0.5 font-semibold text-red-800">✗ Don&apos;t trust</span>.
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          💡 Tip: look at the web address. Sites like <b>wikipedia.org</b>, <b>unesco.org</b>, and
          <b>britannica.com</b> are usually solid. Random blogs or weird-looking sites? Be careful.
        </p>
        <div className="mt-3 text-sm font-semibold text-amber-700">
          Done: {Object.keys(verdicts).length} / {candidates.length} websites
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {candidates.map((c) => {
          const p = previews[c.id];
          const v = verdicts[c.id];
          const open = openId === c.id;
          return (
            <div
              key={c.id}
              className={`rounded-xl border bg-white transition ${
                v === "legit"
                  ? "border-green-400"
                  : v === "sus"
                  ? "border-red-400"
                  : "border-zinc-200"
              }`}
            >
              <button
                onClick={() => setOpenId(open ? null : c.id)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                {p?.favicon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.favicon} alt="" className="h-6 w-6 shrink-0 rounded" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-mono text-zinc-500">{c.domain}</div>
                  <div className="truncate text-base font-semibold">{c.title}</div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    c.origin === "web"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {c.origin === "web" ? "🌐 Web" : "🤖 AI"}
                </span>
                {v && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      v === "legit" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                    }`}
                  >
                    {v === "legit" ? "✓ Trust" : "✗ Don't"}
                  </span>
                )}
                <span className="text-base text-zinc-400">{open ? "▲" : "▼"}</span>
              </button>

              {open && (
                <div className="border-t-2 border-zinc-100 p-5">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener"
                    onClick={() =>
                      setVisited((prev) => {
                        const n = new Set(prev);
                        n.add(c.id);
                        return n;
                      })
                    }
                    className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-lg font-bold text-white shadow-sm hover:bg-blue-700"
                  >
                    🔗 Open this website in a new tab →
                  </a>
                  <div className="mt-2 text-center text-xs font-mono text-zinc-500 break-all">
                    {c.url}
                  </div>

                  {visited.has(c.id) && (
                    <div className="mt-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-center text-sm text-green-800">
                      ✓ You opened this website. Did it look real?
                    </div>
                  )}

                  <div className="mt-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Quick preview
                    </div>
                    <div className="mt-2 max-h-44 overflow-y-auto rounded-lg bg-zinc-50 p-3 text-base leading-6 text-zinc-800">
                      {p?.preview_text || c.preview_text}
                    </div>
                    {!p?.fetched_ok && (
                      <div className="mt-1 text-xs text-amber-700">
                        ⚠️ We couldn&apos;t auto-load this page. Click the blue button above to see
                        it on the real website.
                      </div>
                    )}
                  </div>

                  <div className="mt-5 text-center text-sm font-semibold text-zinc-700">
                    {visited.has(c.id)
                      ? "What do you think?"
                      : "Open the website first, then decide ↓"}
                  </div>
                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={() => setVerdict(c.id, "legit")}
                      className={`flex-1 rounded-full px-4 py-4 text-base font-bold transition ${
                        v === "legit"
                          ? "bg-green-500 text-white shadow-lg"
                          : "bg-white text-green-700 border-2 border-green-400 hover:bg-green-50"
                      }`}
                    >
                      ✓ Trust it
                    </button>
                    <button
                      onClick={() => setVerdict(c.id, "sus")}
                      className={`flex-1 rounded-full px-4 py-4 text-base font-bold transition ${
                        v === "sus"
                          ? "bg-red-500 text-white shadow-lg"
                          : "bg-white text-red-700 border-2 border-red-400 hover:bg-red-50"
                      }`}
                    >
                      ✗ Don&apos;t trust
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={submitJudgments}
          disabled={!allJudged || submitting}
          className="rounded-full bg-amber-500 px-8 py-4 text-lg font-bold text-white disabled:opacity-40"
        >
          {submitting ? "Coach is checking..." : "I'm done — see how I did →"}
        </button>
      </div>
    </div>
  );
}
