"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    return <main className="p-12 text-zinc-500">Loading...</main>;
  }

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/m/${mission.share_token}` : "";

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link href="/teacher/dashboard" className="text-sm text-zinc-500">
        ← all missions
      </Link>
      <h1 className="mt-3 text-3xl font-semibold">{mission.title}</h1>
      <p className="mt-2 text-zinc-600">{mission.topic}</p>

      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="text-sm font-medium text-amber-900">Class link</div>
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm">
            {shareUrl}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="mt-2 text-xs text-amber-800">
          Drop this in Google Classroom. Kids open it, type a display name, and start.
        </p>
      </div>

      {mission.knowledge_base_text && (
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="text-sm font-medium text-zinc-700">Knowledge base</div>
          <pre className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
            {mission.knowledge_base_text}
          </pre>
        </div>
      )}
    </main>
  );
}
