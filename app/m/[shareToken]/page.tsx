"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

export default function KidJoin({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = use(params);
  const router = useRouter();
  const [mission, setMission] = useState<{ title: string; topic: string } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/m/${shareToken}`).then(async (r) => {
      if (r.status === 404) {
        setNotFound(true);
        return;
      }
      const data = await r.json();
      setMission(data.mission);
    });
  }, [shareToken]);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setJoining(true);
    try {
      const res = await fetch(`/api/m/${shareToken}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.push(`/m/${shareToken}/stage/1`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setJoining(false);
    }
  }

  if (notFound) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
          <div className="text-4xl">🔍</div>
          <div className="mt-2 font-semibold">Mission not found</div>
          <div className="mt-1 text-sm text-zinc-500">Ask your teacher for the correct link.</div>
        </div>
      </main>
    );
  }

  if (!mission) {
    return <main className="p-12 text-zinc-500">Loading...</main>;
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">
            🔍
          </div>
          <div className="mt-3 text-sm font-semibold tracking-wide text-amber-700">
            Sleuth mission
          </div>
          <h1 className="mt-1 text-2xl font-semibold">{mission.title}</h1>
          <p className="mt-2 text-zinc-600">{mission.topic}</p>
        </div>

        <form onSubmit={join} className="mt-8 flex flex-col gap-3">
          <label htmlFor="kid-display-name" className="text-base font-semibold text-zinc-700">
            Pick a display name
          </label>
          <p className="-mt-2 text-sm text-zinc-500">
            No last names. No emails. Pick something fun.
          </p>
          <input
            id="kid-display-name"
            placeholder="e.g. MaxR or DragonHunter"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            maxLength={30}
            aria-label="Display name"
            className="rounded-xl border-2 border-zinc-300 px-4 py-3 text-lg focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
          <div className="flex items-start gap-2 rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
            <span aria-hidden="true">👀</span>
            <span>Your teacher can see your name and your work on this mission.</span>
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <button
            type="submit"
            disabled={joining || displayName.trim().length === 0}
            className="mt-2 rounded-full bg-amber-500 px-6 py-4 text-lg font-bold text-zinc-950 hover:bg-amber-400 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed"
          >
            {joining ? "Starting…" : "Start mission →"}
          </button>
        </form>
      </div>
    </main>
  );
}
