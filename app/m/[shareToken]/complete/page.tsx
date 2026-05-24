"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Download, Pin, FileText, Globe, Sparkles } from "lucide-react";
import { generatePDF } from "@/lib/pdf";
import { HDCard } from "@/components/handdrawn/HDCard";
import { HDButton } from "@/components/handdrawn/HDButton";
import {
  COLOR,
  RADIUS,
  SHADOW,
  KALAM,
  pencilAlpha,
  PAPER_BG,
} from "@/lib/design-tokens";

type ExportData = {
  display_name: string;
  mission: { title: string; topic: string };
  refined_query: string | null;
  badges: string[];
  sources: Array<{ url: string; title: string; domain: string }>;
  facts: Array<{ fact: string; explanation?: string; grade?: string }>;
  hallucination_score?: { correct: number; total: number };
  source_score?: { agree: number; total: number };
};

// Confetti — colored, rotated rectangles scattered behind the hero
const CONFETTI_COLORS = [
  COLOR.red,
  COLOR.blue,
  COLOR.postIt,
  COLOR.postItGreen,
  COLOR.postItPink,
];

function Confetti({ count = 24 }: { count?: number }) {
  // deterministic pseudo-random so SSR/CSR match
  const items = Array.from({ length: count }, (_, i) => {
    const seed = (i * 9301 + 49297) % 233280;
    const r = seed / 233280;
    return {
      left: (r * 100) % 100,
      top: ((r * 731) % 100),
      rotate: ((r * 360) % 360),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: (i % 8) * 0.08,
      size: 8 + ((i * 3) % 10),
    };
  });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((c, i) => (
        <motion.div
          key={i}
          initial={{ y: -40, opacity: 0, rotate: 0 }}
          animate={{ y: 0, opacity: 1, rotate: c.rotate }}
          transition={{
            duration: 0.9,
            delay: c.delay,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            left: `${c.left}%`,
            top: `${c.top}%`,
            width: c.size,
            height: c.size * 0.45,
            backgroundColor: c.color,
            border: `2px solid ${COLOR.pencil}`,
            borderRadius: "2px",
          }}
        />
      ))}
    </div>
  );
}

