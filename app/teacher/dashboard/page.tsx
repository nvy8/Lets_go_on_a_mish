// TEMP HACKATHON DESIGN — uses ClassDojo IP — TODO: REPLACE BEFORE LAUNCH
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, ArrowLeft, FolderOpen } from "lucide-react";
import { HDCard } from "@/components/handdrawn/HDCard";
import { HDButton } from "@/components/handdrawn/HDButton";
import { HDInput, HDTextarea } from "@/components/handdrawn/HDInput";
import { COLOR, RADIUS, KALAM, pencilAlpha, PAPER_BG } from "@/lib/design-tokens";

type MissionRow = {
  id: string;
  title: string;
  topic: string;
  share_token: string;
  created_at: string;
};

export default function TeacherDashboard() {
  const router = useRouter();
  const [missions, setMissions] = useState<MissionRow[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [kb, setKb] = useState("");

  async function load() {
    const res = await fetch("/api/missions");
    if (res.status === 401) {
      router.push("/teacher/login");
      return;
    }
    const data = await res.json();
    setMissions(data.missions);
  }

  useEffect(() => {
    load();
  }, []);

  async function createMission(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, topic, knowledge_base_text: kb }),
    });
    setCreating(false);
    if (res.ok) {
      setTitle("");
      setTopic("");
      setKb("");
      setShowForm(false);
      load();
    }
  }

  async function logout() {
    await fetch("/api/teacher/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <main className="relative flex-1 overflow-hidden" style={PAPER_BG}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/scraped/page_homepage_sketch-lines.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.06]"
      />
      <div className="relative mx-auto w-full max-w-4xl px-6 py-12">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm hover:opacity-70"
              style={{ color: pencilAlpha("99") }}
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              home
            </Link>
            <h1 className="mt-2 text-4xl" style={{ ...KALAM, color: COLOR.pencil }}>
              Your Mishes
            </h1>
          </div>
          <button
            onClick={logout}
            className="text-sm underline hover:opacity-70"
            style={{ color: pencilAlpha("99") }}
          >
            Log out
          </button>
        </div>

        <div className="relative mt-8">
          {!showForm ? (
            <div className="relative inline-block">
              {/* Rocket peeking from behind the New Mish button */}
              <motion.div
                aria-hidden="true"
                initial={{ opacity: 0, x: -20, rotate: -20 }}
                animate={{ opacity: 1, x: 0, rotate: -12 }}
                transition={{ duration: 0.55, ease: "backOut", delay: 0.2 }}
                className="pointer-events-none absolute -top-6 -right-12"
              >
                <motion.div
                  animate={{ y: [0, -5, 0], rotate: [-12, -8, -12] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Image
                    src="/scraped/rocket_optimized.webp"
                    alt=""
                    width={56}
                    height={56}
                    style={{ filter: "drop-shadow(2px 3px 0 rgba(0,0,0,0.15))" }}
                  />
                </motion.div>
              </motion.div>
              <Link href="/teacher/missions/new">
                <HDButton variant="primary" size="md">
                  <Plus size={18} strokeWidth={3} />
                  New Mish
                </HDButton>
              </Link>
            </div>
          ) : (
            <HDCard className="p-6">
              <form onSubmit={createMission}>
                <h2 className="text-2xl" style={{ ...KALAM, color: COLOR.pencil }}>
                  Create a Mish
                </h2>
                <div className="mt-4 flex flex-col gap-3">
                  <HDInput
                    placeholder="Mish title (e.g. Year 6 — Transylvanian Churches)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="text-base"
                  />
                  <HDInput
                    placeholder="Research topic (e.g. Why did Transylvanian churches need defensive walls?)"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                    className="text-base"
                  />
                  <HDTextarea
                    placeholder="Knowledge base / lesson context (optional, paste anything)"
                    value={kb}
                    onChange={(e) => setKb(e.target.value)}
                    rows={4}
                    className="text-base"
                  />
                  <div className="flex gap-2">
                    <HDButton
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={creating}
                    >
                      {creating ? "Creating…" : "Create"}
                    </HDButton>
                    <HDButton
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </HDButton>
                  </div>
                </div>
              </form>
            </HDCard>
          )}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4">
          {missions === null && (
            <div style={{ color: pencilAlpha("99") }}>Loading…</div>
          )}
          {missions && missions.length === 0 && !showForm && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-8 text-center border-2 border-dashed"
              style={{
                borderColor: pencilAlpha("4d"),
                color: pencilAlpha("99"),
                borderRadius: RADIUS.card,
                backgroundColor: "white",
              }}
            >
              {/* Empty-state mascot: projector — "show your class something" */}
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                className="mx-auto mb-3"
                style={{ width: 120, height: 120 }}
              >
                <Image
                  src="/scraped/features-2022_feature5_optimized.webp"
                  alt=""
                  width={120}
                  height={120}
                  style={{
                    filter: "drop-shadow(3px 4px 0 rgba(0,0,0,0.12))",
                    margin: "0 auto",
                  }}
                />
              </motion.div>
              <div className="text-lg" style={{ ...KALAM, color: COLOR.pencil }}>
                No Mishes yet
              </div>
              <div className="mt-1 text-sm" style={{ color: pencilAlpha("99") }}>
                Tap <b>New Mish</b> to send your class on their first one.
              </div>
              <div className="sr-only">
                <FolderOpen size={32} strokeWidth={2.5} />
              </div>
            </motion.div>
          )}
          {missions?.map((m, i) => {
            const tilt = i % 3 === 0 ? "rotate-1" : i % 3 === 1 ? "-rotate-1" : "";
            return (
              <Link
                key={m.id}
                href={`/teacher/missions/${m.id}`}
                className={`block transition-transform duration-100 hover:-translate-y-[2px] ${tilt}`}
              >
                <HDCard className="p-5">
                  <div
                    className="text-xs font-mono"
                    style={{ color: pencilAlpha("99") }}
                  >
                    {new Date(m.created_at).toLocaleString()}
                  </div>
                  <div
                    className="mt-1 text-xl"
                    style={{ ...KALAM, color: COLOR.pencil }}
                  >
                    {m.title}
                  </div>
                  <div
                    className="mt-1 text-sm"
                    style={{ color: pencilAlpha("cc") }}
                  >
                    {m.topic}
                  </div>
                </HDCard>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
