"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TeacherLogin() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.push("/teacher/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700">
          ← back
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">
          {mode === "login" ? "Teacher login" : "Create teacher account"}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {mode === "login" ? "Welcome back." : "No school email required."}
        </p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="you@school.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-zinc-900 focus:outline-none"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-zinc-900 focus:outline-none"
          />
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-zinc-900 px-6 py-2.5 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "..." : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="mt-4 w-full text-center text-sm text-zinc-500 hover:text-zinc-700"
        >
          {mode === "login" ? "No account? Register" : "Have an account? Log in"}
        </button>
      </div>
    </main>
  );
}
