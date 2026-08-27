"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { VerificationStatus } from "@/lib/supabase/types";
import { VerifiedBadge } from "@/components/VerifiedBadge";

export default function ProfilePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [school, setSchool] = useState("");
  const [courseYear, setCourseYear] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<VerificationStatus>("unverified");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);

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

    const [{ data: profile }, { data: verification }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("verifications").select("status").eq("user_id", user.id).single(),
    ]);

    if (profile) {
      setName(profile.name);
      setBio(profile.bio ?? "");
      setSchool(profile.school ?? "");
      setCourseYear(profile.course_year ?? "");
      setPhotoUrl(profile.photo_url);
    }
    setStatus(verification?.status ?? "unverified");
    setLoading(false);
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
  }, [load]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    const supabase = createSupabaseBrowserClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setPhotoUrl(`${data.publicUrl}?t=${Date.now()}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    setError(null);
    setSavedMessage(false);

    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        name,
        bio,
        school,
        course_year: courseYear,
        photo_url: photoUrl,
      })
      .eq("id", userId);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSavedMessage(true);
  }

  if (loading) {
    return <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">Loading...</main>;
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your profile</h1>
        <VerifiedBadge status={status} />
      </div>

      {status !== "verified" && (
        <Link
          href="/verify"
          className="mb-6 block rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800 hover:bg-amber-100"
        >
          {status === "pending"
            ? "Your verification is under review."
            : "Get verified to post listings →"}
        </Link>
      )}

      {userId && (
        <p className="mb-6 text-sm text-neutral-500">
          Public profile:{" "}
          <Link href={`/u/${userId}`} className="underline">
            /u/{userId}
          </Link>
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Photo</span>
          {photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt="Profile photo"
              className="mb-2 h-20 w-20 rounded-full object-cover"
            />
          )}
          <input type="file" accept="image/*" onChange={handleAvatarChange} className="text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Name</span>
          <input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">School</span>
          <input
            type="text"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Course / year</span>
          <input
            type="text"
            value={courseYear}
            onChange={(e) => setCourseYear(e.target.value)}
            className="input"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {savedMessage && <p className="text-sm text-green-700">Saved.</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-2 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </main>
  );
}
