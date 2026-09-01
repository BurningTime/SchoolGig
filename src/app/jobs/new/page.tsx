"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { VerificationStatus } from "@/lib/supabase/types";

interface Category {
  id: number;
  name: string;
}

export default function NewJobPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<VerificationStatus>("unverified");
  const [categories, setCategories] = useState<Category[]>([]);
  const [posterName, setPosterName] = useState("");
  const [posterPhotoUrl, setPosterPhotoUrl] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [dateNeeded, setDateNeeded] = useState("");
  const [area, setArea] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const [{ data: verification }, { data: cats }, { data: profile }] = await Promise.all([
      supabase.from("verifications").select("status").eq("user_id", user.id).single(),
      supabase.from("categories").select("id, name").order("name"),
      supabase.from("profiles").select("name, photo_url").eq("id", user.id).single(),
    ]);

    setStatus(verification?.status ?? "unverified");
    setCategories(cats ?? []);
    if (cats && cats.length > 0) setCategoryId(cats[0].id);
    setPosterName(profile?.name ?? "You");
    setPosterPhotoUrl(profile?.photo_url ?? null);
    setChecking(false);
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) return;

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("job_posts")
        .insert({
          user_id: user.id,
          category_id: categoryId,
          title,
          description,
          budget: budget ? Number(budget) : null,
          date_needed: dateNeeded || null,
          area,
        })
        .select("id")
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.push(`/jobs/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">Loading...</main>;
  }

  if (status !== "verified") {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
        <h1 className="mb-4 text-xl font-semibold">Post a job</h1>
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Only verified students can post jobs.{" "}
          <Link href="/verify" className="underline">
            Get verified →
          </Link>
        </p>
      </main>
    );
  }

  const selectedCategoryName = categories.find((c) => c.id === categoryId)?.name;

  const formattedDate = dateNeeded
    ? new Date(dateNeeded + "T00:00:00").toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <main className="min-h-full flex-1 bg-[#DDDCDB]">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold text-[#3C4044]">Post a job</h1>

        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-[1fr_360px]">
          {/* Form column */}
          <div className="flex flex-col gap-5 rounded-xl bg-white p-6 shadow-sm">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-[#3C4044]">Category</span>
              {categories.length === 0 ? (
                <p className="rounded-md border border-dashed border-[#DDDCDB] px-3 py-2 text-sm text-[#3C4044]/60">
                  No categories available yet.
                </p>
              ) : (
                <select
                  required
                  value={categoryId ?? ""}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="fb-input"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-[#3C4044]">Title</span>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Help moving furniture this weekend"
                className="fb-input"
              />
            </label>

            <div className="flex gap-4">
              <label className="flex flex-1 flex-col gap-1 text-sm">
                <span className="font-semibold text-[#3C4044]">Budget</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#3C4044]/60">₱</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="0.00"
                    className="fb-input"
                  />
                </div>
              </label>
              <label className="flex flex-1 flex-col gap-1 text-sm">
                <span className="font-semibold text-[#3C4044]">Date needed</span>
                <input
                  type="date"
                  value={dateNeeded}
                  onChange={(e) => setDateNeeded(e.target.value)}
                  className="fb-input"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-[#3C4044]">Area</span>
              <input
                required
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Lagao, General Santos City"
                className="fb-input"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-[#3C4044]">Description</span>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Describe the job, what it involves, and anything applicants should know."
                className="fb-input"
              />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting || categories.length === 0}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-md bg-[#FD7B41] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e8672f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {submitting ? "Posting..." : "Post job"}
            </button>
          </div>

          {/* Live preview column */}
          <div className="md:sticky md:top-6 md:self-start">
            <p className="mb-2 text-sm font-semibold text-[#3C4044]/70">Preview</p>
            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
              <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 bg-[#DDDCDB]">
                <span className="text-4xl text-[#3C4044]/30">🛠️</span>
                <span className="text-xs text-[#3C4044]/40">No photo for job posts</span>
              </div>
              <div className="flex flex-col gap-1 p-4">
                {selectedCategoryName && (
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[#FD7B41]">
                    {selectedCategoryName}
                  </span>
                )}
                <span className="font-semibold text-[#3C4044]">{title || "Your job title"}</span>
                <span className="text-sm text-[#3C4044]">
                  {budget ? `₱${budget} budget` : "Budget"}
                </span>
                <div className="flex items-center gap-2 text-xs text-[#3C4044]/60">
                  <span>{area || "Area"}</span>
                  {formattedDate && (
                    <>
                      <span>·</span>
                      <span>Needed {formattedDate}</span>
                    </>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-[#DDDCDB] pt-3">
                  {posterPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={posterPhotoUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-[#EDBF9B]" />
                  )}
                  <span className="text-xs font-medium text-[#3C4044]">{posterName}</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}