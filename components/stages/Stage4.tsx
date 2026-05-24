"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Pencil, Pin, Award, FileText } from "lucide-react";
import { HDCard } from "@/components/handdrawn/HDCard";
import { HDButton } from "@/components/handdrawn/HDButton";
import { HDTextarea } from "@/components/handdrawn/HDInput";
import { COLOR, RADIUS, SHADOW, KALAM, pencilAlpha } from "@/lib/design-tokens";

type Fact = {
  id: string;
  plain_text: string;
  kid_explanation?: string;
  ai_grade?: "exceeding" | "meeting" | "approaching" | "far_from";
  ai_feedback?: string;
};

const GRADE_STYLES: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  exceeding: {
    label: "✨ Exceeding",
    bg: "#f3e6ff",
    text: COLOR.pencil,
    border: COLOR.pencil,
  },
  meeting: {
    label: "✓ Meeting",
    bg: COLOR.postItGreen,
    text: COLOR.pencil,
    border: COLOR.pencil,
  },
  approaching: {
    label: "~ Approaching",
    bg: COLOR.postIt,
    text: COLOR.pencil,
    border: COLOR.pencil,
  },
  far_from: {
    label: "✗ Far from",
    bg: COLOR.postItPink,
    text: COLOR.pencil,
    border: COLOR.red,
  },
};

