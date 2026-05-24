"use client";
// 6-step wizard to create a Mish.
// Step 1: role (teacher/parent)
// Step 2: mission type (cards)
// Step 3: title + topic + optional PDF upload
// Step 4: badges + reward points
// Step 5: optional timer (minutes)
// Step 6: review → create → show share link

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Search,
  CheckCircle,
  Wind,
  BookOpen,
  Upload,
  Award,
  Timer,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import { HDCard } from "@/components/handdrawn/HDCard";
import { HDButton } from "@/components/handdrawn/HDButton";
import { COLOR, KALAM, RADIUS, SHADOW, pencilAlpha, PAPER_BG } from "@/lib/design-tokens";
import { TYPE_REGISTRY } from "@/components/types/registry";

type Role = "teacher" | "parent";

type Draft = {
  role: Role;
  type_slug: string;
  title: string;
  topic: string;
  pdf?: File;
  badges: string[];
  points: number;
  timer_minutes: number;
};

export default function NewMishWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>({
    role: "teacher",
    type_slug: "",
    title: "",
    topic: "",
    badges: [],
    points: 0,
    timer_minutes: 0,
  });
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ share_token: string; missionId: string } | null>(null);
  const [pdfStatus, setPdfStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const typeMeta = TYPE_REGISTRY[draft.type_slug];

  function next() {
    setStep((s) => Math.min(6, s + 1));
  }
  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function createMission() {
    setCreating(true);
    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          topic: draft.topic,
          mission_type_slug: draft.type_slug,
          audience_role: draft.role,
          timer_seconds: draft.timer_minutes > 0 ? draft.timer_minutes * 60 : undefined,
          rewards_config: {
            points_per_completion: draft.points || undefined,
            badges_offered: draft.badges,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");

      // Upload PDF if provided
      if (draft.pdf) {
        setPdfStatus("Extracting facts from PDF…");
        const form = new FormData();
        form.append("pdf", draft.pdf);
        form.append("mission_id", data.missionId);
        form.append("topic", draft.topic);
        const pdfRes = await fetch("/api/missions/upload-pdf", { method: "POST", body: form });
        const pdfData = await pdfRes.json();
        if (pdfRes.ok) {
          setPdfStatus(`✓ Got ${pdfData.facts_count} facts from your PDF`);
        } else {
          setPdfStatus(`⚠️ PDF parse failed: ${pdfData.error}`);
        }
      }

      setResult({ share_token: data.share_token, missionId: data.missionId });
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  const shareUrl = result
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/m/${result.share_token}`
    : "";

  return (
    <main className="relative min-h-full flex-1 px-6 py-10" style={PAPER_BG}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/teacher/dashboard"
            className="text-sm"
            style={{ ...KALAM, color: pencilAlpha("99") }}
          >
            ← dashboard
          </Link>
          <div
            className="text-xs"
            style={{ ...KALAM, color: COLOR.red, fontWeight: 700 }}
          >
            Step {step} of 6
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="mb-8 h-2 overflow-hidden border-2"
          style={{
            borderColor: COLOR.pencil,
            backgroundColor: "white",
            borderRadius: "20px 8px 16px 6px / 8px 20px 6px 16px",
          }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${(step / 6) * 100}%`, backgroundColor: COLOR.red }}
          />
        </div>

        {step === 1 && <Step1Role draft={draft} setDraft={setDraft} next={next} />}
        {step === 2 && <Step2Type draft={draft} setDraft={setDraft} next={next} back={back} />}
        {step === 3 && <Step3TopicPdf draft={draft} setDraft={setDraft} next={next} back={back} />}
        {step === 4 && (
          <Step4Rewards
            draft={draft}
            setDraft={setDraft}
            typeMeta={typeMeta}
            next={next}
            back={back}
          />
        )}
        {step === 5 && <Step5Timer draft={draft} setDraft={setDraft} next={next} back={back} />}
        {step === 6 && (
          <Step6Review
            draft={draft}
            typeMeta={typeMeta}
            creating={creating}
            result={result}
            pdfStatus={pdfStatus}
            shareUrl={shareUrl}
            copied={copied}
            onCopy={() => {
              navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            create={createMission}
            back={back}
            done={() => router.push(`/teacher/missions/${result?.missionId}`)}
          />
        )}
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function Step1Role({
  draft,
  setDraft,
  next,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  next: () => void;
}) {
  return (
    <HDCard className="p-6" decoration="tape">
      <h2 className="text-2xl" style={{ ...KALAM, color: COLOR.pencil }}>
        Are you a teacher or a parent?
      </h2>
      <p className="mt-1 text-sm" style={{ color: pencilAlpha("cc") }}>
        We&apos;ll tune the copy and the type list to who you are.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(["teacher", "parent"] as Role[]).map((r) => {
          const picked = draft.role === r;
          return (
            <button
              key={r}
              onClick={() => setDraft({ ...draft, role: r })}
              className="rounded-2xl border-2 p-5 text-left transition"
              style={{
                ...KALAM,
                backgroundColor: picked ? COLOR.postIt : "white",
                borderColor: COLOR.pencil,
                boxShadow: picked ? `4px 5px 0 ${pencilAlpha("33")}` : SHADOW.sm,
              }}
            >
              <div className="text-2xl">{r === "teacher" ? "🧑‍🏫" : "👪"}</div>
              <div className="mt-1 text-xl" style={{ color: COLOR.pencil }}>
                {r === "teacher" ? "I'm a teacher" : "I'm a parent"}
              </div>
              <div className="mt-1 text-xs" style={{ ...KALAM, color: pencilAlpha("99") }}>
                {r === "teacher"
                  ? "Send to a class via shareable link"
                  : "Send to your kid — reward at home"}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <HDButton variant="primary" size="md" onClick={next}>
          Next <ArrowRight size={20} strokeWidth={2.5} />
        </HDButton>
      </div>
    </HDCard>
  );
}

function Step2Type({
  draft,
  setDraft,
  next,
  back,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  next: () => void;
  back: () => void;
}) {
  const ICONS: Record<string, typeof Search> = {
    "sources-vetting": Search,
    "chore-check": CheckCircle,
    "dopamine-reset": Wind,
    "reading-drill": BookOpen,
  };

  const visible = Object.values(TYPE_REGISTRY).filter(
    (t) => t.audience === draft.role || t.audience === "both",
  );

  return (
    <HDCard className="p-6">
      <h2 className="text-2xl" style={{ ...KALAM, color: COLOR.pencil }}>
        Pick a Mish type
      </h2>
      <p className="mt-1 text-sm" style={{ color: pencilAlpha("cc") }}>
        Each type runs a different learning flow.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visible.map((t) => {
          const Icon = ICONS[t.slug] || Sparkles;
          const picked = draft.type_slug === t.slug;
          return (
            <button
              key={t.slug}
              onClick={() => setDraft({ ...draft, type_slug: t.slug })}
              className="rounded-2xl border-2 p-4 text-left transition"
              style={{
                ...KALAM,
                backgroundColor: picked ? COLOR.postIt : "white",
                borderColor: COLOR.pencil,
                boxShadow: picked ? `4px 5px 0 ${pencilAlpha("33")}` : SHADOW.sm,
              }}
            >
              <Icon size={28} strokeWidth={2.5} color={COLOR.red} />
              <div className="mt-2 text-lg" style={{ color: COLOR.pencil }}>
                {t.name}
              </div>
              <div
                className="mt-1 text-xs"
                style={{ color: pencilAlpha("b3"), fontFamily: "inherit" }}
              >
                {t.description}
              </div>
              <div
                className="mt-2 text-xs"
                style={{ ...KALAM, color: COLOR.red }}
              >
                {t.totalStages} stage{t.totalStages > 1 ? "s" : ""}
              </div>
            </button>
          );
        })}
      </div>

      {/* Coming soon: create new type */}
      <div
        className="mt-4 rounded-xl border-2 border-dashed p-3 text-center text-sm"
        style={{ borderColor: pencilAlpha("66"), color: pencilAlpha("99") }}
      >
        ✨ &nbsp;Create a custom type via AI orchestrator — coming soon
      </div>

      <div className="mt-6 flex justify-between">
        <HDButton variant="secondary" size="md" onClick={back}>
          <ArrowLeft size={18} strokeWidth={2.5} /> Back
        </HDButton>
        <HDButton variant="primary" size="md" onClick={next} disabled={!draft.type_slug}>
          Next <ArrowRight size={20} strokeWidth={2.5} />
        </HDButton>
      </div>
    </HDCard>
  );
}

function Step3TopicPdf({
  draft,
  setDraft,
  next,
  back,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  next: () => void;
  back: () => void;
}) {
  const typeMeta = TYPE_REGISTRY[draft.type_slug];
  const isChoreCheck = draft.type_slug === "chore-check";

  return (
    <HDCard className="p-6">
      <h2 className="text-2xl" style={{ ...KALAM, color: COLOR.pencil }}>
        {isChoreCheck ? "What's the task?" : "What's the topic?"}
      </h2>
      <p className="mt-1 text-sm" style={{ color: pencilAlpha("cc") }}>
        {isChoreCheck
          ? "Describe what you want the kid to do."
          : `Topic for ${typeMeta?.name || "the Mish"}.`}
      </p>

      <div className="mt-5 flex flex-col gap-3">
        <input
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Title — e.g. Year 6 — Transylvanian Churches"
          className="rounded-xl border-2 px-4 py-3"
          style={{
            ...KALAM,
            fontSize: "1.05rem",
            color: COLOR.pencil,
            borderColor: pencilAlpha("66"),
            backgroundColor: "white",
          }}
          maxLength={120}
        />
        <textarea
          value={draft.topic}
          onChange={(e) => setDraft({ ...draft, topic: e.target.value })}
          placeholder={
            isChoreCheck
              ? "Take out the recycling and tie the bag"
              : "Why did Transylvanian churches need defensive walls?"
          }
          rows={3}
          className="rounded-xl border-2 px-4 py-3"
          style={{
            color: COLOR.pencil,
            borderColor: pencilAlpha("66"),
            backgroundColor: "white",
          }}
          maxLength={300}
        />

        {!isChoreCheck && (
          <label
            className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-4"
            style={{ borderColor: pencilAlpha("66"), backgroundColor: "white" }}
          >
            <Upload size={20} strokeWidth={2.5} color={COLOR.red} />
            <div className="flex-1">
              <div style={{ ...KALAM, color: COLOR.pencil }}>
                {draft.pdf ? draft.pdf.name : "Upload PDF (optional)"}
              </div>
              <div className="text-xs" style={{ color: pencilAlpha("99") }}>
                {draft.pdf
                  ? `${Math.round(draft.pdf.size / 1024)} KB — our AI will pick the most relevant facts`
                  : "Drop a lesson PDF — AI extracts the facts for the kids"}
              </div>
            </div>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setDraft({ ...draft, pdf: file });
              }}
            />
          </label>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <HDButton variant="secondary" size="md" onClick={back}>
          <ArrowLeft size={18} strokeWidth={2.5} /> Back
        </HDButton>
        <HDButton
          variant="primary"
          size="md"
          onClick={next}
          disabled={draft.title.length < 3 || draft.topic.length < 3}
        >
          Next <ArrowRight size={20} strokeWidth={2.5} />
        </HDButton>
      </div>
    </HDCard>
  );
}

function Step4Rewards({
  draft,
  setDraft,
  typeMeta,
  next,
  back,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  typeMeta: (typeof TYPE_REGISTRY)[string] | undefined;
  next: () => void;
  back: () => void;
}) {
  // For now use stageName-derived badge slugs from registry (won't have full badge defs yet at the registry)
  // We'll just let the teacher pick which named achievements to highlight.
  const availableBadges = typeMeta?.stageNames.slice(1).map((name, i) => ({
    slug: `${typeMeta.slug}-${i + 1}`,
    name,
  })) || [];

  function toggle(slug: string) {
    const next = draft.badges.includes(slug)
      ? draft.badges.filter((b) => b !== slug)
      : [...draft.badges, slug];
    setDraft({ ...draft, badges: next });
  }

  return (
    <HDCard className="p-6">
      <h2 className="text-2xl" style={{ ...KALAM, color: COLOR.pencil }}>
        Pick rewards
      </h2>
      <p className="mt-1 text-sm" style={{ color: pencilAlpha("cc") }}>
        Choose which badges to offer (or skip — defaults are fine).
      </p>

      <div className="mt-5">
        <div className="text-xs font-bold uppercase" style={{ color: COLOR.red }}>
          Badges to offer
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {availableBadges.map((b) => {
            const picked = draft.badges.includes(b.slug);
            return (
              <button
                key={b.slug}
                onClick={() => toggle(b.slug)}
                className="rounded-full border-2 px-3 py-2 text-sm"
                style={{
                  ...KALAM,
                  backgroundColor: picked ? COLOR.postIt : "white",
                  borderColor: COLOR.pencil,
                  color: COLOR.pencil,
                }}
              >
                <Award size={14} strokeWidth={2.5} className="inline mr-1" color={COLOR.red} />
                {b.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <div className="text-xs font-bold uppercase" style={{ color: COLOR.red }}>
          Reward points (optional)
        </div>
        <input
          type="number"
          min={0}
          max={1000}
          value={draft.points}
          onChange={(e) => setDraft({ ...draft, points: parseInt(e.target.value || "0", 10) })}
          className="mt-2 w-32 rounded-xl border-2 px-3 py-2 text-base"
          style={{ ...KALAM, color: COLOR.pencil, borderColor: pencilAlpha("66") }}
        />
        <span className="ml-2 text-sm" style={{ color: pencilAlpha("99") }}>
          points the kid earns on completion
        </span>
      </div>

      <div className="mt-3 text-xs" style={{ color: pencilAlpha("99") }}>
        💡 You honour the actual reward yourself — ice cream, screen time, whatever you promised.
        We just track the points.
      </div>

      <div className="mt-6 flex justify-between">
        <HDButton variant="secondary" size="md" onClick={back}>
          <ArrowLeft size={18} strokeWidth={2.5} /> Back
        </HDButton>
        <HDButton variant="primary" size="md" onClick={next}>
          Next <ArrowRight size={20} strokeWidth={2.5} />
        </HDButton>
      </div>
    </HDCard>
  );
}

function Step5Timer({
  draft,
  setDraft,
  next,
  back,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  next: () => void;
  back: () => void;
}) {
  return (
    <HDCard className="p-6">
      <h2 className="text-2xl" style={{ ...KALAM, color: COLOR.pencil }}>
        Optional timer
      </h2>
      <p className="mt-1 text-sm" style={{ color: pencilAlpha("cc") }}>
        The kid sees a soft countdown. It never blocks them — just shows elapsed time.
      </p>

      <div className="mt-6 flex items-center gap-4">
        <Timer size={28} strokeWidth={2.5} color={COLOR.red} />
        <input
          type="range"
          min={0}
          max={60}
          step={5}
          value={draft.timer_minutes}
          onChange={(e) =>
            setDraft({ ...draft, timer_minutes: parseInt(e.target.value, 10) })
          }
          className="flex-1"
        />
        <div className="w-20 text-right" style={{ ...KALAM, color: COLOR.pencil, fontSize: "1.2rem" }}>
          {draft.timer_minutes === 0 ? "off" : `${draft.timer_minutes} min`}
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <HDButton variant="secondary" size="md" onClick={back}>
          <ArrowLeft size={18} strokeWidth={2.5} /> Back
        </HDButton>
        <HDButton variant="primary" size="md" onClick={next}>
          Next <ArrowRight size={20} strokeWidth={2.5} />
        </HDButton>
      </div>
    </HDCard>
  );
}

function Step6Review({
  draft,
  typeMeta,
  creating,
  result,
  pdfStatus,
  shareUrl,
  copied,
  onCopy,
  create,
  back,
  done,
}: {
  draft: Draft;
  typeMeta: (typeof TYPE_REGISTRY)[string] | undefined;
  creating: boolean;
  result: { share_token: string; missionId: string } | null;
  pdfStatus: string | null;
  shareUrl: string;
  copied: boolean;
  onCopy: () => void;
  create: () => void;
  back: () => void;
  done: () => void;
}) {
  if (result) {
    return (
      <HDCard className="p-6 text-center" decoration="tack" variant="postItGreen">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Sparkles size={48} strokeWidth={2.5} color={COLOR.red} className="mx-auto" />
          <h2 className="mt-3 text-3xl" style={{ ...KALAM, color: COLOR.pencil }}>
            Your Mish is live!
          </h2>
        </motion.div>

        <div
          className="mx-auto mt-5 flex max-w-md items-center gap-2 rounded-xl border-2 p-3"
          style={{
            backgroundColor: "white",
            borderColor: COLOR.pencil,
            color: COLOR.pencil,
          }}
        >
          <code className="truncate text-sm" style={{ fontFamily: "monospace" }}>
            {shareUrl}
          </code>
          <button
            onClick={onCopy}
            className="rounded-lg px-3 py-1.5 text-sm"
            style={{
              ...KALAM,
              backgroundColor: COLOR.red,
              color: "white",
              border: `2px solid ${COLOR.pencil}`,
            }}
          >
            {copied ? <Check size={14} strokeWidth={3} /> : <Copy size={14} strokeWidth={2.5} />}
          </button>
        </div>

        {pdfStatus && (
          <div className="mt-3 text-sm" style={{ ...KALAM, color: COLOR.pencil }}>
            {pdfStatus}
          </div>
        )}

        <p className="mt-4 text-sm" style={{ color: pencilAlpha("99") }}>
          Drop the link in Google Classroom (or text it to your kid).
        </p>

        <div className="mt-6">
          <HDButton variant="primary" size="lg" onClick={done}>
            See the Mish detail <ArrowRight size={22} strokeWidth={2.5} />
          </HDButton>
        </div>
      </HDCard>
    );
  }

  return (
    <HDCard className="p-6">
      <h2 className="text-2xl" style={{ ...KALAM, color: COLOR.pencil }}>
        Review
      </h2>

      <dl
        className="mt-4 grid grid-cols-1 gap-3"
        style={{ ...KALAM, color: COLOR.pencil }}
      >
        <Row label="Role" value={draft.role === "teacher" ? "Teacher" : "Parent"} />
        <Row label="Type" value={typeMeta?.name || draft.type_slug} />
        <Row label="Title" value={draft.title} />
        <Row label="Topic" value={draft.topic} />
        {draft.pdf && <Row label="PDF" value={draft.pdf.name} />}
        <Row label="Badges" value={draft.badges.length ? `${draft.badges.length} picked` : "defaults"} />
        <Row label="Points" value={draft.points > 0 ? `${draft.points} pts` : "—"} />
        <Row label="Timer" value={draft.timer_minutes > 0 ? `${draft.timer_minutes} min` : "off"} />
      </dl>

      <div className="mt-6 flex justify-between">
        <HDButton variant="secondary" size="md" onClick={back} disabled={creating}>
          <ArrowLeft size={18} strokeWidth={2.5} /> Back
        </HDButton>
        <HDButton variant="primary" size="lg" onClick={create} disabled={creating}>
          {creating ? "Creating…" : "Create my Mish"} <Sparkles size={18} strokeWidth={2.5} />
        </HDButton>
      </div>
    </HDCard>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt
        className="w-20 text-xs uppercase tracking-wide"
        style={{ color: COLOR.red, fontWeight: 700 }}
      >
        {label}
      </dt>
      <dd className="flex-1" style={{ fontSize: "1.05rem" }}>
        {value || "—"}
      </dd>
    </div>
  );
}
