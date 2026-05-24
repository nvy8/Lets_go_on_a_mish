// 
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Check,
  X,
  ExternalLink,
  Globe,
  Bot,
  Award,
  Lightbulb,
  SearchCheck,
  AlertTriangle,
} from "lucide-react";
import type { SourceEntry } from "@/lib/types";
import { HDCard } from "@/components/handdrawn/HDCard";
import { HDButton } from "@/components/handdrawn/HDButton";
import { COLOR, RADIUS, SHADOW, KALAM, pencilAlpha } from "@/lib/design-tokens";

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
      <HDCard className="p-10 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/svg/illustrations/kid-study.svg"
          alt=""
          aria-hidden="true"
          className="mx-auto h-44 w-auto"
        />
        <div className="mt-4 text-lg" style={{ color: COLOR.pencil }}>
          Fetching previews from each source…
        </div>
        <div className="mt-1 text-sm" style={{ color: pencilAlpha("99") }}>
          About 10 seconds — your coach is actually opening 10 web pages.
        </div>
      </HDCard>
    );
  }

  if (!candidates) {
    return (
      <div className="text-base" style={{ color: COLOR.red }}>
        Failed to load sources.
      </div>
    );
  }

  if (phase === "results" && result) {
    const judgeById: Record<string, Judgment> = {};
    for (const j of result.judgments) judgeById[j.id] = j;
    return (
      <div className="space-y-6">
        <HDCard
          variant={result.earned_badge ? "postIt" : "default"}
          className="p-6"
        >
          <h2
            className="flex items-center gap-2 text-2xl"
            style={{ ...KALAM, color: COLOR.pencil }}
          >
            {result.earned_badge ? (
              <>
                <Award size={26} strokeWidth={2.5} color={COLOR.red} />
                Badge unlocked: URL Detective
              </>
            ) : (
              <>
                <SearchCheck size={26} strokeWidth={2.5} color={COLOR.red} />
                Here&apos;s the breakdown
              </>
            )}
          </h2>
          <p className="mt-2 text-base" style={{ color: pencilAlpha("cc") }}>
            You agreed with your coach on{" "}
            <b>
              {result.agree_count}/{result.total}
            </b>{" "}
            sources.{" "}
            {result.earned_badge
              ? "You&apos;ve got a sharp eye for sources."
              : "Read each one's reason — they're worth knowing for next time."}
          </p>
        </HDCard>

        <div className="flex flex-col gap-3">
          {candidates.map((c) => {
            const j = judgeById[c.id];
            const kid = verdicts[c.id];
            const agree = kid && j && kid === j.verdict;
            const p = previews[c.id];
            return (
              <HDCard
                key={c.id}
                variant={agree ? "postItGreen" : "default"}
                size="sm"
                className="p-4"
              >
                <div className="flex items-start gap-3">
                  {p?.favicon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.favicon} alt="" className="mt-1 h-5 w-5 shrink-0 rounded" />
                  )}
                  <div className="flex-1">
                    <div
                      className="text-xs font-mono"
                      style={{ color: pencilAlpha("99") }}
                    >
                      {c.domain}
                    </div>
                    <div className="text-base" style={{ ...KALAM, color: COLOR.pencil }}>
                      {c.title}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <VerdictChip label={`You: ${kid || "skipped"}`} verdict={kid} />
                      <VerdictChip
                        label={`Coach: ${j?.verdict || "?"}`}
                        verdict={j?.verdict}
                      />
                    </div>
                    <div
                      className="mt-2 text-sm"
                      style={{ color: pencilAlpha("b3"), fontStyle: "italic" }}
                    >
                      {j?.one_line_reason}
                    </div>
                  </div>
                </div>
              </HDCard>
            );
          })}
        </div>

        <div className="flex justify-end">
          <HDButton variant="primary" size="lg" onClick={next}>
            Continue to Triangulate
            <ArrowRight size={22} strokeWidth={2.5} />
          </HDButton>
        </div>
      </div>
    );
  }

  const allJudged = candidates.every((c) => verdicts[c.id]);

  return (
    <div>
      <HDCard className="relative p-6" decoration="tape">
        {/* Detective squad mascot perched on the top-right corner of the instruction card */}
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.7, rotate: 18 }}
          animate={{ opacity: 1, scale: 1, rotate: 10 }}
          transition={{ duration: 0.55, ease: "backOut", delay: 0.2 }}
          className="pointer-events-none absolute -top-14 -right-2 hidden sm:block"
        >
          <motion.div
            animate={{ y: [0, -5, 0], rotate: [10, 13, 10] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/scraped/features-2022_feature5_optimized.webp"
              alt=""
              width={120}
              height={120}
              style={{ filter: "drop-shadow(3px 4px 0 rgba(0,0,0,0.15))" }}
            />
          </motion.div>
        </motion.div>

        <h2
          className="flex items-center gap-2 text-2xl"
          style={{ ...KALAM, color: COLOR.pencil }}
        >
          <SearchCheck size={28} strokeWidth={2.5} color={COLOR.red} />
          Check each website
        </h2>
        <p className="mt-2 text-base" style={{ color: pencilAlpha("cc") }}>
          For each one: <b>open the website in a new tab</b>, look at it, then come back and pick{" "}
          <SmallChip color="postItGreen" label="✓ Trust it" /> or{" "}
          <SmallChip color="postItPink" label="✗ Don't trust" />.
        </p>
        <div
          className="mt-3 flex items-start gap-2 px-3 py-2 text-sm border-2 border-dashed"
          style={{
            borderColor: pencilAlpha("4d"),
            color: pencilAlpha("b3"),
            borderRadius: RADIUS.notice,
          }}
        >
          <Lightbulb
            size={18}
            strokeWidth={2.5}
            color={COLOR.red}
            className="mt-0.5 shrink-0"
          />
          <span>
            Look at the web address. Sites like <b>wikipedia.org</b>, <b>unesco.org</b>,{" "}
            <b>britannica.com</b> are usually solid. Random blogs? Be careful.
          </span>
        </div>
        <div
          className="mt-4 text-sm"
          style={{ ...KALAM, color: COLOR.red, fontSize: "1rem" }}
        >
          Done: {Object.keys(verdicts).length} / {candidates.length} websites
        </div>
      </HDCard>

      <div className="mt-6 flex flex-col gap-3">
        {candidates.map((c) => {
          const p = previews[c.id];
          const v = verdicts[c.id];
          const open = openId === c.id;
          return (
            <HDCard
              key={c.id}
              variant={
                v === "legit" ? "postItGreen" : v === "sus" ? "postItPink" : "default"
              }
              size="sm"
              className="p-0 overflow-hidden"
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
                  <div
                    className="text-xs font-mono"
                    style={{ color: pencilAlpha("99") }}
                  >
                    {c.domain}
                  </div>
                  <div
                    className="truncate text-base"
                    style={{ ...KALAM, color: COLOR.pencil }}
                  >
                    {c.title}
                  </div>
                </div>
                <OriginTag origin={c.origin} />
                {v && <VerdictTag verdict={v} />}
                {open ? (
                  <ChevronUp size={20} strokeWidth={2.5} color={pencilAlpha("99")} />
                ) : (
                  <ChevronDown size={20} strokeWidth={2.5} color={pencilAlpha("99")} />
                )}
              </button>

              {open && (
                <div
                  className="p-5 border-t-2 border-dashed"
                  style={{ borderColor: pencilAlpha("33") }}
                >
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
                    className="flex items-center justify-center gap-2 px-6 py-4 text-lg border-[3px]"
                    style={{
                      ...KALAM,
                      backgroundColor: COLOR.blue,
                      color: "white",
                      borderColor: COLOR.pencil,
                      borderRadius: RADIUS.button,
                      boxShadow: SHADOW.md,
                    }}
                  >
                    <ExternalLink size={20} strokeWidth={2.5} />
                    Open this website in a new tab
                  </a>
                  <div
                    className="mt-2 text-center text-xs font-mono break-all"
                    style={{ color: pencilAlpha("99") }}
                  >
                    {c.url}
                  </div>

                  {visited.has(c.id) && (
                    <div
                      className="mt-3 px-3 py-2 text-center text-sm border-2"
                      style={{
                        ...KALAM,
                        backgroundColor: COLOR.postItGreen,
                        color: COLOR.pencil,
                        borderColor: COLOR.pencil,
                        borderRadius: RADIUS.notice,
                      }}
                    >
                      ✓ You opened this website. Did it look real?
                    </div>
                  )}

                  <div className="mt-4">
                    <div
                      className="text-sm"
                      style={{ ...KALAM, color: COLOR.pencil, fontSize: "0.95rem" }}
                    >
                      Quick preview
                    </div>
                    <div
                      className="mt-2 max-h-44 overflow-y-auto p-3 text-base leading-6 border-2"
                      style={{
                        backgroundColor: "#fffdf6",
                        color: COLOR.pencil,
                        borderColor: pencilAlpha("33"),
                        borderRadius: RADIUS.cardSm,
                      }}
                    >
                      {p?.preview_text || c.preview_text}
                    </div>
                    {!p?.fetched_ok && (
                      <div
                        className="mt-2 flex items-start gap-2 text-xs"
                        style={{ color: COLOR.red }}
                      >
                        <AlertTriangle size={14} strokeWidth={2.5} className="mt-0.5 shrink-0" />
                        We couldn&apos;t auto-load this page. Use the blue button to open it.
                      </div>
                    )}
                  </div>

                  <div
                    className="mt-5 text-center text-sm"
                    style={{ ...KALAM, color: COLOR.pencil }}
                  >
                    {visited.has(c.id)
                      ? "What do you think?"
                      : "Open the website first, then decide ↓"}
                  </div>
                  <div className="mt-3 flex gap-3">
                    <VerdictButton
                      active={v === "legit"}
                      onClick={() => setVerdict(c.id, "legit")}
                      kind="legit"
                    />
                    <VerdictButton
                      active={v === "sus"}
                      onClick={() => setVerdict(c.id, "sus")}
                      kind="sus"
                    />
                  </div>
                </div>
              )}
            </HDCard>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <HDButton
          variant="primary"
          size="lg"
          onClick={submitJudgments}
          disabled={!allJudged || submitting}
        >
          {submitting ? "Coach is checking…" : (
            <>
              I&apos;m done — see how I did
              <ArrowRight size={22} strokeWidth={2.5} />
            </>
          )}
        </HDButton>
      </div>
    </div>
  );
}

function SmallChip({ color, label }: { color: "postItGreen" | "postItPink"; label: string }) {
  const bg = color === "postItGreen" ? COLOR.postItGreen : COLOR.postItPink;
  return (
    <span
      className="inline-block px-2 py-0.5 border-2 text-xs"
      style={{
        ...KALAM,
        backgroundColor: bg,
        color: COLOR.pencil,
        borderColor: COLOR.pencil,
        borderRadius: RADIUS.tag,
      }}
    >
      {label}
    </span>
  );
}

function VerdictChip({
  label,
  verdict,
}: {
  label: string;
  verdict: "legit" | "sus" | undefined;
}) {
  const bg =
    verdict === "legit" ? COLOR.postItGreen : verdict === "sus" ? COLOR.postItPink : COLOR.muted;
  return (
    <span
      className="px-2 py-0.5 border-2 text-xs"
      style={{
        ...KALAM,
        backgroundColor: bg,
        color: COLOR.pencil,
        borderColor: COLOR.pencil,
        borderRadius: RADIUS.chip,
      }}
    >
      {label}
    </span>
  );
}

function OriginTag({ origin }: { origin: "web" | "ai" }) {
  const isWeb = origin === "web";
  return (
    <span
      className="inline-flex items-center gap-1 px-3 py-1 border-2 text-xs"
      style={{
        ...KALAM,
        backgroundColor: isWeb ? "#eaf1fb" : "#f3e6ff",
        color: COLOR.pencil,
        borderColor: COLOR.pencil,
        borderRadius: RADIUS.chip,
      }}
    >
      {isWeb ? (
        <Globe size={12} strokeWidth={2.5} color={COLOR.blue} />
      ) : (
        <Bot size={12} strokeWidth={2.5} color={COLOR.pencil} />
      )}
      {isWeb ? "Web" : "AI"}
    </span>
  );
}

function VerdictTag({ verdict }: { verdict: "legit" | "sus" }) {
  const isLegit = verdict === "legit";
  return (
    <span
      className="inline-flex items-center gap-1 px-3 py-1 border-2 text-xs"
      style={{
        ...KALAM,
        backgroundColor: isLegit ? "#2f7a2f" : COLOR.red,
        color: "white",
        borderColor: COLOR.pencil,
        borderRadius: RADIUS.chip,
      }}
    >
      {isLegit ? (
        <>
          <Check size={12} strokeWidth={3} /> Trust
        </>
      ) : (
        <>
          <X size={12} strokeWidth={3} /> Don&apos;t
        </>
      )}
    </span>
  );
}

function VerdictButton({
  active,
  onClick,
  kind,
}: {
  active: boolean;
  onClick: () => void;
  kind: "legit" | "sus";
}) {
  const isLegit = kind === "legit";
  return (
    <button
      onClick={onClick}
      className="flex-1 px-4 py-4 text-base border-[3px] transition-transform duration-100 hover:-translate-y-[1px]"
      style={{
        ...KALAM,
        backgroundColor: active
          ? isLegit
            ? "#2f7a2f"
            : COLOR.red
          : isLegit
          ? COLOR.postItGreen
          : COLOR.postItPink,
        color: active ? "white" : COLOR.pencil,
        borderColor: COLOR.pencil,
        borderRadius: RADIUS.button,
        boxShadow: active ? SHADOW.md : SHADOW.sm,
      }}
    >
      {isLegit ? "✓ Trust it" : "✗ Don't trust"}
    </button>
  );
}
