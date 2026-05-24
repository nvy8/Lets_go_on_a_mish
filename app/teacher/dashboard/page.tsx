"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  ArrowLeft,
  FolderOpen,
  Folder,
  FilePlus2,
  Calendar,
  Archive,
} from "lucide-react";
import { HDCard } from "@/components/handdrawn/HDCard";
import { HDButton } from "@/components/handdrawn/HDButton";
import { HDInput, HDTextarea } from "@/components/handdrawn/HDInput";
import { COLOR, RADIUS, SHADOW, KALAM, pencilAlpha, PAPER_BG } from "@/lib/design-tokens";

type MissionRow = {
  id: string;
  title: string;
  topic: string;
  share_token: string;
  created_at: string;
  project_id: string | null;
  position: number | null;
  week_number: number | null;
};

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  week_count: number | null;
  archived_at: string | null;
  created_at: string;
  mission_count: number;
};

type CreateMode = null | "project" | "mission";

export default function TeacherDashboard() {
  const router = useRouter();
  const [missions, setMissions] = useState<MissionRow[] | null>(null);
  const [projects, setProjects] = useState<ProjectRow[] | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>(null);
  const [creating, setCreating] = useState(false);

  // Mission form
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [kb, setKb] = useState("");
  const [missionProjectId, setMissionProjectId] = useState("");

  // Project form
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projWeeks, setProjWeeks] = useState("");

  async function load() {
    const [mRes, pRes] = await Promise.all([
      fetch("/api/missions", { cache: "no-store" }),
      fetch(`/api/projects${showArchived ? "?archived=1" : ""}`, { cache: "no-store" }),
    ]);
    if (mRes.status === 401 || pRes.status === 401) {
      router.replace("/teacher/login");
      return;
    }
    const mData = await mRes.json();
    const pData = await pRes.json();
    setMissions(mData.missions);
    setProjects(pData.projects);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived]);

  async function createMission(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const body: Record<string, unknown> = { title, topic, knowledge_base_text: kb };
      if (missionProjectId) body.project_id = missionProjectId;
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setTitle("");
        setTopic("");
        setKb("");
        setMissionProjectId("");
        setCreateMode(null);
        await load();
      }
    } finally {
      setCreating(false);
    }
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const body: Record<string, unknown> = { name: projName };
      if (projDesc.trim()) body.description = projDesc.trim();
      if (projWeeks && Number(projWeeks) > 0) body.week_count = Number(projWeeks);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setProjName("");
        setProjDesc("");
        setProjWeeks("");
        setCreateMode(null);
        // Jump straight to the new project so the teacher can fill it with missions.
        router.push(`/teacher/projects/${data.projectId}`);
      }
    } finally {
      setCreating(false);
    }
  }

  async function logout() {
    await fetch("/api/teacher/logout", { method: "POST" });
    router.push("/");
  }

  const standalone = (missions || []).filter((m) => !m.project_id);
  const inProjects = (missions || []).filter((m) => !!m.project_id);

  const isLoading = missions === null || projects === null;
  const everythingEmpty =
    !isLoading && (missions?.length ?? 0) === 0 && (projects?.length ?? 0) === 0;

  return (
    <main className="flex-1" style={PAPER_BG}>
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        {/* Header */}
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
            <p className="mt-1 text-sm" style={{ color: pencilAlpha("99") }}>
              Group missions into <b>projects</b> for multi-week units, or run them
              standalone.
            </p>
          </div>
          <button
            onClick={logout}
            className="text-sm underline hover:opacity-70"
            style={{ color: pencilAlpha("99") }}
          >
            Log out
          </button>
        </div>

        {/* Create actions */}
        <div className="mt-8 flex flex-wrap gap-2">
          {createMode !== "mission" && (
            <HDButton
              variant="primary"
              size="md"
              onClick={() => setCreateMode(createMode === "project" ? null : "project")}
            >
              <Folder size={18} strokeWidth={3} />
              {createMode === "project" ? "Cancel" : "New project"}
            </HDButton>
          )}
          {createMode !== "project" && (
            <HDButton
              variant="secondary"
              size="md"
              onClick={() => setCreateMode(createMode === "mission" ? null : "mission")}
            >
              <FilePlus2 size={18} strokeWidth={3} />
              {createMode === "mission" ? "Cancel" : "New mission"}
            </HDButton>
          )}
        </div>

        {/* Project create form */}
        {createMode === "project" && (
          <HDCard className="mt-4 p-6">
            <form onSubmit={createProject}>
              <h2 className="text-2xl" style={{ ...KALAM, color: COLOR.pencil }}>
                Create a project
              </h2>
              <p className="mt-1 text-sm" style={{ color: pencilAlpha("cc") }}>
                A project is a folder of missions — useful for multi-week units like
                <i> Year 6 — Geography, 6 weeks</i>.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <HDInput
                  placeholder="Project name (e.g. Year 6 Geography)"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  required
                  className="text-base"
                />
                <HDTextarea
                  placeholder="Optional description"
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  rows={2}
                  className="text-base"
                />
                <HDInput
                  type="number"
                  min={1}
                  max={52}
                  placeholder="How many weeks does it span? (optional)"
                  value={projWeeks}
                  onChange={(e) => setProjWeeks(e.target.value)}
                  className="text-base"
                />
                <div>
                  <HDButton type="submit" variant="primary" size="md" disabled={creating}>
                    {creating ? "Creating…" : "Create project"}
                  </HDButton>
                </div>
              </div>
            </form>
          </HDCard>
        )}

        {/* Mission create form */}
        {createMode === "mission" && (
          <HDCard className="mt-4 p-6">
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
                  placeholder="Knowledge base / lesson context (optional)"
                  value={kb}
                  onChange={(e) => setKb(e.target.value)}
                  rows={3}
                  className="text-base"
                />
                <label
                  className="text-sm"
                  style={{ ...KALAM, color: COLOR.pencil }}
                >
                  Add to a project (optional)
                </label>
                <select
                  value={missionProjectId}
                  onChange={(e) => setMissionProjectId(e.target.value)}
                  className="px-3 py-2 text-base border-[3px]"
                  style={{
                    ...KALAM,
                    borderColor: COLOR.pencil,
                    borderRadius: RADIUS.input,
                    backgroundColor: "white",
                    color: COLOR.pencil,
                    boxShadow: SHADOW.sm,
                  }}
                >
                  <option value="">— Standalone (no project) —</option>
                  {(projects || [])
                    .filter((p) => !p.archived_at)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.week_count ? ` · ${p.week_count}-week` : ""} ·{" "}
                        {p.mission_count} mission{p.mission_count === 1 ? "" : "s"}
                      </option>
                    ))}
                </select>
                <div>
                  <HDButton type="submit" variant="primary" size="md" disabled={creating}>
                    {creating ? "Creating…" : "Create mission"}
                  </HDButton>
                </div>
              </div>
            </form>
          </HDCard>
        )}

        {/* Empty state */}
        {everythingEmpty && !createMode && (
          <div
            className="mt-10 p-10 text-center border-2 border-dashed"
            style={{
              borderColor: pencilAlpha("4d"),
              color: pencilAlpha("99"),
              borderRadius: RADIUS.card,
              backgroundColor: "white",
            }}
          >
            <FolderOpen
              size={48}
              strokeWidth={2.5}
              color={pencilAlpha("66")}
              className="mx-auto mb-3"
            />
            <div className="text-lg" style={{ ...KALAM, color: COLOR.pencil }}>
              No projects or missions yet.
            </div>
            <div className="mt-1 text-sm">
              Start with a <b>project</b> for a multi-week unit, or a single{" "}
              <b>mission</b> for a one-off lesson.
            </div>
          </div>
        )}

        {/* Projects section */}
        {projects && projects.length > 0 && (
          <section className="mt-10">
            <div className="flex items-end justify-between gap-3">
              <h2
                className="flex items-center gap-2 text-2xl"
                style={{ ...KALAM, color: COLOR.pencil }}
              >
                <Folder size={24} strokeWidth={2.5} color={COLOR.red} />
                Your projects
              </h2>
              <button
                onClick={() => setShowArchived((v) => !v)}
                className="inline-flex items-center gap-1 text-xs underline hover:opacity-70"
                style={{ color: pencilAlpha("99") }}
              >
                <Archive size={12} strokeWidth={2.5} />
                {showArchived ? "Hide archived" : "Show archived"}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((p, i) => {
                const tilt = i % 2 === 0 ? "rotate-[0.6deg]" : "-rotate-[0.6deg]";
                return (
                  <Link
                    key={p.id}
                    href={`/teacher/projects/${p.id}`}
                    className={`block transition-transform duration-100 hover:-translate-y-[2px] ${tilt}`}
                  >
                    <HDCard
                      variant={p.archived_at ? "muted" : "postIt"}
                      className="p-5"
                      decoration={p.archived_at ? "none" : "tack"}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div
                            className="text-xs"
                            style={{ ...KALAM, color: COLOR.red }}
                          >
                            {p.archived_at ? "Archived project" : "Project"}
                            {p.week_count ? (
                              <>
                                {" · "}
                                <Calendar
                                  size={11}
                                  strokeWidth={2.5}
                                  className="inline-block"
                                />{" "}
                                {p.week_count}-week
                              </>
                            ) : null}
                          </div>
                          <div
                            className="mt-0.5 text-xl"
                            style={{ ...KALAM, color: COLOR.pencil }}
                          >
                            {p.name}
                          </div>
                          {p.description && (
                            <div
                              className="mt-1 text-sm line-clamp-2"
                              style={{ color: pencilAlpha("cc") }}
                            >
                              {p.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div
                        className="mt-3 inline-flex items-center gap-2 px-2 py-1 text-xs border-2"
                        style={{
                          ...KALAM,
                          backgroundColor: "white",
                          color: COLOR.pencil,
                          borderColor: COLOR.pencil,
                          borderRadius: RADIUS.chip,
                        }}
                      >
                        {p.mission_count} mission{p.mission_count === 1 ? "" : "s"}
                      </div>
                    </HDCard>
                  </Link>
                );
              })}
            </div>
            {inProjects.length > 0 && (
              <p
                className="mt-3 text-xs"
                style={{ color: pencilAlpha("99") }}
              >
                {inProjects.length} mission{inProjects.length === 1 ? "" : "s"} live across
                your projects. Open a project to see its missions and per-mission roster.
              </p>
            )}
          </section>
        )}

        {/* Standalone missions section */}
        <section className="mt-10">
          <h2
            className="flex items-center gap-2 text-2xl"
            style={{ ...KALAM, color: COLOR.pencil }}
          >
            <FilePlus2 size={24} strokeWidth={2.5} color={COLOR.red} />
            Standalone missions
          </h2>
          {isLoading && (
            <div className="mt-3" style={{ color: pencilAlpha("99") }}>
              Loading…
            </div>
          )}
          {!isLoading && standalone.length === 0 && (
            <div
              className="mt-3 p-6 border-2 border-dashed text-sm"
              style={{
                borderColor: pencilAlpha("4d"),
                color: pencilAlpha("99"),
                borderRadius: RADIUS.cardSm,
                backgroundColor: "white",
              }}
            >
              No standalone missions. Standalone missions live outside any project — useful
              for one-off lessons.
            </div>
          )}
          {standalone.length > 0 && (
            <div className="mt-3 grid grid-cols-1 gap-3">
              {standalone.map((m, i) => {
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
          )}
        </section>
      </div>
    </main>
  );
}