export function Stage4({ shareToken }: { shareToken: string }) {
  const router = useRouter();
  const [facts, setFacts] = useState<Fact[] | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [draft, setDraft] = useState("");
  const [grading, setGrading] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [done, setDone] = useState(false);
  const [doneBadge, setDoneBadge] = useState(false);

  useEffect(() => {
    fetch("/api/stage/4/init")
      .then((r) => r.json())
      .then((d) => {
        if (d.facts) {
          setFacts(d.facts);
          const firstUngraded = d.facts.findIndex((f: Fact) => !f.ai_grade);
          if (firstUngraded >= 0) setCurrentIdx(firstUngraded);
          else setCurrentIdx(d.facts.length - 1);
        }
      });
  }, []);

  async function gradeCurrent() {
    if (!facts || !facts[currentIdx]) return;
    const f = facts[currentIdx];
    setGrading(true);
    try {
      const res = await fetch("/api/stage/4/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fact_id: f.id, explanation: draft }),
      });
      const data = await res.json();
      if (res.ok) {
        const updated = [...facts];
        updated[currentIdx] = {
          ...f,
          kid_explanation: draft,
          ai_grade: data.grade,
          ai_feedback: data.feedback,
        };
        setFacts(updated);
      }
    } finally {
      setGrading(false);
    }
  }

  function nextFact() {
    setDraft("");
    setCurrentIdx((i) => i + 1);
  }

  async function finish() {
    setAdvancing(true);
    try {
      const r = await fetch("/api/stage/4/advance", { method: "POST" });
      const d = await r.json();
      if (r.ok) {
        setDoneBadge(d.earned_badge);
        setDone(true);
      }
    } finally {
      setAdvancing(false);
    }
  }

  if (!facts) {
    return (
      <HDCard className="p-10 text-center" style={{ color: pencilAlpha("99") }}>
        Loading your triangulated facts…
      </HDCard>
    );
  }

  if (!facts.length) {
    return (
      <HDCard variant="postItPink" className="p-6">
        No triangulated facts to explain. You may need to redo Stage 3.
      </HDCard>
    );
  }

  if (done) {
    return (
      <HDCard variant="postIt" className="p-8 text-center" decoration="tack">
        {doneBadge ? (
          <Award size={64} strokeWidth={2.5} color={COLOR.red} className="mx-auto" />
        ) : (
          <FileText size={64} strokeWidth={2.5} color={COLOR.pencil} className="mx-auto" />
        )}
        <h2 className="mt-3 text-2xl" style={{ ...KALAM, color: COLOR.pencil }}>
          {doneBadge ? "Badge unlocked: Wordsmith" : "Stage 4 complete"}
        </h2>
        <p className="mt-2 text-base" style={{ color: pencilAlpha("cc") }}>
          {doneBadge
            ? "All your explanations hit Meeting or Exceeding. Real comprehension."
            : "Some explanations could be sharper. Keep practising paraphrasing."}
        </p>
        <div className="mt-6 inline-block">
          <HDButton
            variant="primary"
            size="lg"
            onClick={() => router.push(`/m/${shareToken}/stage/5`)}
          >
            Continue to Spot Hallucinations
            <ArrowRight size={22} strokeWidth={2.5} />
          </HDButton>
        </div>
      </HDCard>
    );
  }

  const current = facts[currentIdx];
  const allGraded = facts.every((f) => f.ai_grade);
  const isLast = currentIdx === facts.length - 1;

  return (
    <div>
      <HDCard className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2
            className="flex items-center gap-2 text-2xl"
            style={{ ...KALAM, color: COLOR.pencil }}
          >
            <Pencil size={28} strokeWidth={2.5} color={COLOR.red} />
            Tell me in YOUR words
          </h2>
          <div className="text-sm" style={{ ...KALAM, color: COLOR.red }}>
            {currentIdx + 1} of {facts.length}
          </div>
        </div>
        <p className="mt-2 text-base" style={{ color: pencilAlpha("cc") }}>
          No copy-pasting! Explain it like you&apos;re telling a friend who&apos;s never heard of
          this. <b>Bonus points if you say WHY it matters.</b>
        </p>
      </HDCard>

      <HDCard variant="postIt" className="mt-4 p-5">
        <div
          className="flex items-center gap-2 text-sm"
          style={{ ...KALAM, color: COLOR.red }}
        >
          <Pin size={16} strokeWidth={2.5} />
          The fact
        </div>
        <div className="mt-1 text-lg leading-7" style={{ ...KALAM, color: COLOR.pencil }}>
          {current.plain_text}
        </div>
      </HDCard>

      {!current.ai_grade ? (
        <div className="mt-4">
          <label
            htmlFor="stage4-explanation"
            className="block text-base"
            style={{ ...KALAM, color: COLOR.pencil }}
          >
            Your explanation (in your own words)
          </label>
          <HDTextarea
            id="stage4-explanation"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="In my own words: this means…"
            rows={5}
            aria-label="Your explanation"
            className="mt-2 w-full"
          />
          <div className="mt-3">
            <HDButton
              variant="secondary"
              size="md"
              onClick={gradeCurrent}
              disabled={draft.length < 10 || grading}
            >
              {grading ? "Coach is reading…" : "Ask the coach"}
            </HDButton>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <HDCard size="sm" className="p-4">
            <div
              className="text-sm"
              style={{ ...KALAM, color: COLOR.pencil }}
            >
              Your explanation
            </div>
            <div className="mt-1 text-base" style={{ color: COLOR.pencil }}>
              {current.kid_explanation}
            </div>
          </HDCard>
          <div
            className="p-4 border-[3px]"
            style={{
              backgroundColor: GRADE_STYLES[current.ai_grade]?.bg ?? "white",
              borderColor: GRADE_STYLES[current.ai_grade]?.border ?? COLOR.pencil,
              borderRadius: RADIUS.cardSm,
              boxShadow: SHADOW.sm,
              color: GRADE_STYLES[current.ai_grade]?.text ?? COLOR.pencil,
            }}
          >
            <div className="text-base" style={{ ...KALAM }}>
              {GRADE_STYLES[current.ai_grade]?.label ?? current.ai_grade}
            </div>
            <div className="mt-1 text-base">{current.ai_feedback}</div>
          </div>
          <div className="flex justify-end gap-2">
            {!isLast ? (
              <HDButton variant="primary" size="md" onClick={nextFact}>
                Next fact
                <ArrowRight size={20} strokeWidth={2.5} />
              </HDButton>
            ) : (
              <HDButton
                variant="primary"
                size="md"
                onClick={finish}
                disabled={!allGraded || advancing}
              >
                {advancing ? "Saving…" : "Finish Stage 4"}
                {!advancing && <ArrowRight size={20} strokeWidth={2.5} />}
              </HDButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
