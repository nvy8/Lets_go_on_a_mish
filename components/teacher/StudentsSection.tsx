"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Users,
  Trophy,
  Clock,
  Activity,
  RefreshCw,
  Download,
  Search,
  X,
  Award,
  Pin,
  TrendingUp,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { HDCard } from "@/components/handdrawn/HDCard";
import { HDButton } from "@/components/handdrawn/HDButton";
import { HDInput } from "@/components/handdrawn/HDInput";
import { COLOR, RADIUS, SHADOW, KALAM, pencilAlpha } from "@/lib/design-tokens";

type StudentRow = {
  session_id: string;
  display_name: string;
  current_stage: number;
  total_stages: number;
  completed: boolean;
  badges: string[];
  badges_count: number;
  refined_query: string | null;
  scores: {
    sources_picked_legit: number;
    sources_total: number;
    facts_triangulated: number;
    facts_total: number;
    explanations_meeting_plus: number;
    explanations_total: number;
    hallucinations_spotted: number;
    hallucinations_total: number;
  };
  time_on_task_ms: number;
  created_at: string;
  last_active_at: string;
  is_active_now: boolean;
};

type ClassSummary = {
  total_joined: number;
  completed: number;
  in_progress: number;
  active_now: number;
  avg_time_on_task_ms: number;
  median_time_on_task_ms: number;
  stage_distribution: number[];
  badge_distribution: Record<string, number>;
  most_recent_join_at: string | null;
};

type ApiResp = {
  mission: { id: string; title: string; share_token: string };
  students: StudentRow[];
  summary: ClassSummary;
};

type SortKey = "last_active" | "progress" | "name" | "time" | "badges";
type FilterStatus = "all" | "completed" | "in_progress" | "active_now";

const REFRESH_INTERVAL_MS = 20_000;
const STAGE_NAMES = [
  "—",
  "Sharpen question",
  "Investigate",
  "Triangulate",
  "Explain",
  "Spot fakes",
];

