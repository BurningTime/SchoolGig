"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ReportTargetType } from "@/lib/supabase/types";

export interface OpenReport {
  id: string;
  reporterName: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  createdAt: string;
  preview: string;
  resolvedUserId: string | null;
}

export function ReportQueue({ initialReports }: { initialReports: OpenReport[] }) {
  const [reports, setReports] = useState(initialReports);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function markStatus(reportId: string, status: "actioned" | "dismissed") {
    setBusyId(reportId);
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase
      .from("reports")
      .update({ status, handled_by: user?.id })
      .eq("id", reportId);

    setReports((prev) => prev.filter((r) => r.id !== reportId));
    setBusyId(null);
  }

  async function removeContent(report: OpenReport) {
    setBusyId(report.id);
    const supabase = createSupabaseBrowserClient();

    if (report.targetType === "listing") {
      await supabase.from("service_listings").update({ is_active: false }).eq("id", report.targetId);
    } else if (report.targetType === "job") {
      await supabase.from("job_posts").update({ status: "closed" }).eq("id", report.targetId);
    } else if (report.targetType === "message") {
      await supabase.from("messages").delete().eq("id", report.targetId);
    }

    await markStatus(report.id, "actioned");
  }

  async function banUser(report: OpenReport) {
    if (!report.resolvedUserId) return;
    setBusyId(report.id);
    const supabase = createSupabaseBrowserClient();

    await supabase.from("profiles").update({ is_banned: true }).eq("id", report.resolvedUserId);

    await markStatus(report.id, "actioned");
  }

  if (reports.length === 0) {
    return <p className="text-sm text-neutral-500">No open reports.</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {reports.map((r) => (
        <li key={r.id} className="rounded-md border border-neutral-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase text-neutral-500">{r.targetType}</p>
              <p className="mt-1 text-sm font-medium">{r.preview}</p>
              <p className="mt-1 text-sm text-neutral-600">Reason: {r.reason}</p>
              <p className="mt-1 text-xs text-neutral-400">
                Reported by {r.reporterName} · {new Date(r.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {r.targetType !== "user" && (
              <button
                disabled={busyId === r.id}
                onClick={() => removeContent(r)}
                className="rounded-md bg-red-700 px-3 py-1.5 text-xs text-white hover:bg-red-800 disabled:opacity-50"
              >
                Remove content
              </button>
            )}
            {r.resolvedUserId && (
              <button
                disabled={busyId === r.id}
                onClick={() => banUser(r)}
                className="rounded-md bg-red-900 px-3 py-1.5 text-xs text-white hover:bg-black disabled:opacity-50"
              >
                Ban user
              </button>
            )}
            <button
              disabled={busyId === r.id}
              onClick={() => markStatus(r.id, "dismissed")}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-100 disabled:opacity-50"
            >
              Dismiss
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
