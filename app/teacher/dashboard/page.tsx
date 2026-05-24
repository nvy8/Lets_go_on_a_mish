"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
    <main className="flex-1" style={PAPER_BG}>
      <div className="mx-auto w-full max-w-4xl px-6 py-12">
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
              Your missions
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

        <div className="mt-8">
          {!showForm ? (
            <HDButton variant="primary" size="md" onClick={() => setShowForm(true)}>
              <Plus size={18} strokeWidth={3} />
              New mission
            </HDButton>
          ) : (
            <HDCard className="p-6">
              <form onSubmit={createMission}>
                <h2 className="text-2xl" style={{ ...KALAM, color: COLOR.pencil }}>
                  Create a mission
                </h2>
                <div className="mt-4 flex flex-col gap-3">
                  <HDInput
                    placeholder="Mission title (e.g. Year 6 — Transylvanian Churches)"
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
            <div
              className="p-8 text-center border-2 border-dashed"
              style={{
                borderColor: pencilAlpha("4d"),
                color: pencilAlpha("99"),
                borderRadius: RADIUS.card,
                backgroundColor: "white",
              }}
            >
              <FolderOpen
                size={32}
                strokeWidth={2.5}
                color={pencilAlpha("66")}
                className="mx-auto mb-2"
              />
              No missions yet. Create your first one.
            </div>
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