function formatDuration(ms: number): string {
  if (ms < 1000) return "<1s";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remSec = seconds % 60;
  if (minutes < 60) return remSec ? `${minutes}m ${remSec}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  return remMin ? `${hours}h ${remMin}m` : `${hours}h`;
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function toCsv(rows: StudentRow[]): string {
  const header = [
    "nickname",
    "current_stage",
    "completed",
    "badges_count",
    "badges",
    "refined_query",
    "sources_picked_legit",
    "facts_triangulated",
    "explanations_meeting_plus",
    "hallucinations_spotted",
    "time_on_task_seconds",
    "created_at",
    "last_active_at",
  ];
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.display_name,
        r.current_stage,
        r.completed,
        r.badges_count,
        r.badges.join("|"),
        r.refined_query,
        `${r.scores.sources_picked_legit}/${r.scores.sources_total}`,
        `${r.scores.facts_triangulated}/${r.scores.facts_total}`,
        `${r.scores.explanations_meeting_plus}/${r.scores.explanations_total}`,
        `${r.scores.hallucinations_spotted}/${r.scores.hallucinations_total}`,
        Math.round(r.time_on_task_ms / 1000),
        r.created_at,
        r.last_active_at,
      ]
        .map(escape)
        .join(","),
    );
  }
  return lines.join("\n");
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function StudentsSection({ missionId }: { missionId: string }) {
  const [data, setData] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("last_active");
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load(silent = false) {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch(`/api/missions/${missionId}/students`, { cache: "no-store" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      const d: ApiResp = await res.json();
      setData(d);
      setError(null);
      setLastRefreshedAt(new Date());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    intervalRef.current = setInterval(() => load(true), REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    let rows = data.students;
    if (filter === "completed") rows = rows.filter((r) => r.completed);
    else if (filter === "in_progress") rows = rows.filter((r) => !r.completed);
    else if (filter === "active_now") rows = rows.filter((r) => r.is_active_now);
    if (q) rows = rows.filter((r) => r.display_name.toLowerCase().includes(q));
    const sorted = [...rows].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.display_name.localeCompare(b.display_name);
        case "progress":
          // completed first, then by stage desc
          if (a.completed !== b.completed) return a.completed ? -1 : 1;
          return b.current_stage - a.current_stage;
        case "time":
          return b.time_on_task_ms - a.time_on_task_ms;
        case "badges":
          return b.badges_count - a.badges_count;
        case "last_active":
        default:
          return new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime();
      }
    });
    return sorted;
  }, [data, filter, search, sortKey]);

  const openStudent = useMemo(() => {
    if (!data || !openSessionId) return null;
    return data.students.find((s) => s.session_id === openSessionId) || null;
  }, [data, openSessionId]);

  if (loading && !data) {
    return (
      <HDCard className="mt-8 p-6" style={{ color: pencilAlpha("99") }}>
        Loading the class roster…
      </HDCard>
    );
  }
  if (error) {
    return (
      <HDCard variant="postItPink" className="mt-8 p-6">
        Couldn&apos;t load students: <b>{error}</b>
        <div className="mt-2">
          <HDButton variant="secondary" size="sm" onClick={() => load()}>
            Try again
          </HDButton>
        </div>
      </HDCard>
    );
  }
  if (!data) return null;

  const { summary, students } = data;
  const hasAnyStudent = students.length > 0;

  return (
    <section className="mt-10">
      {/* Section header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2
            className="flex items-center gap-2 text-3xl"
            style={{ ...KALAM, color: COLOR.pencil }}
          >
            <Users size={28} strokeWidth={2.5} color={COLOR.red} />
            Your class
          </h2>
          <p className="mt-1 text-sm" style={{ color: pencilAlpha("99") }}>
            Live view of every kid who joined this Mish.
            {lastRefreshedAt && (
              <span className="ml-2">
                Updated {formatRelative(lastRefreshedAt.toISOString())}.
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <HDButton
            variant="ghost"
            size="sm"
            onClick={() => load()}
            disabled={refreshing}
            aria-label="Refresh"
          >
            <RefreshCw
              size={16}
              strokeWidth={2.5}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </HDButton>
          <HDButton
            variant="ghost"
            size="sm"
            disabled={!hasAnyStudent}
            onClick={() => downloadCsv(toCsv(students), `mission-${missionId}-students.csv`)}
          >
            <Download size={16} strokeWidth={2.5} />
            CSV
          </HDButton>
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Joined"
          value={summary.total_joined}
          icon={<Users size={18} strokeWidth={2.5} color={COLOR.red} />}
          variant="default"
        />
        <StatCard
          label="Completed"
          value={summary.completed}
          icon={<Trophy size={18} strokeWidth={2.5} color={COLOR.red} />}
          variant="postIt"
        />
        <StatCard
          label="Active now"
          value={summary.active_now}
          icon={<Activity size={18} strokeWidth={2.5} color={COLOR.red} />}
          variant={summary.active_now > 0 ? "postItGreen" : "default"}
          subtitle={summary.active_now > 0 ? "in last 2 min" : "no one online"}
        />
        <StatCard
          label="Avg time on task"
          value={hasAnyStudent ? formatDuration(summary.avg_time_on_task_ms) : "—"}
          icon={<Clock size={18} strokeWidth={2.5} color={COLOR.red} />}
          variant="default"
          subtitle={
            hasAnyStudent
              ? `median ${formatDuration(summary.median_time_on_task_ms)}`
              : undefined
          }
        />
      </div>

      {/* Stage distribution */}
      {hasAnyStudent && (
        <HDCard className="mt-5 p-5">
          <div
            className="flex items-center gap-2 text-sm"
            style={{ ...KALAM, color: COLOR.red, fontSize: "1rem" }}
          >
            <TrendingUp size={16} strokeWidth={2.5} />
            Where the class is now
          </div>
          <div className="mt-3 grid grid-cols-3 md:grid-cols-6 gap-2">
            <StageBucket
              label="Done"
              count={summary.stage_distribution[0]}
              total={summary.total_joined}
              isComplete
            />
            {[1, 2, 3, 4, 5].map((stage) => (
              <StageBucket
                key={stage}
                label={`${stage}. ${STAGE_NAMES[stage]}`}
                count={summary.stage_distribution[stage] || 0}
                total={summary.total_joined}
              />
            ))}
          </div>
        </HDCard>
      )}

      {/* Controls */}
      {hasAnyStudent && (
        <div className="mt-5 flex flex-col gap-3">
          <div className="relative w-full">
            <Search
              size={16}
              strokeWidth={2.5}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"
              style={{ color: pencilAlpha("99") }}
            />
            <HDInput
              type="text"
              placeholder="Search nickname…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-base pl-9 w-full"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FilterChip
              label="Everyone"
              count={summary.total_joined}
              active={filter === "all"}
              onClick={() => setFilter("all")}
            />
            <FilterChip
              label="Active now"
              count={summary.active_now}
              active={filter === "active_now"}
              onClick={() => setFilter("active_now")}
            />
            <FilterChip
              label="In progress"
              count={summary.in_progress}
              active={filter === "in_progress"}
              onClick={() => setFilter("in_progress")}
            />
            <FilterChip
              label="Done"
              count={summary.completed}
              active={filter === "completed"}
              onClick={() => setFilter("completed")}
            />
            <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="px-3 py-2 text-sm border-[3px]"
            style={{
              ...KALAM,
              borderColor: COLOR.pencil,
              borderRadius: RADIUS.buttonSm,
              backgroundColor: "white",
              color: COLOR.pencil,
              boxShadow: SHADOW.sm,
            }}
          >
            <option value="last_active">Sort: last active</option>
            <option value="progress">Sort: progress</option>
            <option value="name">Sort: nickname</option>
            <option value="time">Sort: time on task</option>
            <option value="badges">Sort: badges</option>
          </select>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasAnyStudent && (
        <HDCard
          className="mt-5 p-10 text-center"
          style={{ borderStyle: "dashed", color: pencilAlpha("99") }}
        >
          <Users
            size={48}
            strokeWidth={2.5}
            color={pencilAlpha("66")}
            className="mx-auto mb-3"
          />
          <div className="text-lg" style={{ ...KALAM, color: COLOR.pencil }}>
            No one has joined this Mish yet.
          </div>
          <div className="mt-1 text-sm">
            Drop the class link above into Google Classroom — kids will show up here as
            they sign in.
          </div>
        </HDCard>
      )}

      {/* Table */}
      {hasAnyStudent && (
        <HDCard className="mt-5 p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-left border-b-2 border-dashed"
                  style={{ borderColor: pencilAlpha("33") }}
                >
                  <Th>Kid</Th>
                  <Th>Progress</Th>
                  <Th>Badges</Th>
                  <Th>Time on task</Th>
                  <Th>Last active</Th>
                  <Th className="text-right pr-4">Details</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center"
                      style={{ color: pencilAlpha("99") }}
                    >
                      No kids match the current filter.
                    </td>
                  </tr>
                )}
                {filtered.map((row) => (
                  <StudentTableRow
                    key={row.session_id}
                    row={row}
                    onOpen={() => setOpenSessionId(row.session_id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </HDCard>
      )}

      {/* Privacy footnote — kids' data, GDPR-K context */}
      {hasAnyStudent && (
        <p className="mt-3 text-xs" style={{ color: pencilAlpha("99") }}>
          Display names only — no emails, no phone numbers (validated at join). Sessions
          auto-delete after 30 days of inactivity.
        </p>
      )}

      {/* Drilldown modal */}
      {openStudent && (
        <StudentDrilldown student={openStudent} onClose={() => setOpenSessionId(null)} />
      )}
    </section>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-3 text-xs uppercase tracking-wide ${className}`}
      style={{ ...KALAM, color: pencilAlpha("99"), fontSize: "0.7rem" }}
    >
      {children}
    </th>
  );
}

