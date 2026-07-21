"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Login failed.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b] px-5">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#131316] p-10 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]"
      >
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#0a84ff]">Steinheim Egypt</p>
        <h1 className="mt-3 font-heading text-[28px] tracking-[-0.02em] text-white">Admin login</h1>

        <div className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-white/35">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="w-full border-b border-white/15 bg-transparent px-1 py-3 text-[15px] text-white outline-none focus:border-[#0a84ff]"
            />
          </div>
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-white/35">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full border-b border-white/15 bg-transparent px-1 py-3 text-[15px] text-white outline-none focus:border-[#0a84ff]"
            />
          </div>
        </div>

        {error && <p className="mt-4 text-[13px] text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-8 flex h-[48px] w-full items-center justify-center rounded-full bg-[#0a84ff] text-[13px] font-medium text-white transition hover:bg-[#3d9dff] disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
