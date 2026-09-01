"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ApplicationStatus, JobStatus, VerificationStatus } from "@/lib/supabase/types";

interface Applicant {
  id: string;
  applicantId: string;
  name: string;
  message: string;
  status: ApplicationStatus;
}

export function JobApplicationPanel({
  jobId,
  jobStatus,
  posterId,
}: {
  jobId: string;
  jobStatus: JobStatus;
  posterId: string;
}) {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("unverified");
  const [myApplication, setMyApplication] = useState<{ status: ApplicationStatus } | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const isPoster = userId === posterId;

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUserId(user?.id ?? null);

    if (!user) {
      setLoading(false);
      return;
    }

    if (user.id === posterId) {
      const { data: apps } = await supabase
        .from("applications")
        .select("id, applicant_id, message, status")
        .eq("job_post_id", jobId)
        .order("created_at", { ascending: true });

      const applicantIds = (apps ?? []).map((a) => a.applicant_id);
      const { data: profiles } =
        applicantIds.length > 0
          ? await supabase.from("profiles").select("id, name").in("id", applicantIds)
          : { data: [] };
      const nameById = new Map((profiles ?? []).map((p) => [p.id, p.name]));

      setApplicants(
        (apps ?? []).map((a) => ({
          id: a.id,
          applicantId: a.applicant_id,
          name: nameById.get(a.applicant_id) ?? "(unknown)",
          message: a.message,
          status: a.status,
        }))
      );
    } else {
      const [{ data: verification }, { data: application }] = await Promise.all([
        supabase.from("verifications").select("status").eq("user_id", user.id).single(),
        supabase
          .from("applications")
          .select("status")
          .eq("job_post_id", jobId)
          .eq("applicant_id", user.id)
          .maybeSingle(),
      ]);
      setVerificationStatus(verification?.status ?? "unverified");
      setMyApplication(application);
    }

    setLoading(false);
  }, [jobId, posterId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
  }, [load]);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    setSubmitting(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: insertError } = await supabase.from("applications").insert({
      job_post_id: jobId,
      applicant_id: userId,
      message,
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setMyApplication({ status: "pending" });
  }

  async function decide(applicationId: string, applicantId: string, status: "accepted" | "declined") {
    setBusyId(applicationId);
    const supabase = createSupabaseBrowserClient();

    const { error: updateError } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", applicationId);

    if (!updateError && status === "accepted" && userId) {
      await supabase.from("engagements").insert({
        poster_id: userId,
        worker_id: applicantId,
        job_post_id: jobId,
      });
    }

    setApplicants((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status } : a)));
    setBusyId(null);
  }

  if (loading) {
    return <p className="text-sm text-neutral-500">Loading...</p>;
  }

  if (!userId) {
    return (
      <p className="text-sm text-neutral-500">
        <Link href="/login" className="underline">
          Log in
        </Link>{" "}
        to apply for this job.
      </p>
    );
  }

  if (isPoster) {
    return (
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase text-neutral-500">Applicants</h2>
        {applicants.length === 0 ? (
          <p className="text-sm text-neutral-500">No applicants yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {applicants.map((a) => (
              <li key={a.id} className="rounded-md border border-neutral-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{a.name}</span>
                  {a.status === "pending" ? (
                    <div className="flex gap-2">
                      <button
                        disabled={busyId === a.id}
                        onClick={() => decide(a.id, a.applicantId, "accepted")}
                        className="rounded-md bg-green-700 px-3 py-1 text-xs text-white hover:bg-green-800 disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        disabled={busyId === a.id}
                        onClick={() => decide(a.id, a.applicantId, "declined")}
                        className="rounded-md bg-red-700 px-3 py-1 text-xs text-white hover:bg-red-800 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs capitalize text-neutral-500">{a.status}</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-neutral-600">{a.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (verificationStatus !== "verified") {
    return (
      <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Only verified students can apply.{" "}
        <Link href="/verify" className="underline">
          Get verified →
        </Link>
      </p>
    );
  }

  if (myApplication) {
    return (
      <p className="text-sm text-neutral-500">
        You applied to this job — status: <span className="capitalize">{myApplication.status}</span>
      </p>
    );
  }

  if (jobStatus !== "open") {
    return <p className="text-sm text-neutral-500">This job is no longer accepting applications.</p>;
  }

  return (
    <form onSubmit={handleApply} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Apply with a short message</span>
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="input"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {submitting ? "Applying..." : "Apply"}
      </button>
    </form>
  );
}