function StatCard({
  label,
  value,
  icon,
  variant,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  variant: "default" | "postIt" | "postItGreen";
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

function StageBucket({
  label,
  count,
  total,
  isComplete,
}: {
  label: string;
  count: number;
  total: number;
  isComplete?: boolean;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div
      className="p-3 border-[3px]"
      style={{
        backgroundColor: isComplete ? COLOR.postItGreen : count > 0 ? "white" : COLOR.muted,
        borderColor: COLOR.pencil,
        borderRadius: RADIUS.cardSm,
        boxShadow: SHADOW.sm,
        opacity: count === 0 ? 0.55 : 1,
      }}
    >
      <div className="text-xs truncate" style={{ ...KALAM, color: COLOR.pencil }}>
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-xl" style={{ ...KALAM, color: COLOR.pencil }}>
          {count}
        </span>
        <span className="text-xs" style={{ color: pencilAlpha("99") }}>
          / {total} · {pct}%
        </span>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-3 py-2 text-sm border-[3px]"
      style={{
        ...KALAM,
        backgroundColor: active ? COLOR.red : "white",
        color: active ? "white" : COLOR.pencil,
        borderColor: COLOR.pencil,
        borderRadius: RADIUS.chip,
        boxShadow: active ? SHADOW.md : SHADOW.sm,
      }}
    >
      {label}
      <span
        className="ml-1 px-1.5 py-0.5 text-xs"
        style={{
          backgroundColor: active ? "rgba(255,255,255,0.25)" : pencilAlpha("11"),
          borderRadius: 8,
        }}
      >
        {count}
      </span>
    </button>
  );
}

function StudentTableRow({ row, onOpen }: { row: StudentRow; onOpen: () => void }) {
  return (
    <tr
      className="border-b-2 border-dashed hover:bg-amber-50/40 cursor-pointer"
      style={{ borderColor: pencilAlpha("1a") }}
      onClick={onOpen}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-2 w-2 shrink-0 rounded-full"
            style={{
              backgroundColor: row.is_active_now
                ? "#3aaf3a"
                : row.completed
                ? COLOR.red
                : pencilAlpha("66"),
            }}
            aria-label={row.is_active_now ? "active now" : row.completed ? "completed" : "idle"}
            title={row.is_active_now ? "Active now" : row.completed ? "Completed" : "Idle"}
          />
          <span className="font-semibold" style={{ ...KALAM, color: COLOR.pencil }}>
            {row.display_name}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <ProgressBar row={row} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <Award size={14} strokeWidth={2.5} color={COLOR.red} />
          <span style={{ ...KALAM, color: COLOR.pencil }}>{row.badges_count}</span>
          <span className="text-xs" style={{ color: pencilAlpha("99") }}>
            / 5
          </span>
        </div>
      </td>
      <td className="px-4 py-3" style={{ color: COLOR.pencil }}>
        {formatDuration(row.time_on_task_ms)}
      </td>
      <td className="px-4 py-3" style={{ color: pencilAlpha("cc") }}>
        {formatRelative(row.last_active_at)}
      </td>
      <td className="px-4 py-3 text-right pr-4">
        <span className="text-xs underline" style={{ color: COLOR.red }}>
          Open
        </span>
      </td>
    </tr>
  );
}

function ProgressBar({ row }: { row: StudentRow }) {
  const pct = row.completed ? 100 : Math.round((row.current_stage / row.total_stages) * 100);
  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div
        className="relative h-3 flex-1 overflow-hidden border-2"
        style={{
          borderColor: COLOR.pencil,
          backgroundColor: "white",
          borderRadius: RADIUS.input,
        }}
      >
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: row.completed ? "#3aaf3a" : COLOR.red,
          }}
        />
      </div>
      <span
        className="text-xs shrink-0"
        style={{ ...KALAM, color: COLOR.pencil, minWidth: "2.5em" }}
      >
        {row.completed ? "Done" : `${row.current_stage}/${row.total_stages}`}
      </span>
    </div>
  );
}

