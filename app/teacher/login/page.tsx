"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HDCard } from "@/components/handdrawn/HDCard";
import { HDButton } from "@/components/handdrawn/HDButton";
import { HDInput } from "@/components/handdrawn/HDInput";
import { COLOR, RADIUS, KALAM, pencilAlpha, PAPER_BG } from "@/lib/design-tokens";

type SessionStatus = "checking" | "anon" | "redirecting";

export default function TeacherLogin() {
  const router = useRouter();
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("checking");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check existing session on mount — auto-redirect authenticated teachers
  // straight to the dashboard so they never see the login form again.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/teacher/me", { cache: "no-store" });
        if (cancelled) return;
        if (res.ok) {
          setSessionStatus("redirecting");
          router.replace("/teacher/dashboard");
          return;
        }
        setSessionStatus("anon");
      } catch {
        // Network failure — let the user try to log in manually.
        if (!cancelled) setSessionStatus("anon");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

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
      // Use replace so the back button doesn't bounce the user back to login.
      router.replace("/teacher/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // While we're checking the session (or already redirecting), show a quiet
  // placeholder instead of flashing the login form to authenticated users.
  if (sessionStatus !== "anon") {
    return (
      <main
        className="flex flex-1 items-center justify-center px-6 py-16"
        style={PAPER_BG}
      >
        <div
          className="text-base"
          style={{ ...KALAM, color: pencilAlpha("99") }}
          aria-live="polite"
        >
          {sessionStatus === "checking" ? "Checking your session…" : "Taking you to your dashboard…"}
        </div>
      </main>
    );
  }

  return (
    <main
      className="flex flex-1 items-center justify-center px-6 py-16"
      style={PAPER_BG}
    >
      <HDCard className="w-full max-w-md p-8" decoration="tape">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm hover:opacity-70"
          style={{ color: pencilAlpha("99") }}
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          back
        </Link>
        <h1
          className="mt-4 text-3xl"
          style={{ ...KALAM, color: COLOR.pencil }}
        >
          {mode === "login" ? "Teacher login" : "Create teacher account"}
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: pencilAlpha("cc") }}
        >
          {mode === "login" ? "Welcome back." : "No school email required."}
        </p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
          <HDInput
            type="email"
            required
            placeholder="you@school.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-base"
          />
          <HDInput
            type="password"
            required
            minLength={8}
            placeholder="Password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="text-base"
          />
          {error && (
            <div
              className="px-3 py-2 text-sm border-[3px]"
              style={{
                borderColor: COLOR.red,
                backgroundColor: "white",
                borderRadius: RADIUS.notice,
                color: COLOR.red,
              }}
            >
              {error}
            </div>
          )}
          <div className="mt-2">
            <HDButton type="submit" variant="primary" size="md" disabled={loading}>
              {loading ? "..." : mode === "login" ? "Log in" : "Create account"}
            </HDButton>
          </div>
        </form>

        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="mt-4 w-full text-center text-sm underline"
          style={{ color: pencilAlpha("99") }}
        >
          {mode === "login" ? "No account? Register" : "Have an account? Log in"}
        </button>
      </HDCard>
    </main>
  );
}
