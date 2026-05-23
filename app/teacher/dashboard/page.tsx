"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-zinc-500">← home</Link>
          <h1 className="mt-2 text-3xl font-semibold">Your missions</h1>
        </div>
        <button onClick={logout} className="text-sm text-zinc-500 hover:text-zinc-700">
          Log out
        </button>
      </div>

      <div className="mt-8">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm text-white hover:bg-zinc-800"
          >
            + New mission
          </button>
        ) : (
          <form
            onSubmit={createMission}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold">Create a mission</h2>
            <div className="mt-4 flex flex-col gap-3">
              <input
                placeholder="Mission title (e.g. Year 6 — Transylvanian Churches)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm"
              />
              <input
                placeholder="Research topic (e.g. Why did Transylvanian churches need defensive walls?)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm"
              />
              <textarea
                placeholder="Knowledge base / lesson context (optional, paste anything)"
                value={kb}
                onChange={(e) => setKb(e.target.value)}
                rows={4}
                className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-full bg-zinc-900 px-5 py-2 text-sm text-white disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-full border border-zinc-300 px-5 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4">
        {missions === null && <div className="text-zinc-500">Loading...</div>}
        {missions && missions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
            No missions yet. Create your first one.
          </div>
        )}
        {missions?.map((m) => (
          <Link
            key={m.id}
            href={`/teacher/missions/${m.id}`}
            className="block rounded-2xl border border-zinc-200 bg-white p-5 hover:border-zinc-400"
          >
            <div className="text-sm text-zinc-500">{new Date(m.created_at).toLocaleString()}</div>
            <div className="mt-1 text-lg font-semibold">{m.title}</div>
            <div className="mt-1 text-sm text-zinc-600">{m.topic}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
