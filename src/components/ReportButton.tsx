"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ReportTargetType } from "@/lib/supabase/types";

export function ReportButton({
  targetType,
  targetId,
}: {
  targetType: ReportTargetType;
  targetId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleOpen() {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;

    setSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("reports").insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
    });

    setSubmitting(false);
    setDone(true);
  }

  if (done) {
    return <span className="text-xs text-neutral-500">Reported — thanks for flagging this.</span>;
  }

  if (!open) {
    return (
      <button onClick={handleOpen} className="text-xs text-neutral-400 hover:text-neutral-600 hover:underline">
        Report
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 text-xs">
      <textarea
        required
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Why are you reporting this?"
        rows={2}
        className="input text-xs"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-neutral-900 px-2 py-1 text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {submitting ? "Sending..." : "Submit report"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-neutral-500 hover:underline">
          Cancel
        </button>
      </div>
    </form>
  );
}
