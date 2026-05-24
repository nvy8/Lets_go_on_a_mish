// TEMP HACKATHON DESIGN — uses ClassDojo IP — TODO: REPLACE BEFORE LAUNCH
"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, CheckCheck, FileText } from "lucide-react";
import { HDCard } from "@/components/handdrawn/HDCard";
import { HDButton } from "@/components/handdrawn/HDButton";
import { COLOR, RADIUS, KALAM, pencilAlpha, PAPER_BG } from "@/lib/design-tokens";

type Mission = {
  id: string;
  title: string;
  topic: string;
  knowledge_base_text?: string;
  share_token: string;
  created_at: string;
};

export default function MissionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [mission, setMission] = useState<Mission | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/missions/${id}`).then(async (r) => {
      if (r.status === 401) return router.push("/teacher/login");
      if (!r.ok) return;
      const data = await r.json();
      setMission(data.mission);
    });
  }, [id, router]);

  if (!mission) {
    return (
      <main
        className="flex flex-1 items-center justify-center p-12"
        style={PAPER_BG}
      >
        <div style={{ color: pencilAlpha("99") }}>Loading…</div>
      </main>
    );
  }

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/m/${mission.share_token}` : "";

  return (
    <main className="relative flex-1 overflow-hidden" style={PAPER_BG}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/scraped/page_homepage_sketch-lines.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.06]"
      />
      <div className="relative mx-auto w-full max-w-3xl px-6 py-12">
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-1 text-sm hover:opacity-70"
          style={{ color: pencilAlpha("99") }}
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          all missions
        </Link>
        <h1 className="mt-3 text-4xl" style={{ ...KALAM, color: COLOR.pencil }}>
          {mission.title}
        </h1>
        <p className="mt-2 text-base" style={{ color: pencilAlpha("cc") }}>
          {mission.topic}
        </p>

        <HDCard variant="postIt" className="relative mt-8 p-6" decoration="tack">
          {/* Diploma mascot pointing at the share link — "this is the ticket to give kids" */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, x: 20, rotate: 16 }}
            animate={{ opacity: 1, x: 0, rotate: 10 }}
            transition={{ duration: 0.55, ease: "backOut", delay: 0.2 }}
            className="pointer-events-none absolute -top-14 -right-3 hidden sm:block"
          >
            <motion.div
              animate={{ rotate: [10, 14, 10], y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src="/scraped/features-2022_feature5_optimized.webp"
                alt=""
                width={100}
                height={100}
                style={{ filter: "drop-shadow(3px 4px 0 rgba(0,0,0,0.15))" }}
              />
            </motion.div>
          </motion.div>

          <div
            className="text-sm"
            style={{ ...KALAM, color: COLOR.red, fontSize: "1rem" }}
          >
            Class link
          </div>
          <div className="mt-2 flex items-center gap-2">
            <code
              className="flex-1 truncate px-3 py-2 text-sm border-2"
              style={{
                backgroundColor: "white",
                borderColor: COLOR.pencil,
                borderRadius: RADIUS.input,
                color: COLOR.pencil,
              }}
            >
              {shareUrl}
            </code>
            <HDButton
              variant="primary"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? (
                <>
                  <CheckCheck size={16} strokeWidth={2.5} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={16} strokeWidth={2.5} />
                  Copy
                </>
              )}
            </HDButton>
          </div>
          <p
            className="mt-3 text-xs"
            style={{ color: pencilAlpha("cc") }}
          >
            Drop this in Google Classroom. Kids open it, type a display name, and start.
          </p>
        </HDCard>

        {mission.knowledge_base_text && (
          <HDCard className="mt-8 p-6">
            <div
              className="flex items-center gap-2 text-sm"
              style={{ ...KALAM, color: COLOR.pencil }}
            >
              <FileText size={16} strokeWidth={2.5} color={COLOR.red} />
              Knowledge base
            </div>
            <pre
              className="mt-2 whitespace-pre-wrap text-sm"
              style={{ color: pencilAlpha("cc") }}
            >
              {mission.knowledge_base_text}
            </pre>
          </HDCard>
        )}
      </div>
    </main>
  );
}
