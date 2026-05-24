"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Users,
  Trophy,
  Activity,
  Award,
  Calendar,
  Pencil,
  Archive,
  Trash2,
  ExternalLink,
  Folder,
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
  position: number | null;
  week_number: number | null;
  joined: number;
  completed: number;
  active_now: number;
  total_badges: number;
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  week_count: number | null;
  archived_at: string | null;
  created_at: string;
};

type Summary = {
  missions_count: number;
  total_joined: number;
  total_completed: number;
  total_active_now: number;
  total_badges: number;
};

type ApiResp = {
  project: Project;
  missions: MissionRow[];
  summary: Summary;
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<ApiResp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddMission, setShowAddMission] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editWeeks, setEditWeeks] = useState<string>("");
  const [working, setWorking] = useState(false);

  // new mission inputs
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [kb, setKb] = useState("");
  const [weekNum, setWeekNum] = useState<string>("");

  async function load() {
    const res = await fetch(`/api/projects/${id}`, { cache: "no-store" });
    if (res.status === 401) {
      router.replace("/teacher/login");
      return;
    }
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || `HTTP ${res.status}`);
      return;
    }
    const d: ApiResp = await res.json();
    setData(d);
    setEditName(d.project.name);
    setEditDesc(d.project.description ?? "");
    setEditWeeks(d.project.week_count?.toString() ?? "");
    setError(null);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function addMission(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          topic,
          knowledge_base_text: kb,
          project_id: id,
          ...(weekNum ? { week_number: Number(weekNum) } : {}),
        }),
      });
      if (res.ok) {
        setTitle("");
        setTopic("");
        setKb("");
        setWeekNum("");
        setShowAddMission(false);
        await load();
      }
    } finally {
      setCreating(false);
    }
  }

  async function saveProjectEdit(e: React.FormEvent) {
    e.preventDefault();
    setWorking(true);
    try {
      const body: Record<string, unknown> = { name: editName.trim() };
      if (editDesc.trim() !== (data?.project.description ?? "")) {
        body.description = editDesc.trim();
      }
      const weeksNum = editWeeks ? Number(editWeeks) : null;
      if (weeksNum && weeksNum > 0) body.week_count = weeksNum;
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowEdit(false);
        await load();
      }
    } finally {
      setWorking(false);
    }
  }

  async function archiveProject() {
    if (!confirm("Archive this project? Its missions stay live and reachable for kids; the project just hides from your default list.")) return;
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: true }),
    });
    router.push("/teacher/dashboard");
  }

  async function deleteProject() {
    if (
      !confirm(
        "Delete this project? Its missions stay (they become standalone missions). This cannot be undone for the project itself."
      )
    )
      return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    router.push("/teacher/dashboard");
  }

  async function detachMission(missionId: string) {
    if (!confirm("Remove this mission from the project? The mission stays — it just becomes a standalone mission.")) return;
    await fetch(`/api/missions/${missionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: null }),
    });
    await load();
  }

  if (error) {
    return (
      <main className="flex flex-1 items-center justify-center p-12" style={PAPER_BG}>
        <HDCard variant="postItPink" className="p-6 max-w-md">
          Couldn&apos;t load project: <b>{error}</b>
          <div className="mt-3">
            <Link
              href="/teacher/dashboard"
              className="underline"
              style={{ color: COLOR.red }}
            >
              Back to dashboard
            </Link>
          </div>
        </HDCard>
      </main>
    );
  }

  if (!data) {
    return (
      <main
        className="flex flex-1 items-center justify-center p-12"
        style={PAPER_BG}
      >
        <div style={{ ...KALAM, color: pencilAlpha("99") }}>Loading project…</div>
      </main>
    );
  }

  const { project, missions, summary } = data;
  const isArchived = !!project.archived_at;

  // Group missions by week_number if any have a week set; otherwise show flat.
  const anyWithWeek = missions.some((m) => m.week_number !== null);
  const groups: { label: string; items: MissionRow[] }[] = [];
  if (anyWithWeek) {
    const byWeek = new Map<number | null, MissionRow[]>();
    for (const m of missions) {
      const w = m.week_number ?? null;
      if (!byWeek.has(w)) byWeek.set(w, []);
      byWeek.get(w)!.push(m);
    }
    const weeks = [...byWeek.keys()].sort((a, b) => {
      if (a === null) return 1;
      if (b === null) return -1;
      return a - b;
    });
    for (const w of weeks) {
      groups.push({ label: w === null ? "Unscheduled" : `Week ${w}`, items: byWeek.get(w)! });
    }
  } else {
    groups.push({ label: "Missions", items: missions });
  }

  return (
    <main className="flex-1" style={PAPER_BG}>
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-1 text-sm hover:opacity-70"
          style={{ color: pencilAlpha("99") }}
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          dashboard
        </Link>

        {/* Header */}
        <div className="mt-3 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 text-xs border-2 mb-2"
              style={{
                ...KALAM,
                backgroundColor: isArchived ? COLOR.muted : COLOR.postIt,
                color: COLOR.pencil,
                borderColor: COLOR.pencil,
                borderRadius: RADIUS.tag,
              }}
            >
              <Folder size={14} strokeWidth={2.5} color={COLOR.red} />
              {isArchived ? "Archived project" : "Project"}
            </div>
            <h1 className="text-4xl" style={{ ...KALAM, color: COLOR.pencil }}>
              {project.name}
            </h1>
            {project.description && (
              <p
                className="mt-2 text-base"
                style={{ color: pencilAlpha("cc") }}
              >
                {project.description}
              </p>
            )}
            {project.week_count && (
              <div
                className="mt-2 inline-flex items-center gap-1 text-sm"
                style={{ color: pencilAlpha("99") }}
              >
                <Calendar size={14} strokeWidth={2.5} />
                {project.week_count}-week plan
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <HDButton variant="secondary" size="sm" onClick={() => setShowEdit(true)}>
              <Pencil size={14} strokeWidth={2.5} />
              Edit
            </HDButton>
            <HDButton variant="ghost" size="sm" onClick={archiveProject}>
              <Archive size={14} strokeWidth={2.5} />
              {isArchived ? "Already archived" : "Archive"}
            </HDButton>
            <button
              onClick={deleteProject}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs hover:opacity-70"
              style={{ ...KALAM, color: COLOR.red }}
            >
              <Trash2 size={12} strokeWidth={2.5} />
              Delete project
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Missions"
            value={summary.missions_count}
            icon={<Folder size={18} strokeWidth={2.5} color={COLOR.red} />}
          />
          <StatCard
            label="Kids joined"
            value={summary.total_joined}
            icon={<Users size={18} strokeWidth={2.5} color={COLOR.red} />}
          />
          <StatCard
            label="Completed"
            value={summary.total_completed}
            icon={<Trophy size={18} strokeWidth={2.5} color={COLOR.red} />}
            variant={summary.total_completed > 0 ? "postIt" : "default"}
          />
          <StatCard
            label="Active now"
            value={summary.total_active_now}
            icon={<Activity size={18} strokeWidth={2.5} color={COLOR.red} />}
            variant={summary.total_active_now > 0 ? "postItGreen" : "default"}
            subtitle="last 2 min"
          />
        </div>

        {/* Edit form */}
        {showEdit && (
          <HDCard className="mt-6 p-6">
            <form onSubmit={saveProjectEdit}>
              <h2 className="text-xl" style={{ ...KALAM, color: COLOR.pencil }}>
                Edit project
              </h2>
              <div className="mt-4 flex flex-col gap-3">
                <HDInput
                  placeholder="Project name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="text-base"
                />
                <HDTextarea
                  placeholder="Optional description (what this project is about)"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="text-base"
                />
                <HDInput
                  type="number"
                  min={1}
                  max={52}
                  placeholder="How many weeks? (optional)"
                  value={editWeeks}
                  onChange={(e) => setEditWeeks(e.target.value)}
                  className="text-base"
                />
                <div className="flex gap-2">
                  <HDButton type="submit" variant="primary" size="md" disabled={working}>
                    {working ? "Saving…" : "Save"}
                  </HDButton>
                  <HDButton
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => setShowEdit(false)}
                  >
                    Cancel
                  </HDButton>
                </div>
              </div>
            </form>
          </HDCard>
        )}

        {/* Add mission */}
        <div className="mt-8 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-2xl" style={{ ...KALAM, color: COLOR.pencil }}>
            Missions in this project
          </h2>
          {!showAddMission && (
            <HDButton variant="primary" size="md" onClick={() => setShowAddMission(true)}>
              <Plus size={18} strokeWidth={3} />
              Add mission
            </HDButton>
          )}
        </div>

        {showAddMission && (
          <HDCard className="mt-4 p-6">
            <form onSubmit={addMission}>
              <h3 className="text-xl" style={{ ...KALAM, color: COLOR.pencil }}>
                Add a mission to this project
              </h3>
              <div className="mt-4 flex flex-col gap-3">
                <HDInput
                  placeholder="Mission title (e.g. Lesson 1.1 — Maps and coordinates)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="text-base"
                />
                <HDInput
                  placeholder="Research topic (e.g. Why do some maps distort country sizes?)"
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
                <HDInput
                  type="number"
                  min={1}
                  max={project.week_count ?? 52}
                  placeholder={`Week number (1-${project.week_count ?? 52}, optional)`}
                  value={weekNum}
                  onChange={(e) => setWeekNum(e.target.value)}
                  className="text-base"
                />
                <div className="flex gap-2">
                  <HDButton type="submit" variant="primary" size="md" disabled={creating}>
                    {creating ? "Creating…" : "Create mission"}
                  </HDButton>
                  <HDButton
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => setShowAddMission(false)}
                  >
                    Cancel
                  </HDButton>
                </div>
              </div>
            </form>
          </HDCard>
        )}

        {/* Mission groups */}
        {missions.length === 0 && (
          <HDCard
            className="mt-6 p-10 text-center"
            style={{ borderStyle: "dashed", color: pencilAlpha("99") }}
          >
            <Folder
              size={48}
              strokeWidth={2.5}
              color={pencilAlpha("66")}
              className="mx-auto mb-3"
            />
            <div className="text-lg" style={{ ...KALAM, color: COLOR.pencil }}>
              No missions in this project yet.
            </div>
            <div className="mt-1 text-sm">
              Click <b>Add mission</b> above to create one. You can also reassign an existing
              mission to this project from its detail page.
            </div>
          </HDCard>
        )}

        {groups.map((g) => (
          <div key={g.label} className="mt-6">
            {(anyWithWeek || g.label !== "Missions") && (
              <h3
                className="flex items-center gap-2 text-lg"
                style={{ ...KALAM, color: COLOR.red, fontSize: "1.1rem" }}
              >
                <Calendar size={16} strokeWidth={2.5} />
                {g.label}
              </h3>
            )}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {g.items.map((m, i) => {
                const tilt = i % 2 === 0 ? "rotate-[0.5deg]" : "-rotate-[0.5deg]";
                return (
                  <div key={m.id} className={tilt}>
                    <HDCard className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-xs font-mono"
                            style={{ color: pencilAlpha("99") }}
                          >
                            {m.position ? `#${m.position}` : null}
                            {m.position && m.week_number ? " · " : null}
                            {m.week_number ? `Week ${m.week_number}` : null}
                          </div>
                          <div
                            className="mt-0.5 text-lg leading-tight"
                            style={{ ...KALAM, color: COLOR.pencil }}
                          >
                            {m.title}
                          </div>
                          <div
                            className="mt-1 text-sm line-clamp-2"
                            style={{ color: pencilAlpha("cc") }}
                          >
                            {m.topic}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                        <Stat label="Joined" value={m.joined} />
                        <Stat label="Done" value={m.completed} accent={m.completed > 0} />
                        <Stat
                          label="Active"
                          value={m.active_now}
                          accent={m.active_now > 0}
                        />
                        <Stat label="Badges" value={m.total_badges} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={`/teacher/missions/${m.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border-2"
                          style={{
                            ...KALAM,
                            backgroundColor: "white",
                            color: COLOR.pencil,
                            borderColor: COLOR.pencil,
                            borderRadius: RADIUS.buttonSm,
                            boxShadow: SHADOW.sm,
                          }}
                        >
                          Open
                          <ExternalLink size={12} strokeWidth={2.5} />
                        </Link>
                        <button
                          onClick={() => detachMission(m.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border-2 border-dashed"
                          style={{
                            ...KALAM,
                            backgroundColor: "transparent",
                            color: pencilAlpha("cc"),
                            borderColor: pencilAlpha("66"),
                            borderRadius: RADIUS.buttonSm,
                          }}
                        >
                          Remove from project
                        </button>
                      </div>
                    </HDCard>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  variant = "default",
  subtitle,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  variant?: "default" | "postIt" | "postItGreen";
  subtitle?: string;
}) {
  return (
    <HDCard variant={variant} className="p-4" size="sm">
      <div
        className="flex items-center gap-2 text-xs"
        style={{ ...KALAM, color: pencilAlpha("99") }}
      >
        {icon}
        {label}
      </div>
      <div className="mt-1 text-3xl" style={{ ...KALAM, color: COLOR.pencil }}>
        {value}
      </div>
      {subtitle && (
        <div className="mt-1 text-xs" style={{ color: pencilAlpha("99") }}>
          {subtitle}
        </div>
      )}
    </HDCard>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-1 px-2 py-0.5 border-2"
      style={{
        ...KALAM,
        backgroundColor: accent ? COLOR.postItGreen : "white",
        color: COLOR.pencil,
        borderColor: COLOR.pencil,
        borderRadius: RADIUS.chip,
        fontSize: "0.85rem",
      }}
    >
      <Award size={11} strokeWidth={2.5} color={COLOR.red} />
      {value} <span style={{ color: pencilAlpha("99") }}>{label}</span>
    </div>
  );
}
