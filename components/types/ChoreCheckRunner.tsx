"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { HDCard } from "@/components/handdrawn/HDCard";
import { HDButton } from "@/components/handdrawn/HDButton";
import { COLOR, KALAM, pencilAlpha } from "@/lib/design-tokens";

type MissionMeta = { topic: string; title: string };

// One stage: kid sees task, taps "I did it!" → marks session complete.
export function ChoreCheckRunner({
  shareToken,
  mission,
}: {
  shareToken: string;
  mission: MissionMeta;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function done() {
    setSubmitting(true);
    try {
      await fetch("/api/session/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badge_slug: "task-doer", complete: true }),
      });
      router.push(`/m/${shareToken}/complete`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <HDCard className="p-8 text-center" decoration="tape">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "backOut" }}
        >
          <div className="text-xs font-bold uppercase tracking-wide" style={{ color: COLOR.red }}>
            Your task
          </div>
          <h2
            className="mt-3 text-3xl leading-tight"
            style={{ ...KALAM, color: COLOR.pencil }}
          >
            {mission.topic}
          </h2>
          {mission.title && (
            <p className="mt-2 text-sm" style={{ color: pencilAlpha("99") }}>
              {mission.title}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-8"
        >
          <p className="mb-5 text-base" style={{ color: pencilAlpha("cc") }}>
            Tap the button when you&apos;ve actually done it.
            <br />
            <span style={{ ...KALAM, color: COLOR.pencil }}>
              Honour code — we trust you 🤝
            </span>
          </p>

          <HDButton variant="primary" size="lg" onClick={done} disabled={submitting}>
            <Check size={22} strokeWidth={3} />
            I did it!
            <Sparkles size={20} strokeWidth={2.5} />
          </HDButton>
        </motion.div>
      </HDCard>
    </div>
  );
}
