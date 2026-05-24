// TEMP HACKATHON DESIGN — uses ClassDojo IP — TODO: REPLACE BEFORE LAUNCH
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircleQuestion, Lightbulb, Sparkles, Pencil } from "lucide-react";
import { KidNotice } from "@/components/KidNotice";
import { HDCard } from "@/components/handdrawn/HDCard";
import { HDButton } from "@/components/handdrawn/HDButton";
import { HDTextarea } from "@/components/handdrawn/HDInput";
import { COLOR, RADIUS, SHADOW, KALAM, pencilAlpha } from "@/lib/design-tokens";

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
      <HDCard className="p-10 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/svg/illustrations/kid-brainstorming.svg"
          alt=""
          aria-hidden="true"
          className="mx-auto h-44 w-auto"
        />
        <div className="mt-4 text-lg" style={{ color: COLOR.pencil }}>
          Your coach is drafting 3 questions for you to compare.
        </div>
        <div className="mt-1 text-sm" style={{ color: pencilAlpha("80") }}>
          Take a breath — researchers always pause before they search.
        </div>
      </HDCard>
    );
  }

  if (!examples) {
    return (
      <KidNotice
        tone="error"
        title="Something got stuck"
        action={
          <HDButton variant="primary" size="sm" onClick={() => window.location.reload()}>
            Try again
          </HDButton>
        }
      >
        We couldn&apos;t load your coach&apos;s examples. Tap below to try again.
      </KidNotice>
    );
  }

  // PHASE 1: pick the strongest
  if (phase === "pick") {
    return (
      <HDCard className="relative p-6">
        {/* Thinking mascot peeking over the top-right corner */}
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0, y: -10, rotate: 14 }}
          animate={{ opacity: 1, y: 0, rotate: 8 }}
          transition={{ duration: 0.5, ease: "backOut", delay: 0.15 }}
          className="pointer-events-none absolute -top-12 -right-4 hidden sm:block"
        >
          <motion.div
            animate={{ rotate: [8, 12, 8], y: [0, -3, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/scraped/grid_mojojojo_optimized.webp"
              alt=""
              width={96}
              height={96}
              style={{ filter: "drop-shadow(3px 4px 0 rgba(0,0,0,0.12))" }}
            />
          </motion.div>
        </motion.div>

        <h2 className="flex items-center gap-2 text-2xl" style={{ ...KALAM, color: COLOR.pencil }}>
          <MessageCircleQuestion size={28} strokeWidth={2.5} color={COLOR.red} />
          Which question is best?
        </h2>
        <p className="mt-2 text-base" style={{ color: pencilAlpha("cc") }}>
          Here are 3 different ways to ask about your topic.{" "}
          <b>Which one would help you find a real, focused answer?</b>
        </p>
        <div
          className="mt-3 flex items-start gap-2 px-3 py-2 text-sm border-2 border-dashed"
          style={{
            borderColor: pencilAlpha("4d"),
            color: pencilAlpha("b3"),
            borderRadius: RADIUS.notice,
          }}
        >
          <Lightbulb size={18} strokeWidth={2.5} color={COLOR.red} className="mt-0.5 shrink-0" />
          <span>A good question is specific, not too broad, and asks WHY or HOW.</span>
        </div>
        <div className="mt-5 flex flex-col gap-3">
          {examples.map((ex, i) => {
            const picked = pickedIdx === i;
            return (
              <button
                key={i}
                onClick={() => setPickedIdx(i)}
                className="text-left p-5 border-[3px] transition-transform duration-100 hover:-rotate-[0.5deg]"
                style={{
                  backgroundColor: picked ? COLOR.postIt : "white",
                  borderColor: COLOR.pencil,
                  borderRadius: RADIUS.cardSm,
                  boxShadow: picked ? SHADOW.md : SHADOW.sm,
                }}
              >
                <div
                  className="text-sm"
                  style={{ ...KALAM, color: COLOR.red, fontSize: "1rem" }}
                >
                  {String.fromCharCode(65 + i)}
                </div>
                <div className="mt-1 text-lg leading-7" style={{ color: COLOR.pencil }}>
                  {ex.text}
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-6">
          <HDButton
            variant="primary"
            size="md"
            disabled={pickedIdx === null}
            onClick={() => setPhase("reveal")}
          >
            I picked one!
            <ArrowRight size={20} strokeWidth={2.5} />
          </HDButton>
        </div>
      </HDCard>
    );
  }

  // PHASE 2: reveal which was strongest
  if (phase === "reveal") {
    const correctIdx = examples.findIndex((e) => e.quality === "strong");
    const wasRight = pickedIdx === correctIdx;
    return (
      <HDCard className="p-6">
        <h2
          className="flex items-center gap-2 text-2xl"
          style={{ ...KALAM, color: COLOR.pencil }}
        >
          {wasRight ? (
            <>
              <Sparkles size={28} strokeWidth={2.5} color={COLOR.red} />
              Nice eye!
            </>
          ) : (
            <>
              <MessageCircleQuestion size={28} strokeWidth={2.5} color={COLOR.red} />
              Almost — look again
            </>
          )}
        </h2>
        <p className="mt-2 text-base" style={{ color: pencilAlpha("cc") }}>
          {wasRight
            ? "You picked the strongest one — that question will find a real, focused answer."
            : "The green one below is the strongest. See the difference?"}
        </p>
        <div className="mt-4 flex flex-col gap-3">
          {examples.map((ex, i) => {
            const bg =
              ex.quality === "strong"
                ? COLOR.postItGreen
                : ex.quality === "ok"
                ? "white"
                : COLOR.postItPink;
            return (
              <div
                key={i}
                className="p-3 border-[3px]"
                style={{
                  backgroundColor: bg,
                  borderColor: COLOR.pencil,
                  borderRadius: RADIUS.cardSm,
                  boxShadow: SHADOW.sm,
                }}
              >
                <div className="flex items-center gap-2 text-sm">
                  <span
                    style={{
                      ...KALAM,
                      color:
                        ex.quality === "strong"
                          ? "#2f7a2f"
                          : ex.quality === "ok"
                          ? pencilAlpha("99")
                          : COLOR.red,
                    }}
                  >
                    {ex.quality === "strong"
                      ? "✓ Strong"
                      : ex.quality === "ok"
                      ? "~ OK"
                      : "✗ Too broad"}
                  </span>
                  {i === pickedIdx && (
                    <span
                      className="px-2 py-0.5 text-xs border-2 rotate-1"
                      style={{
                        ...KALAM,
                        backgroundColor: COLOR.red,
                        color: "white",
                        borderColor: COLOR.pencil,
                        borderRadius: RADIUS.tag,
                      }}
                    >
                      Your pick
                    </span>
                  )}
                </div>
                <div className="mt-1 text-base" style={{ color: COLOR.pencil }}>
                  {ex.text}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6">
          <HDButton variant="primary" size="lg" onClick={() => setPhase("draft")}>
            Now write your own
            <ArrowRight size={22} strokeWidth={2.5} />
          </HDButton>
        </div>
      </HDCard>
    );
  }

  // PHASE 3: kid drafts their own
  return (
    <HDCard className="p-6">
      <h2 className="flex items-center gap-2 text-2xl" style={{ ...KALAM, color: COLOR.pencil }}>
        <Pencil size={28} strokeWidth={2.5} color={COLOR.red} />
        Your turn
      </h2>
      <p className="mt-2 text-lg" style={{ color: pencilAlpha("cc") }}>
        Write your own research question. Make it specific. Your coach will help you sharpen it.
      </p>
      <label
        htmlFor="stage1-draft"
        className="mt-4 block text-base"
        style={{ ...KALAM, color: COLOR.pencil }}
      >
        Your research question
      </label>
      <HDTextarea
        id="stage1-draft"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setCritique(null);
        }}
        placeholder="Type it here…"
        rows={3}
        aria-label="Your research question"
        className="mt-2 w-full"
      />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <HDButton
          variant="secondary"
          size="md"
          onClick={getCritique}
          disabled={draft.length < 5 || critiquing}
        >
          {critiquing ? "Coach is reading…" : "Ask the coach"}
        </HDButton>
        {critique && critique.verdict === "strong" && (
          <HDButton
            variant="primary"
            size="lg"
            onClick={accept}
            disabled={accepting}
          >
            {accepting ? "Saving…" : (
              <>
                Let&apos;s go
                <ArrowRight size={22} strokeWidth={2.5} />
              </>
            )}
          </HDButton>
        )}
      </div>

      {critique && (
        <div
          className="mt-5 p-5 border-[3px]"
          style={{
            backgroundColor: critique.verdict === "strong" ? COLOR.postItGreen : COLOR.postIt,
            borderColor: COLOR.pencil,
            borderRadius: RADIUS.notice,
            boxShadow: SHADOW.sm,
          }}
        >
          <div className="text-base flex items-center gap-2" style={{ ...KALAM, color: COLOR.pencil }}>
            {critique.verdict === "strong" ? (
              <>
                <Sparkles size={20} strokeWidth={2.5} color="#2f7a2f" />
                Coach says: that question will find a real answer
              </>
            ) : (
              <>
                <Pencil size={20} strokeWidth={2.5} color={COLOR.red} />
                Coach says: almost there
              </>
            )}
          </div>
          <div className="mt-2 text-base" style={{ color: COLOR.pencil }}>
            {critique.feedback}
          </div>
        </div>
      )}
    </HDCard>
  );
}
