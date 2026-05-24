"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Eye, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import { HDCard } from "@/components/handdrawn/HDCard";
import { HDButton } from "@/components/handdrawn/HDButton";
import { HDInput } from "@/components/handdrawn/HDInput";
import { COLOR, RADIUS, SHADOW, KALAM, pencilAlpha, PAPER_BG } from "@/lib/design-tokens";

function validateDisplayName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.includes("@")) {
    return "That looks like an email. Pick a fun nickname — no real names, emails, or contact info.";
  }
  if (/\d{7,}/.test(trimmed)) {
    return "That looks like a phone number. Pick a fun nickname instead — no real contact info.";
  }
  return null;
}

export default function KidJoin({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = use(params);
  const router = useRouter();
  const [mission, setMission] = useState<{ title: string; topic: string } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/m/${shareToken}`).then(async (r) => {
      if (r.status === 404) {
        setNotFound(true);
        return;
      }
      const data = await r.json();
      setMission(data.mission);
    });
  }, [shareToken]);

  const trimmedName = displayName.trim();
  const nameWarning = validateDisplayName(displayName);
  const canSubmit = !joining && trimmedName.length > 0 && !nameWarning;

  async function join(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setJoining(true);
    try {
      const res = await fetch(`/api/m/${shareToken}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: trimmedName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.push(`/m/${shareToken}/stage/1`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setJoining(false);
    }
  }

  if (notFound) {
    return (
      <main className="flex flex-1 items-center justify-center p-6" style={PAPER_BG}>
        <HDCard className="p-8 text-center max-w-md">
          <div
            className="mx-auto inline-flex h-16 w-16 items-center justify-center border-[3px] -rotate-3"
            style={{
              borderColor: COLOR.pencil,
              backgroundColor: COLOR.postIt,
              borderRadius: RADIUS.oval,
              boxShadow: SHADOW.md,
            }}
          >
            <Search size={32} strokeWidth={2.5} color={COLOR.pencil} aria-hidden="true" />
          </div>
          <div className="mt-4 text-2xl" style={{ ...KALAM, color: COLOR.pencil }}>
            Mish not found
          </div>
          <div className="mt-2 text-base" style={{ color: pencilAlpha("cc") }}>
            Ask your teacher for the correct link.
          </div>
        </HDCard>
      </main>
    );
  }

  if (!mission) {
    return (
      <main className="flex flex-1 items-center justify-center p-12" style={PAPER_BG}>
        <div style={{ ...KALAM, color: pencilAlpha("99") }}>Loading…</div>
      </main>
    );
  }

  return (
    <main className="relative flex flex-1 items-center justify-center px-6 py-12 overflow-hidden" style={PAPER_BG}>
      <HDCard className="relative w-full max-w-md p-8" decoration="tape">
        <div className="relative text-center">
          {/* Sparkles flanking the mascot */}
          <motion.div
            className="pointer-events-none absolute left-1/2 top-0 -translate-x-[70px]"
            animate={{ rotate: [0, 12, -8, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          >
            <Sparkles size={20} color={COLOR.red} strokeWidth={2.5} />
          </motion.div>
          <motion.div
            className="pointer-events-none absolute left-1/2 top-2 translate-x-[50px]"
            animate={{ rotate: [0, -10, 14, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 2.6, repeat: Infinity, delay: 0.4 }}
          >
            <Sparkles size={18} color={COLOR.blue} strokeWidth={2.5} />
          </motion.div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/svg/brand/mascot-sleuth.svg"
            alt=""
            aria-hidden="true"
            className="mx-auto h-28 w-28 animate-sleuth-pop-in"
          />
          <div
            className="mt-3 inline-block px-3 py-1 text-sm border-2 rotate-1"
            style={{
              ...KALAM,
              backgroundColor: COLOR.gold,
              color: COLOR.pencil,
              borderColor: COLOR.pencil,
              borderRadius: RADIUS.tag,
              boxShadow: SHADOW.sm,
            }}
          >
            Sleuth Mish
          </div>
          <h1 className="mt-4 text-3xl leading-tight" style={{ ...KALAM, color: COLOR.pencil }}>
            {mission.title}
          </h1>
          <p className="mt-3 text-base" style={{ color: pencilAlpha("cc") }}>
            {mission.topic}
          </p>
        </div>

        <form onSubmit={join} className="mt-8 flex flex-col gap-3">
          <label
            htmlFor="kid-display-name"
            className="text-lg"
            style={{ ...KALAM, color: COLOR.pencil }}
          >
            Pick a display name
          </label>
          <p className="-mt-2 text-sm" style={{ color: pencilAlpha("99") }}>
            No last names. No emails. Pick something fun.
          </p>
          <HDInput
            id="kid-display-name"
            placeholder="e.g. MaxR or DragonHunter"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            maxLength={30}
            aria-label="Display name"
            aria-invalid={nameWarning ? true : undefined}
            aria-describedby={nameWarning ? "kid-display-name-warning" : "kid-display-name-privacy"}
            invalid={!!nameWarning}
          />
          {nameWarning && (
            <div
              id="kid-display-name-warning"
              role="alert"
              className="flex items-start gap-2 px-3 py-2 text-sm border-[3px]"
              style={{
                borderColor: COLOR.pencil,
                backgroundColor: COLOR.postIt,
                borderRadius: RADIUS.notice,
                boxShadow: SHADOW.sm,
                color: COLOR.pencil,
              }}
            >
              <AlertCircle
                size={20}
                strokeWidth={2.5}
                color={COLOR.red}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <span>{nameWarning}</span>
            </div>
          )}
          <div
            id="kid-display-name-privacy"
            className="flex items-start gap-2 px-3 py-2 text-sm border-2 border-dashed"
            style={{
              borderColor: pencilAlpha("4d"),
              borderRadius: RADIUS.notice,
              backgroundColor: COLOR.paper,
              color: pencilAlpha("b3"),
            }}
          >
            <Eye
              size={18}
              strokeWidth={2.5}
              className="mt-0.5 shrink-0"
              style={{ color: pencilAlpha("99") }}
              aria-hidden="true"
            />
            <span>Your teacher can see your name and your work on this Mish.</span>
          </div>
          {error && (
            <div
              className="px-3 py-2 text-sm border-[3px]"
              style={{
                borderColor: COLOR.red,
                backgroundColor: "white",
                borderRadius: RADIUS.notice,
                color: COLOR.red,
                boxShadow: SHADOW.sm,
              }}
            >
              {error}
            </div>
          )}
          <div className="mt-3">
            <HDButton type="submit" variant="primary" size="lg" disabled={!canSubmit}>
              {joining ? (
                "Starting…"
              ) : (
                <>
                  Let&apos;s go on a Mish
                  <ArrowRight size={22} strokeWidth={2.5} aria-hidden="true" />
                </>
              )}
            </HDButton>
          </div>
        </form>
      </HDCard>
    </main>
  );
}