export default function CompletePage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = use(params);
  const [data, setData] = useState<ExportData | null>(null);

  useEffect(() => {
    fetch("/api/export")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <main
        className="flex flex-1 items-center justify-center p-12"
        style={PAPER_BG}
      >
        <div style={{ ...KALAM, color: pencilAlpha("99") }}>
          Loading your brief…
        </div>
      </main>
    );
  }

  if (!data.mission) {
    return (
      <main
        className="flex flex-1 items-center justify-center p-12"
        style={PAPER_BG}
      >
        <HDCard variant="postItPink" className="p-6 max-w-md">
          Couldn&apos;t load your session.{" "}
          <Link
            href={`/m/${shareToken}`}
            className="underline"
            style={{ color: COLOR.red }}
          >
            Restart →
          </Link>
        </HDCard>
      </main>
    );
  }

  return (
    <main className="relative flex-1 overflow-hidden" style={PAPER_BG}>
      {/* Background sketch-lines doodle — large, faded, fixed behind everything */}
      <img
        src="/scraped/page_homepage_sketch-lines.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.08]"
      />

      <div className="relative mx-auto w-full max-w-3xl px-6 py-12">
        {/* ─── HERO ─────────────────────────────────────────── */}
        <section className="relative">
          <Confetti count={28} />

          <div className="relative flex flex-col items-center text-center">
            {/* Main mascot — bobs */}
            <motion.div
              initial={{ y: -20, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "backOut" }}
              className="relative"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Image
                  src="/scraped/b6d416364f65e5736c57c3d7250aa238_b62bf_bottom-section-mascots.webp"
                  alt="Mojo mascots celebrating"
                  width={360}
                  height={220}
                  priority
                  className="drop-shadow-lg"
                  style={{
                    filter: "drop-shadow(4px 6px 0 rgba(0,0,0,0.15))",
                    objectFit: "contain",
                  }}
                />
              </motion.div>

              {/* Tiny sparkles near the mascot */}
              <motion.div
                className="absolute -top-2 -right-4"
                animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              >
                <Sparkles size={28} color={COLOR.red} strokeWidth={2.5} />
              </motion.div>
              <motion.div
                className="absolute -bottom-1 -left-6"
                animate={{ rotate: [0, -15, 10, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: 0.4 }}
              >
                <Sparkles size={22} color={COLOR.blue} strokeWidth={2.5} />
              </motion.div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-2 text-6xl leading-tight sm:text-7xl"
              style={{ ...KALAM, color: COLOR.red }}
            >
              Mish complete!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="mt-3 text-xl"
              style={{ ...KALAM, color: pencilAlpha("cc") }}
            >
              Nice work,{" "}
              <span style={{ color: COLOR.blue }}>{data.display_name}</span>
              {" "}— you cracked it.
            </motion.p>
          </div>
        </section>

        {/* ─── BADGES ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="relative mt-12"
        >
          {/* Little badge mascot peeks out from behind the card */}
          <div
            aria-hidden="true"
            className="absolute -right-4 -top-12 z-10 hidden sm:block"
            style={{ transform: "rotate(12deg)" }}
          >
            <img
              src="/scraped/user-badges_student.svg"
              alt=""
              width={80}
              height={80}
            />
          </div>

          <HDCard variant="postIt" className="p-6 text-center" decoration="tape">
            <div
              className="text-base"
              style={{ ...KALAM, color: COLOR.red, fontSize: "1.1rem" }}
            >
              Badges earned
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {data.badges.length === 0 && (
                <span
                  className="text-sm"
                  style={{ color: pencilAlpha("99") }}
                >
                  No badges this run
                </span>
              )}
              {data.badges.map((b, i) => {
                const tilt = i % 2 === 0 ? "rotate(2deg)" : "rotate(-2.5deg)";
                return (
                  <motion.span
                    key={b}
                    initial={{ opacity: 0, y: 12, scale: 0.7, rotate: 0 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      rotate: i % 2 === 0 ? 2 : -2.5,
                    }}
                    transition={{
                      duration: 0.45,
                      delay: 0.8 + i * 0.12,
                      ease: "backOut",
                    }}
                    whileHover={{ scale: 1.08, rotate: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-2 border-[3px]"
                    style={{
                      ...KALAM,
                      backgroundColor: "white",
                      color: COLOR.pencil,
                      borderColor: COLOR.pencil,
                      borderRadius: RADIUS.chip,
                      boxShadow: SHADOW.sm,
                      transform: tilt,
                    }}
                  >
                    <Image
                      src="/scraped/user-badges_student.svg"
                      alt=""
                      width={22}
                      height={22}
                    />
                    {b}
                  </motion.span>
                );
              })}
            </div>
          </HDCard>
        </motion.div>

        {/* ─── RESEARCH QUESTION + FACTS ───────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.85 }}
        >
          <HDCard className="mt-8 p-6">
            <div
              className="flex items-center gap-2"
              style={{ ...KALAM, color: COLOR.red, fontSize: "1rem" }}
            >
              <Pin size={16} strokeWidth={2.5} />
              Research question
            </div>
            <div
              className="mt-1 text-lg"
              style={{ ...KALAM, color: COLOR.pencil }}
            >
              {data.refined_query || data.mission.topic}
            </div>

            <div
              className="mt-6 flex items-center gap-2"
              style={{ ...KALAM, color: COLOR.red, fontSize: "1rem" }}
            >
              <FileText size={16} strokeWidth={2.5} />
              {data.facts.length} verified facts
            </div>

            <ul className="mt-3 grid gap-3">
              {data.facts.map((f, i) => {
                const tiltDeg = i % 3 === 0 ? -1 : i % 3 === 1 ? 1.2 : -0.6;
                const bg =
                  i % 3 === 0
                    ? COLOR.postItGreen
                    : i % 3 === 1
                    ? COLOR.postIt
                    : COLOR.postItPink;
                return (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: 1 + i * 0.08,
                    }}
                    className="p-4 border-[3px]"
                    style={{
                      backgroundColor: bg,
                      borderColor: COLOR.pencil,
                      borderRadius: RADIUS.sticky,
                      boxShadow: SHADOW.sm,
                      transform: `rotate(${tiltDeg}deg)`,
                      color: COLOR.pencil,
                    }}
                  >
                    <div className="text-base">
                      <b style={{ ...KALAM, color: COLOR.red }}>{i + 1}.</b>{" "}
                      {f.fact}
                    </div>
                    {f.explanation && (
                      <div
                        className="mt-2 text-sm italic"
                        style={{ color: pencilAlpha("aa") }}
                      >
                        &ldquo;{f.explanation}&rdquo;
                      </div>
                    )}
                  </motion.li>
                );
              })}
            </ul>

            <div
              className="mt-8 flex items-center gap-2"
              style={{ ...KALAM, color: COLOR.red, fontSize: "1rem" }}
            >
              <Globe size={16} strokeWidth={2.5} />
              Sources
            </div>
            <ul className="mt-2 space-y-2 text-sm">
              {data.sources.map((s, i) => (
                <li key={i} style={{ color: COLOR.pencil }}>
                  <b style={{ ...KALAM, color: COLOR.red }}>[{i + 1}]</b>{" "}
                  {s.title}
                  <div className="text-xs" style={{ color: COLOR.blue }}>
                    {s.url}
                  </div>
                </li>
              ))}
            </ul>
          </HDCard>
        </motion.div>

        {/* ─── CTA ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          className="relative mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
        >
          {/* Rocket — wiggles next to the CTA */}
          <motion.div
            animate={{ y: [0, -6, 0], rotate: [-4, 4, -4] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            className="hidden sm:block"
          >
            <Image
              src="/scraped/rocket_optimized.webp"
              alt=""
              width={72}
              height={72}
            />
          </motion.div>

          <HDButton
            variant="primary"
            size="lg"
            onClick={() => generatePDF(data)}
          >
            <Download size={22} strokeWidth={2.5} />
            Download Research Brief (PDF)
          </HDButton>

          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border-[3px] border-dashed"
            style={{
              ...KALAM,
              borderColor: pencilAlpha("66"),
              color: pencilAlpha("cc"),
              borderRadius: RADIUS.button,
            }}
          >
            Back to start
          </Link>
        </motion.div>

        <p
          className="mt-14 text-center text-xs"
          style={{ color: pencilAlpha("99") }}
        >
          Drag this PDF into your Google Classroom project assignment.
        </p>
      </div>
    </main>
  );
}
