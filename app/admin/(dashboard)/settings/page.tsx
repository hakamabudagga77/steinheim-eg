"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserCircle2, LogOut, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader, Panel, Badge } from "@/components/admin/ui";

interface ServiceStatus {
  name: string;
  configured: boolean;
  detail: string | null;
}

interface StatusResponse {
  email: string | null;
  environment: string;
  services: ServiceStatus[];
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    fetch("/api/admin/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setStatus(d))
      .catch(() => {});
  }, []);

  async function handleLogout() {
    setSigningOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div>
      <PageHeader eyebrow="Settings" title="Account & system" subtitle="Who's signed in and whether everything is connected" />

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Account</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0a84ff]/12 text-[#0a84ff]">
              <UserCircle2 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium text-white/90">{status?.email ?? "—"}</p>
              <p className="text-[12px] text-white/35">Signed in · Steinheim Admin</p>
            </div>
          </div>
          <p className="mt-5 text-[12.5px] leading-[1.6] text-white/35">
            Login credentials are managed as environment variables in Vercel (<code className="rounded bg-white/[0.06] px-1 py-0.5">ADMIN_EMAIL</code> /{" "}
            <code className="rounded bg-white/[0.06] px-1 py-0.5">ADMIN_PASSWORD</code>), not editable here. To change them, update the
            values in Vercel and redeploy.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            className="mt-5 flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[13px] text-white/70 transition hover:border-red-400/40 hover:text-red-300 disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </Panel>

        <Panel>
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">System status</p>
          <div className="mt-4 space-y-1">
            {status?.services.map((service) => (
              <div key={service.name} className="flex items-center justify-between gap-3 border-t border-white/[0.05] py-3 first:border-t-0">
                <div className="flex items-center gap-2.5">
                  {service.configured ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#30d158]" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-white/25" />
                  )}
                  <div>
                    <p className="text-[13.5px] text-white/80">{service.name}</p>
                    {service.detail && <p className="text-[11px] text-white/30">{service.detail}</p>}
                  </div>
                </div>
                <Badge tone={service.configured ? "positive" : "muted"}>{service.configured ? "Connected" : "Not configured"}</Badge>
              </div>
            ))}
            {!status && <p className="text-[13px] text-white/30">Checking…</p>}
          </div>
          <p className="mt-5 text-[12.5px] leading-[1.6] text-white/35">
            These are also environment variables in Vercel. If something shows as not configured, that feature's admin page will
            explain what's missing.
          </p>
        </Panel>
      </div>
    </div>
  );
}
