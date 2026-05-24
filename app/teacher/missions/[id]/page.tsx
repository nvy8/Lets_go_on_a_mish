"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  CheckCheck,
  FileText,
  Folder,
  X,
  Pencil as PencilIcon,
} from "lucide-react";
import { HDCard } from "@/components/handdrawn/HDCard";
import { HDButton } from "@/components/handdrawn/HDButton";
import { StudentsSection } from "@/components/teacher/StudentsSection";
import { COLOR, RADIUS, SHADOW, KALAM, pencilAlpha, PAPER_BG } from "@/lib/design-tokens";

type Mission = {
  id: string;
  title: string;
  topic: string;
  knowledge_base_text?: string;
  share_token: string;
  created_at: string;
  project_id: string | null;
  position: number | null;
  week_number: number | null;
  project: { id: string; name: string } | null;
};

type ProjectOption = {
  id: string;
  name: string;
  week_count: number | null;
};

export default function MissionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [mission, setMission] = useState<Mission | null>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [copied, setCopied] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [weekNum, setWeekNum] = useState<string>("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const r = await fetch(`/api/missions/${id}`, { cache: "no-store" });
    if (r.status === 401) return router.replace("/teacher/login");
    if (!r.ok) return;
    const data = await r.json();
    setMission(data.mission);
    setSelectedProjectId(data.mission.project_id || "");
    setWeekNum(data.mission.week_number?.toString() ?? "");
  }

  useEffect(() => {
    load();
    fetch("/api/projects", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { projects: [] }))
      .then((d) => setProjects(d.projects || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveAssignment(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      body.project_id = selectedProjectId || null;
      if (weekNum && Number(weekNum) > 0) body.week_number = Number(weekNum);
      else if (!weekNum) body.week_number = null;
      const res = await fetch(`/api/missions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowAssign(false);
        await load();
      }
    } finally {
      setSaving(false);
    }
  }

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
    <main className="flex-1" style={PAPER_BG}>
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <Link
          href={
            mission.project_id
              ? `/teacher/projects/${mission.project_id}`
              : "/teacher/dashboard"
          }
          className="inline-flex items-center gap-1 text-sm hover:opacity-70"
          style={{ color: pencilAlpha("99") }}
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          {mission.project_id && mission.project ? mission.project.name : "all Mishes"}
        </Link>

        {/* Project chip — visible above the H1 if this mission belongs to a project */}
        {mission.project && (
          <Link
            href={`/teacher/projects/${mission.project.id}`}
            className="mt-3 inline-flex items-center gap-2 px-3 py-1 text-sm border-2 hover:opacity-80"
            style={{
              ...KALAM,
              backgroundColor: COLOR.postIt,
              color: COLOR.pencil,
              borderColor: COLOR.pencil,
              borderRadius: RADIUS.tag,
              boxShadow: SHADOW.sm,
            }}
          >
            <Folder size={14} strokeWidth={2.5} color={COLOR.red} />
            Part of: {mission.project.name}
            {mission.week_number ? ` · Week ${mission.week_number}` : ""}
            {mission.position ? ` · #${mission.position}` : ""}
          </Link>
        )}

        <h1 className="mt-3 text-4xl" style={{ ...KALAM, color: COLOR.pencil }}>
          {mission.title}
        </h1>
        <p className="mt-2 text-base" style={{ color: pencilAlpha("cc") }}>
          {mission.topic}
        </p>

        {/* Assign-to-project action */}
        <div className="mt-4">
          <button
            onClick={() => setShowAssign((v) => !v)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border-2 border-dashed hover:opacity-70"
            style={{
              ...KALAM,
              backgroundColor: "transparent",
              color: pencilAlpha("cc"),
              borderColor: pencilAlpha("66"),
              borderRadius: RADIUS.buttonSm,
            }}
          >
            <PencilIcon size={14} strokeWidth={2.5} />
            {mission.project ? "Move to another project / detach" : "Add to a project"}
          </button>
        </div>

        {showAssign && (
          <HDCard className="mt-3 p-5">
            <form onSubmit={saveAssignment}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg" style={{ ...KALAM, color: COLOR.pencil }}>
                  Project membership
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAssign(false)}
                  aria-label="Close"
                  className="hover:opacity-70"
                  style={{ color: pencilAlpha("99") }}
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>
              <p
                className="mt-1 text-xs"
                style={{ color: pencilAlpha("99") }}
              >
                Pick &ldquo;Standalone&rdquo; to remove this Mish from its current
                project. The Mish and its sessions are preserved either way.
              </p>
              <div className="mt-3 flex flex-col gap-3">
                <label
                  className="text-sm"
                  style={{ ...KALAM, color: COLOR.pencil }}
                >
                  Project
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
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
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.week_count ? ` · ${p.week_count}-week` : ""}
                    </option>
                  ))}
                </select>
                {selectedProjectId && (
                  <>
                    <label
                      className="text-sm"
                      style={{ ...KALAM, color: COLOR.pencil }}
                    >
                      Week number (optional)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={
                        projects.find((p) => p.id === selectedProjectId)?.week_count ?? 52
                      }
                      value={weekNum}
                      onChange={(e) => setWeekNum(e.target.value)}
                      placeholder="e.g. 2"
                      className="px-3 py-2 text-base border-[3px]"
                      style={{
                        borderColor: COLOR.pencil,
                        borderRadius: RADIUS.input,
                        backgroundColor: "white",
                        color: COLOR.pencil,
                        boxShadow: SHADOW.sm,
                      }}
                    />
                  </>
                )}
                <div>
                  <HDButton type="submit" variant="primary" size="md" disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                  </HDButton>
                </div>
              </div>
            </form>
          </HDCard>
        )}

        <HDCard variant="postIt" className="mt-8 p-6" decoration="tack">
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

        <StudentsSection missionId={id} />
      </div>
    </main>
  );
}
