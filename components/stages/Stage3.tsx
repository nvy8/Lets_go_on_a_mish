// TEMP HACKATHON DESIGN — uses ClassDojo IP — TODO: REPLACE BEFORE LAUNCH
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  X,
  Sparkles,
  Search,
  Award,
  ExternalLink,
  Pin,
  Globe,
  HelpCircle,
} from "lucide-react";
import { HDCard } from "@/components/handdrawn/HDCard";
import { HDButton } from "@/components/handdrawn/HDButton";
import { COLOR, RADIUS, SHADOW, KALAM, pencilAlpha } from "@/lib/design-tokens";

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
      <HDCard className="p-10 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/svg/illustrations/kid-study.svg"
          alt=""
          aria-hidden="true"
          className="mx-auto h-44 w-auto"
        />
        <div className="mt-4 text-lg" style={{ color: COLOR.pencil }}>
          Your coach is reading all 3 websites and picking 5 facts to check…
        </div>
        <div className="mt-1 text-sm" style={{ color: pencilAlpha("99") }}>
          15-20 seconds — real reading takes time.
        </div>
      </HDCard>
    );
  }

  if (!facts.length || !sources.length) {
    return (
      <div className="text-base" style={{ color: COLOR.red }}>
        Failed to load. Refresh the page.
      </div>
    );
  }

  if (finalSummary) {
    return (
      <HDCard variant="postIt" className="p-8 text-center" decoration="tack">
        {finalSummary.earned_badge ? (
          <Award size={64} strokeWidth={2.5} color={COLOR.red} className="mx-auto" />
        ) : (
          <Search size={64} strokeWidth={2.5} color={COLOR.pencil} className="mx-auto" />
        )}
        <h2 className="mt-3 text-3xl" style={{ ...KALAM, color: COLOR.pencil }}>
          {finalSummary.earned_badge ? "Badge unlocked: Triangulator" : "Stage 3 complete"}
        </h2>
        <p className="mt-3 text-base" style={{ color: pencilAlpha("cc") }}>
          You triangulated <b>{finalSummary.triangulated_count}</b> out of {facts.length} facts
          across at least 2 sites.
        </p>
        <div className="mt-6 inline-block">
          <HDButton
            variant="primary"
            size="lg"
            onClick={() => router.push(`/m/${shareToken}/stage/4`)}
          >
            Continue to Explain
            <ArrowRight size={22} strokeWidth={2.5} />
          </HDButton>
        </div>
      </HDCard>
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
        <div
          className="text-center text-sm"
          style={{ ...KALAM, color: COLOR.red }}
        >
          Fact {factIdx + 1} of {facts.length}
        </div>
        <HDCard
          variant={isTriangulated ? "postItGreen" : "default"}
          className="mt-3 p-8 text-center"
        >
          {isTriangulated ? (
            <Sparkles size={56} strokeWidth={2.5} color={COLOR.red} className="mx-auto" />
          ) : (
            <Search size={56} strokeWidth={2.5} color={COLOR.pencil} className="mx-auto" />
          )}
          <h2 className="mt-3 text-2xl" style={{ ...KALAM, color: COLOR.pencil }}>
            You found this fact in {verifiedForFact} out of {evidenceList.length} sites!
          </h2>
          <div
            className="mt-4 p-4 text-left border-2"
            style={{
              backgroundColor: "white",
              borderColor: pencilAlpha("33"),
              borderRadius: RADIUS.cardSm,
            }}
          >
            <div
              className="flex items-center gap-2 text-sm"
              style={{ ...KALAM, color: COLOR.red }}
            >
              <Pin size={14} strokeWidth={2.5} />
              The fact
            </div>
            <div className="mt-1 text-base" style={{ ...KALAM, color: COLOR.pencil }}>
              {currentFact.plain_text}
            </div>
          </div>
          {isTriangulated ? (
            <p className="mt-4 text-base" style={{ color: "#2f7a2f" }}>
              ✓ Triangulated — you found it in at least 2 sites. That&apos;s a fact you can trust.
            </p>
          ) : (
            <p className="mt-4 text-base" style={{ color: pencilAlpha("cc") }}>
              Not enough sources backed this one up. Be careful before trusting it.
            </p>
          )}
          <div className="mt-6 inline-block">
            <HDButton variant="primary" size="lg" onClick={nextFact}>
              {factIdx < facts.length - 1 ? "Next fact" : "See my score"}
              <ArrowRight size={22} strokeWidth={2.5} />
            </HDButton>
          </div>
        </HDCard>
      </div>
    );
  }

  const triangulatedSoFar = facts.filter((f) => {
    const v = Object.values(f.source_clicks_verified || {}).filter(Boolean).length;
    return v >= 2;
  }).length;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between text-sm">
        <div style={{ ...KALAM, color: COLOR.red }}>
          Fact {factIdx + 1} of {facts.length} · Site {sourceIdx + 1} of {evidenceList.length}
        </div>
        <div style={{ color: pencilAlpha("99") }}>
          Triangulated so far:{" "}
          <b style={{ ...KALAM, color: COLOR.red }}>{triangulatedSoFar}</b>
        </div>
      </div>

      <HDCard variant="postIt" className="mt-3 p-5">
        <div
          className="flex items-center gap-2 text-sm"
          style={{ ...KALAM, color: COLOR.red }}
        >
          <Pin size={16} strokeWidth={2.5} />
          The fact
        </div>
        <div className="mt-1 text-xl leading-snug" style={{ ...KALAM, color: COLOR.pencil }}>
          {currentFact.plain_text}
        </div>
      </HDCard>

      <HDCard className="mt-4 p-5">
        <div
          className="flex items-center gap-2 text-sm"
          style={{ ...KALAM, color: COLOR.pencil }}
        >
          <Globe size={16} strokeWidth={2.5} color={COLOR.blue} />
          What this site said
        </div>
        <div
          className="mt-1 text-sm font-mono"
          style={{ color: pencilAlpha("99") }}
        >
          {currentSource?.domain}
        </div>
        <div
          className="mt-3 p-4 text-base leading-7 border-2"
          style={{
            backgroundColor: "#fffdf6",
            color: COLOR.pencil,
            borderColor: pencilAlpha("33"),
            borderRadius: RADIUS.cardSm,
          }}
        >
          {currentEvidence?.snippet}
        </div>
        {currentSource?.url && (
          <a
            href={currentSource.url}
            target="_blank"
            rel="noopener"
            className="mt-3 inline-flex items-center gap-1 text-sm underline"
            style={{ color: COLOR.blue }}
          >
            <ExternalLink size={14} strokeWidth={2.5} />
            Open the full website
          </a>
        )}
      </HDCard>

      {phase === "ask" && (
        <div className="mt-5">
          <div
            className="text-center text-base"
            style={{ ...KALAM, color: COLOR.pencil }}
          >
            Does this snippet really say the fact above?
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => submitAnswer("yes")}
              disabled={submitting}
              className="flex-1 px-6 py-4 text-lg border-[3px] transition-transform duration-100 enabled:hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                ...KALAM,
                backgroundColor: "#2f7a2f",
                color: "white",
                borderColor: COLOR.pencil,
                borderRadius: RADIUS.button,
                boxShadow: SHADOW.md,
              }}
            >
              <Check size={20} strokeWidth={3} className="inline mr-1" />
              Yes, I see it!
            </button>
            <button
              onClick={() => submitAnswer("no")}
              disabled={submitting}
              className="flex-1 px-6 py-4 text-lg border-[3px] transition-transform duration-100 enabled:hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                ...KALAM,
                backgroundColor: COLOR.red,
                color: "white",
                borderColor: COLOR.pencil,
                borderRadius: RADIUS.button,
                boxShadow: SHADOW.md,
              }}
            >
              <X size={20} strokeWidth={3} className="inline mr-1" />
              No, not quite
            </button>
          </div>
        </div>
      )}

      {phase === "feedback" && feedback && (
        <div className="mt-5 relative">
          {/* Reaction mascot — celebrates on correct, "hmm" on miss */}
          <AnimatePresence>
            <motion.div
              key={feedback.correct ? "yay" : "hmm"}
              aria-hidden="true"
              initial={{ opacity: 0, y: -8, scale: 0.6, rotate: -12 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: -6 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.45, ease: "backOut" }}
              className="pointer-events-none absolute -top-12 -left-3 hidden sm:block"
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image
                  src={
                    feedback.correct
                      ? "/scraped/grid_plushies_optimized.webp"
                      : "/scraped/grid_mojojojo_optimized.webp"
                  }
                  alt=""
                  width={84}
                  height={84}
                  style={{ filter: "drop-shadow(3px 4px 0 rgba(0,0,0,0.15))" }}
                />
              </motion.div>
            </motion.div>
          </AnimatePresence>

          <HDCard
            variant={feedback.correct ? "postItGreen" : "postIt"}
            className="p-5"
          >
            <div
              className="flex items-center gap-2 text-xl"
              style={{ ...KALAM, color: COLOR.pencil }}
            >
              {feedback.correct ? (
                <>
                  <Sparkles size={22} strokeWidth={2.5} color="#2f7a2f" />
                  Nice eye!
                </>
              ) : (
                <>
                  <HelpCircle size={22} strokeWidth={2.5} color={COLOR.red} />
                  Look again
                </>
              )}
            </div>
            {feedback.hint && (
              <div className="mt-2 text-base" style={{ color: COLOR.pencil }}>
                {feedback.hint}
              </div>
            )}
            {feedback.correct && feedback.verified && (
              <div className="mt-2 text-sm" style={{ color: "#2f7a2f" }}>
                That counts as one site backing the fact!
              </div>
            )}
            {feedback.correct && !feedback.verified && (
              <div className="mt-2 text-sm" style={{ color: pencilAlpha("cc") }}>
                Correct — and you noticed this site doesn&apos;t really back the fact. Sharp.
              </div>
            )}
          </HDCard>
          <div className="mt-4">
            <HDButton variant="primary" size="md" onClick={nextStep} className="w-full">
              {sourceIdx < evidenceList.length - 1 ? "Next site" : "See my score for this fact"}
              <ArrowRight size={20} strokeWidth={2.5} />
            </HDButton>
          </div>
        </div>
      )}
    </div>
  );
}
