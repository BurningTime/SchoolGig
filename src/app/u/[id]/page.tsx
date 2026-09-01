import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { MessageButton } from "@/components/MessageButton";
import { ReportButton } from "@/components/ReportButton";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", id).single();

  if (!profile) {
    notFound();
  }

  const { data: listings } = await supabase
    .from("service_listings")
    .select("id, title, rate, rate_type, area")
    .eq("user_id", id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, comment, reviewer_id")
    .eq("reviewee_id", id)
    .order("created_at", { ascending: false });

  const reviewerIds = [...new Set((reviews ?? []).map((r) => r.reviewer_id))];
  const { data: reviewerProfiles } =
    reviewerIds.length > 0
      ? await supabase.from("profiles").select("id, name").in("id", reviewerIds)
      : { data: [] };
  const reviewerNameById = new Map((reviewerProfiles ?? []).map((p) => [p.id, p.name]));

  const averageRating =
    reviews && reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {profile.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.photo_url}
              alt={profile.name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-neutral-200" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{profile.name}</h1>
              <VerifiedBadge status={profile.is_verified ? "verified" : "unverified"} />
            </div>
            <p className="text-sm text-neutral-500">
              {[profile.school, profile.course_year].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <MessageButton otherUserId={profile.id} />
          <ReportButton targetType="user" targetId={profile.id} />
        </div>
      </div>

      {profile.bio && <p className="mt-4 text-sm">{profile.bio}</p>}

      <h2 className="mt-8 mb-3 text-sm font-semibold uppercase text-neutral-500">
        Active listings
      </h2>
      {listings && listings.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {listings.map((listing) => (
            <li key={listing.id}>
              <Link
                href={`/listings/${listing.id}`}
                className="block rounded-md border border-neutral-200 p-3 text-sm hover:bg-neutral-50"
              >
                <span className="font-medium">{listing.title}</span>
                <span className="ml-2 text-neutral-500">
                  {listing.area}
                  {listing.rate ? ` · ₱${listing.rate} (${listing.rate_type})` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-500">No active listings.</p>
      )}

      <h2 className="mt-8 mb-3 text-sm font-semibold uppercase text-neutral-500">
        Reviews {averageRating && `· ${averageRating} avg`}
      </h2>
      {reviews && reviews.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-md border border-neutral-200 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{reviewerNameById.get(r.reviewer_id) ?? "(unknown)"}</span>
                <span className="text-amber-500">
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </span>
              </div>
              {r.comment && <p className="mt-1 text-neutral-600">{r.comment}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-500">No reviews yet.</p>
      )}
    </main>
  );
}
