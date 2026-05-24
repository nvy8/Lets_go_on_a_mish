"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Check, X, ArrowRight, PenLine, Sparkles } from "lucide-react";
import { HDCard } from "@/components/handdrawn/HDCard";
import { HDButton } from "@/components/handdrawn/HDButton";
import { COLOR, KALAM, pencilAlpha } from "@/lib/design-tokens";

type Q = { q: string; options: string[]; correct_idx: number };
type Init = { passage: string; questions: Q[] };
type Props = { shareToken: string; stageNum: number };

export function ReadingDrillRunner({ shareToken, stageNum }: Props) {
  if (stageNum === 1) return <ReadPassageStage shareToken={shareToken} />;
  if (stageNum === 2) return <SummarizeStage shareToken={shareToken} />;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1 — Read + 3 multiple-choice questions
// ─────────────────────────────────────────────────────────────────────────────
function ReadPassageStage({ shareToken }: { shareToken: string }) {
  const router = useRouter();
  const [data, setData] = useState<Init | null>(null);
  const [loading, setLoading] = useState(true);
  const [picks, setPicks] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    fetch("/api/stage/reading/init", { method: "POST" })
      .then((r) => r.json())
      .then((d: Init) => {
        if (d.passage) setData(d);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <HDCard className="p-8 text-center">
        <div style={{ ...KALAM, color: COLOR.pencil, fontSize: "1.1rem" }}>
          Coach is preparing a passage for you…
        </div>
      </HDCard>
    );
  }
  if (!data) {
    return <div className="text-red-600">Failed to load. Refresh.</div>;
  }

  const allAnswered = data.questions.every((_, i) => picks[i] !== undefined);
  const correctCount = data.questions.filter((q, i) => picks[i] === q.correct_idx).length;

  async function next() {
    setAdvancing(true);
    try {
      await fetch("/api/session/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badge_slug: correctCount >= 2 ? "careful-reader" : undefined }),
      });
      router.push(`/m/${shareToken}/stage/2`);
    } finally {
      setAdvancing(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <HDCard className="p-6">
        <div className="flex items-center gap-2">
          <BookOpen size={26} strokeWidth={2.5} color={COLOR.red} />
          <h2 className="text-2xl" style={{ ...KALAM, color: COLOR.pencil }}>
            Read this carefully
          </h2>
        </div>
        <div
          className="mt-4 rounded-xl p-5 text-base leading-7"
          style={{
            backgroundColor: COLOR.postIt,
            border: `2px solid ${COLOR.pencil}`,
            color: COLOR.pencil,
          }}
        >
          {data.passage}
        </div>
      </HDCard>

      <div className="mt-4 flex flex-col gap-3">
        {data.questions.map((q, qi) => (
          <HDCard key={qi} className="p-4">
            <div className="text-base font-semibold" style={{ color: COLOR.pencil }}>
              {qi + 1}. {q.q}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {q.options.map((opt, oi) => {
                const picked = picks[qi] === oi;
                const showResult = submitted;
                const isCorrect = oi === q.correct_idx;
                let bg = "white";
                let border = pencilAlpha("33");
                if (showResult) {
                  if (isCorrect) {
                    bg = COLOR.postItGreen;
                    border = COLOR.pencil;
                  } else if (picked) {
                    bg = COLOR.postItPink;
                    border = COLOR.red;
                  }
                } else if (picked) {
                  bg = COLOR.postIt;
                  border = COLOR.pencil;
                }
                return (
                  <button
                    key={oi}
                    onClick={() => !submitted && setPicks({ ...picks, [qi]: oi })}
                    disabled={submitted}
                    className="rounded-lg border-2 px-3 py-2 text-left text-sm transition"
                    style={{ backgroundColor: bg, borderColor: border, color: COLOR.pencil }}
                  >
                    {showResult && isCorrect && (
                      <Check size={16} strokeWidth={3} className="inline mr-1" />
                    )}
                    {showResult && picked && !isCorrect && (
                      <X size={16} strokeWidth={3} className="inline mr-1" />
                    )}
                    {opt}
                  </button>
                );
              })}
            </div>
          </HDCard>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        {!submitted ? (
          <HDButton
            variant="primary"
            size="lg"
            onClick={() => setSubmitted(true)}
            disabled={!allAnswered}
          >
            Check my answers
            <Sparkles size={20} strokeWidth={2.5} />
          </HDButton>
        ) : (
          <HDButton variant="primary" size="lg" onClick={next} disabled={advancing}>
            {correctCount}/{data.questions.length} right — Next
            <ArrowRight size={22} strokeWidth={2.5} />
          </HDButton>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2 — Summarize main idea (free text, AI graded)
// ─────────────────────────────────────────────────────────────────────────────
function SummarizeStage({ shareToken }: { shareToken: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState<{ grade: string; feedback: string } | null>(null);
  const [grading, setGrading] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  async function grade() {
    setGrading(true);
    try {
      const r = await fetch("/api/stage/reading/grade-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: text }),
      });
      const d = await r.json();
      setFeedback(d);
    } finally {
      setGrading(false);
    }
  }

  async function finish() {
    setAdvancing(true);
    try {
      await fetch("/api/session/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          badge_slug: feedback?.grade === "exceeding" || feedback?.grade === "meeting" ? "wordsmith" : undefined,
          complete: true,
        }),
      });
      router.push(`/m/${shareToken}/complete`);
    } finally {
      setAdvancing(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <HDCard className="p-6">
        <div className="flex items-center gap-2">
          <PenLine size={26} strokeWidth={2.5} color={COLOR.red} />
          <h2 className="text-2xl" style={{ ...KALAM, color: COLOR.pencil }}>
            What was the main idea?
          </h2>
        </div>
        <p className="mt-1 text-sm" style={{ color: pencilAlpha("cc") }}>
          In your own words — 1 or 2 sentences.
        </p>

        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setFeedback(null);
          }}
          placeholder="The main idea is…"
          rows={4}
          className="mt-4 w-full rounded-xl border-2 px-4 py-3 text-base focus:outline-none"
          style={{
            ...KALAM,
            fontSize: "1.05rem",
            borderColor: pencilAlpha("66"),
            color: COLOR.pencil,
            backgroundColor: "white",
          }}
          maxLength={500}
        />

        {!feedback ? (
          <div className="mt-4 flex justify-center">
            <HDButton variant="primary" size="md" onClick={grade} disabled={text.length < 10 || grading}>
              {grading ? "Coach reading…" : "Get coach feedback"}
            </HDButton>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-xl border-2 p-4"
              style={{
                ...KALAM,
                fontSize: "1.05rem",
                color: COLOR.pencil,
                backgroundColor:
                  feedback.grade === "exceeding" || feedback.grade === "meeting"
                    ? COLOR.postItGreen
                    : COLOR.postIt,
                borderColor: COLOR.pencil,
              }}
            >
              {feedback.feedback}
            </motion.div>
            <div className="mt-4 flex justify-center">
              <HDButton variant="primary" size="lg" onClick={finish} disabled={advancing}>
                Finish
                <ArrowRight size={22} strokeWidth={2.5} />
              </HDButton>
            </div>
          </>
        )}
      </HDCard>
    </div>
  );
}
