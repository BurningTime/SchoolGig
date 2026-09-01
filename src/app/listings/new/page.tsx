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
  const [userId, setUserId] = useState<string | null>(null);
  const [posterName, setPosterName] = useState("");
  const [posterPhotoUrl, setPosterPhotoUrl] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rate, setRate] = useState("");
  const [rateType, setRateType] = useState<RateType>("negotiable");
  const [area, setArea] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
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
    setUserId(user.id);

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

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPhotoPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId || !userId) return;

    setSubmitting(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    let photoUrl: string | null = null;

    if (photoFile) {
      const ext = photoFile.name.split(".").pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("listing-photos")
        .upload(path, photoFile);

      if (uploadError) {
        setError(uploadError.message);
        setSubmitting(false);
        return;
      }
      photoUrl = supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl;
    }

    const { data, error: insertError } = await supabase
      .from("service_listings")
      .insert({
        user_id: userId,
        category_id: categoryId,
        title,
        description,
        rate: rate ? Number(rate) : null,
        rate_type: rateType,
        area,
        photo_url: photoUrl,
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

  const selectedCategoryName = categories.find((c) => c.id === categoryId)?.name;

  return (
    <main className="min-h-full flex-1 bg-[#DDDCDB]">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold text-[#3C4044]">Create listing</h1>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 md:grid-cols-[1fr_360px]"
        >
          {/* Form column */}
          <div className="flex flex-col gap-5 rounded-xl bg-white p-6 shadow-sm">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#3C4044]">Photos</span>
              <div className="relative flex aspect-square w-full max-w-[220px] items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-[#EDBF9B] bg-[#DDDCDB]/40 hover:border-[#FD7B41]">
                {photoPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreviewUrl} alt="Listing preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-[#3C4044]/60">
                    <span className="text-3xl">+</span>
                    <span className="text-xs font-medium">Add photo</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </div>
            </label>

            <hr className="border-[#DDDCDB]" />

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-[#3C4044]">Category</span>
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
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-[#3C4044]">Title</span>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What are you offering?"
                className="fb-input"
              />
            </label>

            <div className="flex gap-4">
              <label className="flex flex-1 flex-col gap-1 text-sm">
                <span className="font-semibold text-[#3C4044]">Price</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#3C4044]/60">₱</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="0.00"
                    className="fb-input"
                  />
                </div>
              </label>
              <label className="flex flex-1 flex-col gap-1 text-sm">
                <span className="font-semibold text-[#3C4044]">Rate type</span>
                <select
                  value={rateType}
                  onChange={(e) => setRateType(e.target.value as RateType)}
                  className="fb-input"
                >
                  <option value="hourly">Hourly</option>
                  <option value="fixed">Fixed</option>
                  <option value="negotiable">Negotiable</option>
                </select>
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
                placeholder="Describe what you're offering, your experience, and anything a buyer should know."
                className="fb-input"
              />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 w-full rounded-md bg-[#FD7B41] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e8672f] disabled:opacity-50"
            >
              {submitting ? "Publishing..." : "Publish listing"}
            </button>
          </div>

          {/* Live preview column */}
          <div className="md:sticky md:top-6 md:self-start">
            <p className="mb-2 text-sm font-semibold text-[#3C4044]/70">Preview</p>
            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
              <div className="flex aspect-square w-full items-center justify-center bg-[#DDDCDB]">
                {photoPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreviewUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl text-[#3C4044]/30">📷</span>
                )}
              </div>
              <div className="flex flex-col gap-1 p-4">
                {selectedCategoryName && (
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[#FD7B41]">
                    {selectedCategoryName}
                  </span>
                )}
                <span className="font-semibold text-[#3C4044]">{title || "Your listing title"}</span>
                <span className="text-sm text-[#3C4044]">
                  {rate ? `₱${rate}` : "Price"}
                  {rate && rateType !== "fixed" ? ` (${rateType})` : ""}
                </span>
                <span className="text-xs text-[#3C4044]/60">{area || "Area"}</span>
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
