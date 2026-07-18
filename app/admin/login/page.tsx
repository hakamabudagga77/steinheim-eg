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
    <div className="flex min-h-screen items-center justify-center bg-[#ece9e2] px-5">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-10">
        <p className="text-[11px] uppercase tracking-[0.3em] text-black/40">Steinheim Egypt</p>
        <h1 className="mt-3 font-heading text-[28px] tracking-[-0.02em]">Admin login</h1>

        <div className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-black/35">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="w-full border-b border-black/15 bg-transparent px-1 py-3 text-[15px] outline-none focus:border-black/40"
            />
          </div>
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-black/35">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full border-b border-black/15 bg-transparent px-1 py-3 text-[15px] outline-none focus:border-black/40"
            />
          </div>
        </div>

        {error && <p className="mt-4 text-[13px] text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-8 flex h-[48px] w-full items-center justify-center rounded-full bg-black text-[13px] font-medium text-white transition hover:bg-black/85 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