function StudentDrilldown({ student, onClose }: { student: StudentRow; onClose: () => void }) {
  // Lock scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(45, 45, 45, 0.45)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 border-[3px] bg-white"
        style={{
          borderColor: COLOR.pencil,
          borderRadius: RADIUS.card,
          boxShadow: SHADOW.lg,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div
              className="text-xs"
              style={{ ...KALAM, color: COLOR.red, fontSize: "0.85rem" }}
            >
              Student
            </div>
            <h3
              className="text-3xl"
              style={{ ...KALAM, color: COLOR.pencil }}
            >
              {student.display_name}
            </h3>
            <div className="mt-1 text-sm" style={{ color: pencilAlpha("99") }}>
              Joined {formatRelative(student.created_at)} · Last active{" "}
              {formatRelative(student.last_active_at)} · {formatDuration(student.time_on_task_ms)}{" "}
              on task
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 hover:opacity-70"
            style={{ color: COLOR.pencil }}
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Progress + status */}
        <HDCard variant={student.completed ? "postItGreen" : "default"} className="mt-5 p-4">
          <div className="flex items-center gap-2">
            {student.completed ? (
              <CheckCircle2 size={20} strokeWidth={2.5} color={COLOR.red} />
            ) : (
              <Circle size={20} strokeWidth={2.5} color={pencilAlpha("99")} />
            )}
            <span className="text-base" style={{ ...KALAM, color: COLOR.pencil }}>
              {student.completed
                ? "Finished the Mish"
                : `Stage ${student.current_stage} of ${student.total_stages} — ${STAGE_NAMES[student.current_stage]}`}
            </span>
          </div>
          <ProgressBar row={student} />
        </HDCard>

        {/* Badges */}
        <div className="mt-5">
          <div
            className="flex items-center gap-2 text-sm"
            style={{ ...KALAM, color: COLOR.red, fontSize: "1rem" }}
          >
            <Award size={16} strokeWidth={2.5} />
            Badges earned ({student.badges.length}/5)
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {student.badges.length === 0 && (
              <span style={{ color: pencilAlpha("99") }}>None yet.</span>
            )}
            {student.badges.map((b, i) => (
              <span
                key={b}
                className={`inline-flex items-center gap-1 px-3 py-1 border-[3px] ${
                  i % 2 === 0 ? "rotate-1" : "-rotate-1"
                }`}
                style={{
                  ...KALAM,
                  backgroundColor: COLOR.postIt,
                  color: COLOR.pencil,
                  borderColor: COLOR.pencil,
                  borderRadius: RADIUS.chip,
                  boxShadow: SHADOW.sm,
                }}
              >
                <Award size={14} strokeWidth={2.5} color={COLOR.red} />
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* Refined query */}
        {student.refined_query && (
          <HDCard variant="postIt" className="mt-5 p-4">
            <div
              className="flex items-center gap-2 text-sm"
              style={{ ...KALAM, color: COLOR.red, fontSize: "1rem" }}
            >
              <Pin size={14} strokeWidth={2.5} />
              Their research question
            </div>
            <div className="mt-1 text-base" style={{ color: COLOR.pencil }}>
              {student.refined_query}
            </div>
          </HDCard>
        )}

        {/* Per-stage scores */}
        <div className="mt-5">
          <div
            className="flex items-center gap-2 text-sm"
            style={{ ...KALAM, color: COLOR.red, fontSize: "1rem" }}
          >
            <TrendingUp size={16} strokeWidth={2.5} />
            Per-stage performance
          </div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            <ScoreLine
              label="Stage 2 — sources tagged legit"
              value={student.scores.sources_picked_legit}
              total={student.scores.sources_total}
            />
            <ScoreLine
              label="Stage 3 — facts triangulated"
              value={student.scores.facts_triangulated}
              total={student.scores.facts_total}
            />
            <ScoreLine
              label="Stage 4 — explanations Meeting+"
              value={student.scores.explanations_meeting_plus}
              total={student.scores.explanations_total}
            />
            <ScoreLine
              label="Stage 5 — fakes spotted"
              value={student.scores.hallucinations_spotted}
              total={student.scores.hallucinations_total}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <HDButton variant="primary" size="md" onClick={onClose}>
            Close
          </HDButton>
        </div>
      </div>
    </div>
  );
}

function ScoreLine({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div
      className="p-3 border-2 border-dashed"
      style={{
        borderColor: pencilAlpha("33"),
        backgroundColor: "white",
        borderRadius: RADIUS.cardSm,
      }}
    >
      <div className="text-xs" style={{ color: pencilAlpha("99") }}>
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xl" style={{ ...KALAM, color: COLOR.pencil }}>
          {value}
        </span>
        <span className="text-sm" style={{ color: pencilAlpha("99") }}>
          / {total === 0 ? "—" : total}
        </span>
        {total > 0 && (
          <span className="ml-auto text-xs" style={{ ...KALAM, color: COLOR.red }}>
            {pct}%
          </span>
        )}
      </div>
    </div>
  );
}
