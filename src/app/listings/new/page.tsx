"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { RateType, VerificationStatus } from "@/lib/supabase/types";

interface Category {
  id: number;
  name: string;
}

export default function NewListingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<VerificationStatus>("unverified");
  const [categories, setCategories] = useState<Category[]>([]);

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rate, setRate] = useState("");
  const [rateType, setRateType] = useState<RateType>("negotiable");
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

    const [{ data: verification }, { data: cats }] = await Promise.all([
      supabase.from("verifications").select("status").eq("user_id", user.id).single(),
      supabase.from("categories").select("id, name").order("name"),
    ]);

    setStatus(verification?.status ?? "unverified");
    setCategories(cats ?? []);
    if (cats && cats.length > 0) setCategoryId(cats[0].id);
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

    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error: insertError } = await supabase
      .from("service_listings")
      .insert({
        user_id: user.id,
        category_id: categoryId,
        title,
        description,
        rate: rate ? Number(rate) : null,
        rate_type: rateType,
        area,
      })
      .select("id")
      .single();

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push(`/listings/${data.id}`);
  }

  if (checking) {
    return <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">Loading...</main>;
  }

  if (status !== "verified") {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
        <h1 className="mb-4 text-xl font-semibold">Post a listing</h1>
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Only verified students can post listings.{" "}
          <Link href="/verify" className="underline">
            Get verified →
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <h1 className="mb-6 text-xl font-semibold">Post a listing</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Category</span>
          <select
            required
            value={categoryId ?? ""}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            className="input"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Title</span>
          <input
            required
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Description</span>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="input"
          />
        </label>
        <div className="flex gap-4">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span className="font-medium">Rate</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="input"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span className="font-medium">Rate type</span>
            <select
              value={rateType}
              onChange={(e) => setRateType(e.target.value as RateType)}
              className="input"
            >
              <option value="hourly">Hourly</option>
              <option value="fixed">Fixed</option>
              <option value="negotiable">Negotiable</option>
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Area</span>
          <input
            required
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="e.g. Lagao, General Santos City"
            className="input"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {submitting ? "Posting..." : "Post listing"}
        </button>
      </form>
    </main>
  );
}
