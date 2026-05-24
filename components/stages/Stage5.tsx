// 
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldQuestion,
  Pin,
  Lightbulb,
  Check,
  X,
  Bot,
  AlertTriangle,
  Award,
  GraduationCap,
} from "lucide-react";
import { HDCard } from "@/components/handdrawn/HDCard";
import { HDButton } from "@/components/handdrawn/HDButton";
import { COLOR, RADIUS, SHADOW, KALAM, pencilAlpha } from "@/lib/design-tokens";

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

const KIND_STYLES: Record<
  string,
  { label: string; bg: string; Icon: typeof Check; iconColor: string }
> = {
  clean: {
    label: "Accurate",
    bg: COLOR.postItGreen,
    Icon: Check,
    iconColor: "#2f7a2f",
  },
  factual_error: {
    label: "Wrong fact",
    bg: COLOR.postItPink,
    Icon: X,
    iconColor: COLOR.red,
  },
  ai_tell: {
    label: "AI tells",
    bg: "#f3e6ff",
    Icon: Bot,
    iconColor: COLOR.pencil,
  },
  both: {
    label: "Both",
    bg: COLOR.postIt,
    Icon: AlertTriangle,
    iconColor: COLOR.red,
  },
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
      <HDCard className="p-10 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/svg/illustrations/kid-high-tech.svg"
          alt=""
          aria-hidden="true"
          className="mx-auto h-44 w-auto"
        />
        <div className="mt-4 text-lg" style={{ color: COLOR.pencil }}>
          Generating 4 versions of each fact — 1 real, 3 AI-flavoured fakes.
        </div>
        <div className="mt-1 text-sm" style={{ color: pencilAlpha("99") }}>
          20-30 seconds — faking facts well is hard.
        </div>
      </HDCard>
    );
  }

  if (!items.length) {
    return (
      <div className="text-base" style={{ color: COLOR.red }}>
        No items to compare. Refresh the page.
      </div>
    );
  }

  if (done) {
    const allPerfect = done.earned_badge;
    return (
      <HDCard variant="postIt" className="p-8 text-center" decoration="tack">
        {allPerfect ? (
          <Award size={64} strokeWidth={2.5} color={COLOR.red} className="mx-auto" />
        ) : (
          <GraduationCap size={64} strokeWidth={2.5} color={COLOR.pencil} className="mx-auto" />
        )}
        <h2 className="mt-3 text-2xl" style={{ ...KALAM, color: COLOR.pencil }}>
          {allPerfect ? "Badge unlocked: Hallucination Hunter" : "Stage 5 complete"}
        </h2>
        <p className="mt-2 text-base" style={{ color: pencilAlpha("cc") }}>
          You spotted <b>{done.correct}/{done.total}</b> accurate versions.
        </p>
        <div className="mt-6 inline-block">
          <HDButton
            variant="primary"
            size="lg"
            onClick={() => router.push(`/m/${shareToken}/complete`)}
          >
            See your Research Brief
            <ArrowRight size={22} strokeWidth={2.5} />
          </HDButton>
        </div>
      </HDCard>
    );
  }

  const current = items[currentIdx];
  const isLast = currentIdx === items.length - 1;
  const kidPick = picks[current.fact_id];
  const isRevealed = revealed[current.fact_id];

  return (
    <div>
      <HDCard className="relative p-6">
        {/* Real-vs-fake mascot pair: detective (real) on the left, "plush" (fake) on the right */}
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0, y: -8, rotate: -16 }}
          animate={{ opacity: 1, y: 0, rotate: -8 }}
          transition={{ duration: 0.5, ease: "backOut", delay: 0.15 }}
          className="pointer-events-none absolute -top-12 -left-3 hidden sm:block"
        >
          <motion.div
            animate={{ y: [0, -4, 0], rotate: [-8, -5, -8] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/scraped/grid_plushies_optimized.webp"
              alt=""
              width={88}
              height={88}
              style={{ filter: "drop-shadow(3px 4px 0 rgba(0,0,0,0.15))" }}
            />
          </motion.div>
        </motion.div>
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0, y: -8, rotate: 16 }}
          animate={{ opacity: 1, y: 0, rotate: 10 }}
          transition={{ duration: 0.5, ease: "backOut", delay: 0.3 }}
          className="pointer-events-none absolute -top-12 -right-3 hidden sm:block"
          style={{ filter: "grayscale(0.3) opacity(0.85)" }}
        >
          <motion.div
            animate={{ y: [0, -3, 0], rotate: [10, 14, 10] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/scraped/grid_plushies_optimized.webp"
              alt=""
              width={84}
              height={84}
              style={{ filter: "drop-shadow(3px 4px 0 rgba(0,0,0,0.12))" }}
            />
          </motion.div>
        </motion.div>

        <div className="flex items-start justify-between gap-4">
          <h2
            className="flex items-center gap-2 text-2xl"
            style={{ ...KALAM, color: COLOR.pencil }}
          >
            <ShieldQuestion size={28} strokeWidth={2.5} color={COLOR.red} />
            Spot the fake
          </h2>
          <div className="text-sm" style={{ ...KALAM, color: COLOR.red }}>
            {currentIdx + 1} of {items.length}
          </div>
        </div>
        <p className="mt-2 text-lg" style={{ color: pencilAlpha("cc") }}>
          One of these 4 is the real version. The other 3 are <b>fakes</b> — wrong info, weird AI
          writing, or both. Pick the real one.
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
          <span>
            Watch out for: wrong dates, weird AI words like &quot;moreover&quot; or &quot;delve
            into&quot;, em-dashes, fancy-sounding nonsense.
          </span>
        </div>
      </HDCard>

      <HDCard variant="postIt" className="mt-4 p-5">
        <div
          className="flex items-center gap-2 text-sm"
          style={{ ...KALAM, color: COLOR.red }}
        >
          <Pin size={16} strokeWidth={2.5} />
          The real fact (you found this in 2+ sources)
        </div>
        <div className="mt-1 text-lg leading-7" style={{ ...KALAM, color: COLOR.pencil }}>
          {current.fact_text}
        </div>
      </HDCard>

      <div className="mt-4 flex flex-col gap-3">
        {current.options.map((opt, idx) => {
          const isPicked = kidPick === idx;
          const isCorrect = idx === current.correct_index;
          const showResult = isRevealed;
          let bg = "white";
          let borderColor: string = COLOR.pencil;
          if (showResult) {
            if (isCorrect) bg = COLOR.postItGreen;
            else if (isPicked) {
              bg = COLOR.postItPink;
              borderColor = COLOR.red;
            }
          } else if (isPicked) {
            bg = COLOR.postIt;
          }
          const kindStyle = KIND_STYLES[opt.kind];
          const KindIcon = kindStyle?.Icon;
          return (
            <button
              key={idx}
              onClick={() => pick(current.fact_id, idx)}
              disabled={isRevealed}
              className="text-left p-4 border-[3px] transition-transform duration-100 hover:-rotate-[0.5deg] disabled:cursor-default"
              style={{
                backgroundColor: bg,
                borderColor,
                borderRadius: RADIUS.cardSm,
                boxShadow: isPicked || (showResult && isCorrect) ? SHADOW.md : SHADOW.sm,
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="text-sm mt-0.5"
                  style={{ ...KALAM, color: COLOR.red, fontSize: "1rem" }}
                >
                  {String.fromCharCode(65 + idx)}
                </div>
                <div className="flex-1">
                  <div className="text-base" style={{ color: COLOR.pencil }}>
                    {opt.text}
                  </div>
                  {showResult && kindStyle && (
                    <div className="mt-2 space-y-1">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs border-2"
                        style={{
                          ...KALAM,
                          backgroundColor: kindStyle.bg,
                          color: COLOR.pencil,
                          borderColor: COLOR.pencil,
                          borderRadius: RADIUS.chip,
                        }}
                      >
                        {KindIcon && (
                          <KindIcon size={12} strokeWidth={2.5} color={kindStyle.iconColor} />
                        )}
                        {kindStyle.label}
                      </span>
                      <div
                        className="text-xs italic"
                        style={{ color: pencilAlpha("99") }}
                      >
                        {opt.teach_note}
                      </div>
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
          <HDButton variant="secondary" size="md" onClick={() => reveal(current.fact_id)}>
            Lock in &amp; reveal
            <ArrowRight size={18} strokeWidth={2.5} />
          </HDButton>
        )}
        {isRevealed && !isLast && (
          <HDButton variant="primary" size="md" onClick={next}>
            Next fact
            <ArrowRight size={20} strokeWidth={2.5} />
          </HDButton>
        )}
        {isRevealed && isLast && (
          <HDButton variant="primary" size="md" onClick={finish} disabled={submitting}>
            {submitting ? "Saving…" : "See my final brief"}
            {!submitting && <ArrowRight size={20} strokeWidth={2.5} />}
          </HDButton>
        )}
      </div>
    </div>
  );
}
