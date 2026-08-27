"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { VerificationStatus } from "@/lib/supabase/types";

export default function VerifyPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUserId(user.id);

    const { data } = await supabase
      .from("verifications")
      .select("status")
      .eq("user_id", user.id)
      .single();

    setStatus(data?.status ?? "unverified");
    setLoading(false);
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !userId) return;

    setSubmitting(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/id.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("student-ids")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setSubmitting(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("verifications")
      .update({ status: "pending", student_id_doc_path: path })
      .eq("user_id", userId);

    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setStatus("pending");
  }

  if (loading) {
    return <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">Loading...</main>;
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <h1 className="mb-6 text-xl font-semibold">Get verified</h1>

      {status === "verified" && (
        <p className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
          You&apos;re verified. Your badge is now showing on your profile.
        </p>
      )}

      {status === "pending" && (
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your student ID is under review. An admin will approve or reject it soon.
        </p>
      )}

      {(status === "unverified" || status === "rejected") && (
        <>
          {status === "rejected" && (
            <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
              Your last submission was rejected. Please upload a clearer photo of your student ID.
            </p>
          )}
          <p className="mb-4 text-sm text-neutral-500">
            Upload a photo of your student ID. It&apos;s only visible to you
            and admins — never shown publicly.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              required
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !file}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700 disabled:opacity-50"
            >
              {submitting ? "Uploading..." : "Submit for review"}
            </button>
          </form>
        </>
      )}
    </main>
  );
}
