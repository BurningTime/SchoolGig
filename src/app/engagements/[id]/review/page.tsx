"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LeaveReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: engagementId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [revieweeId, setRevieweeId] = useState<string | null>(null);
  const [revieweeName, setRevieweeName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

    const { data: engagement } = await supabase
      .from("engagements")
      .select("poster_id, worker_id, status")
      .eq("id", engagementId)
      .single();

    if (!engagement || (engagement.poster_id !== user.id && engagement.worker_id !== user.id)) {
      setError("Engagement not found.");
      setLoading(false);
      return;
    }

    if (engagement.status !== "completed") {
      setError("This engagement isn't marked as completed yet.");
      setLoading(false);
      return;
    }

    const other = engagement.poster_id === user.id ? engagement.worker_id : engagement.poster_id;
    setRevieweeId(other);

    const [{ data: profile }, { data: existingReview }] = await Promise.all([
      supabase.from("profiles").select("name").eq("id", other).single(),
      supabase
        .from("reviews")
        .select("id")
        .eq("engagement_id", engagementId)
        .eq("reviewer_id", user.id)
        .maybeSingle(),
    ]);

    setRevieweeName(profile?.name ?? "(unknown)");

    if (existingReview) {
      setError("You've already reviewed this engagement.");
    }

    setLoading(false);
  }, [engagementId, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !revieweeId) return;

    setSubmitting(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: insertError } = await supabase.from("reviews").insert({
      engagement_id: engagementId,
      reviewer_id: userId,
      reviewee_id: revieweeId,
      rating,
      comment: comment || null,
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push("/profile");
  }

  if (loading) {
    return <main className="mx-auto w-full max-w-sm flex-1 px-4 py-12">Loading...</main>;
  }

  if (error && !revieweeId) {
    return (
      <main className="mx-auto w-full max-w-sm flex-1 px-4 py-12">
        <p className="text-sm text-red-600">{error}</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-sm flex-1 px-4 py-12">
        <p className="text-sm text-neutral-500">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-12">
      <h1 className="mb-6 text-xl font-semibold">Review {revieweeName}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Rating</span>
          <div className="flex gap-1 text-2xl">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={n <= rating ? "text-amber-500" : "text-neutral-300"}
                aria-label={`${n} star`}
              >
                ★
              </button>
            ))}
          </div>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Comment</span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="input"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit review"}
        </button>
      </form>
    </main>
  );
}
