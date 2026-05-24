"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Wind, Heart, Trees, Sparkles, ArrowRight, Check } from "lucide-react";
import { HDCard } from "@/components/handdrawn/HDCard";
import { HDButton } from "@/components/handdrawn/HDButton";
import { COLOR, KALAM, pencilAlpha } from "@/lib/design-tokens";

type Props = { shareToken: string; stageNum: number };

// 4 stages:
// 1. Box breathing (60s)
// 2. Gratitude list (3 things + AI gentle reflection)
// 3. Step-away task ("step outside for 2 min")
// 4. Closing breath (30s)
export function DopamineResetRunner({ shareToken, stageNum }: Props) {
  if (stageNum === 1) return <BreathStage shareToken={shareToken} seconds={60} closing={false} badge="calm-starter" />;
  if (stageNum === 2) return <GratitudeStage shareToken={shareToken} />;
  if (stageNum === 3) return <StepAwayStage shareToken={shareToken} />;
  if (stageNum === 4) return <BreathStage shareToken={shareToken} seconds={30} closing={true} badge="dopamine-resetter" />;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1 & 4 — Animated breathing circle
// ─────────────────────────────────────────────────────────────────────────────
function BreathStage({
  shareToken,
  seconds,
  closing,
  badge,
}: {
  shareToken: string;
  seconds: number;
  closing: boolean;
  badge: string;
}) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    if (elapsed >= seconds) return;
    const id = setInterval(() => setElapsed((s) => Math.min(seconds, s + 1)), 1000);
    return () => clearInterval(id);
  }, [elapsed, seconds]);

  const phase = elapsed % 8; // 4s in, 4s out
  const scale = phase < 4 ? 0.6 + (phase / 4) * 0.6 : 1.2 - ((phase - 4) / 4) * 0.6;
  const inhaling = phase < 4;
  const done = elapsed >= seconds;

  async function next() {
    setAdvancing(true);
    try {
      if (closing) {
        await fetch("/api/session/advance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ badge_slug: badge, complete: true }),
        });
        router.push(`/m/${shareToken}/complete`);
      } else {
        await fetch("/api/session/advance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ badge_slug: badge }),
        });
        router.push(`/m/${shareToken}/stage/2`);
      }
    } finally {
      setAdvancing(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <HDCard className="p-8 text-center">
        <Wind size={32} strokeWidth={2.5} color={COLOR.red} className="mx-auto" />
        <h2 className="mt-3 text-2xl" style={{ ...KALAM, color: COLOR.pencil }}>
          {closing ? "One more slow breath" : "Box breathing"}
        </h2>
        <p className="mt-1 text-base" style={{ color: pencilAlpha("cc") }}>
          {inhaling ? "Breathe in slowly…" : "Breathe out gently…"}
        </p>

        <div className="mx-auto my-10 h-64 w-64 flex items-center justify-center">
          <motion.div
            animate={{ scale }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="h-40 w-40 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: COLOR.postIt,
              border: `3px solid ${COLOR.pencil}`,
              boxShadow: `4px 5px 0 ${pencilAlpha("33")}`,
            }}
          >
            <span style={{ ...KALAM, color: COLOR.pencil, fontSize: "2rem" }}>
              {Math.max(0, seconds - elapsed)}s
            </span>
          </motion.div>
        </div>

        {done ? (
          <HDButton variant="primary" size="lg" onClick={next} disabled={advancing}>
            {closing ? "All done" : "Next"}
            <ArrowRight size={22} strokeWidth={2.5} />
          </HDButton>
        ) : (
          <div className="text-sm" style={{ color: pencilAlpha("99") }}>
            Just keep breathing — the button shows up when the timer hits 0.
          </div>
        )}
      </HDCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2 — Gratitude (3 inputs + AI reflection)
// ─────────────────────────────────────────────────────────────────────────────
function GratitudeStage({ shareToken }: { shareToken: string }) {
  const router = useRouter();
  const [entries, setEntries] = useState(["", "", ""]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [grading, setGrading] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  async function grade() {
    setGrading(true);
    try {
      const r = await fetch("/api/stage/gratitude/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: entries.filter((e) => e.trim().length > 0) }),
      });
      const d = await r.json();
      setFeedback(d.feedback);
    } finally {
      setGrading(false);
    }
  }

  async function next() {
    setAdvancing(true);
    try {
      await fetch("/api/session/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badge_slug: "grateful-heart" }),
      });
      router.push(`/m/${shareToken}/stage/3`);
    } finally {
      setAdvancing(false);
    }
  }

  const filled = entries.filter((e) => e.trim().length > 0).length;

  return (
    <div className="mx-auto max-w-xl">
      <HDCard className="p-6" decoration="tack">
        <div className="text-center">
          <Heart size={28} strokeWidth={2.5} color={COLOR.red} className="mx-auto" />
          <h2 className="mt-2 text-2xl" style={{ ...KALAM, color: COLOR.pencil }}>
            Three things you&apos;re grateful for
          </h2>
          <p className="mt-1 text-sm" style={{ color: pencilAlpha("cc") }}>
            Anything counts — small wins, people, snacks, the weather.
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {entries.map((e, i) => (
            <input
              key={i}
              value={e}
              onChange={(ev) => {
                const next = [...entries];
                next[i] = ev.target.value;
                setEntries(next);
                setFeedback(null);
              }}
              placeholder={`Thing ${i + 1}…`}
              className="rounded-xl border-2 px-4 py-3 text-base focus:outline-none"
              style={{
                ...KALAM,
                fontSize: "1.05rem",
                borderColor: pencilAlpha("66"),
                color: COLOR.pencil,
                backgroundColor: "white",
              }}
              maxLength={120}
            />
          ))}
        </div>

        {!feedback ? (
          <div className="mt-5 flex justify-center">
            <HDButton
              variant="primary"
              size="md"
              onClick={grade}
              disabled={filled === 0 || grading}
            >
              {grading ? "Reading…" : "Done — share with the coach"}
              <Sparkles size={18} strokeWidth={2.5} />
            </HDButton>
          </div>
        ) : (
          <>
            <div
              className="mt-5 rounded-xl border-2 p-4"
              style={{
                ...KALAM,
                fontSize: "1.05rem",
                color: COLOR.pencil,
                backgroundColor: COLOR.postItGreen,
                borderColor: COLOR.pencil,
              }}
            >
              {feedback}
            </div>
            <div className="mt-4 flex justify-center">
              <HDButton variant="primary" size="lg" onClick={next} disabled={advancing}>
                Next
                <ArrowRight size={22} strokeWidth={2.5} />
              </HDButton>
            </div>
          </>
        )}
      </HDCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3 — Step away (offline task, honour-code completion)
// ─────────────────────────────────────────────────────────────────────────────
function StepAwayStage({ shareToken }: { shareToken: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function done() {
    setSubmitting(true);
    try {
      await fetch("/api/session/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badge_slug: "fresh-air" }),
      });
      router.push(`/m/${shareToken}/stage/4`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <HDCard className="p-8 text-center">
        <Trees size={32} strokeWidth={2.5} color={COLOR.red} className="mx-auto" />
        <h2 className="mt-3 text-2xl" style={{ ...KALAM, color: COLOR.pencil }}>
          Step away — 2 minutes
        </h2>
        <p className="mt-3 text-base" style={{ color: pencilAlpha("cc") }}>
          Put the screen down. Stand up. Look out a window or step outside.
          Stretch. Notice 3 things you can hear.
        </p>
        <div className="mt-2 text-sm" style={{ color: pencilAlpha("99") }}>
          Come back when you&apos;re ready.
        </div>

        <div className="mt-8">
          <HDButton variant="primary" size="lg" onClick={done} disabled={submitting}>
            <Check size={22} strokeWidth={3} />
            I came back
            <ArrowRight size={22} strokeWidth={2.5} />
          </HDButton>
        </div>
      </HDCard>
    </div>
  );
}
