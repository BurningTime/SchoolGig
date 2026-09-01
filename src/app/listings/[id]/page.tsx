import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { MessageButton } from "@/components/MessageButton";
import { ReportButton } from "@/components/ReportButton";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: listing } = await supabase
    .from("service_listings")
    .select("*, categories(name)")
    .eq("id", id)
    .single();

  if (!listing) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, photo_url, is_verified")
    .eq("id", listing.user_id)
    .single();

  const categoryName = (listing.categories as unknown as { name: string } | null)?.name;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <p className="text-xs font-medium uppercase text-neutral-500">{categoryName}</p>
      <h1 className="mt-1 text-2xl font-semibold">{listing.title}</h1>
      <p className="mt-2 text-sm text-neutral-500">
        {listing.area}
        {listing.rate
          ? ` · ₱${listing.rate} (${listing.rate_type})`
          : ` · ${listing.rate_type}`}
      </p>

      <p className="mt-6 whitespace-pre-wrap text-sm">{listing.description}</p>

      <div className="mt-2">
        <ReportButton targetType="listing" targetId={listing.id} />
      </div>

      {profile && (
        <div className="mt-8 flex items-center justify-between gap-3 rounded-md border border-neutral-200 p-4">
          <Link href={`/u/${profile.id}`} className="flex items-center gap-3 hover:opacity-80">
            {profile.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photo_url}
                alt={profile.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-neutral-200" />
            )}
            <span className="flex items-center gap-2 text-sm font-medium">
              {profile.name}
              <VerifiedBadge status={profile.is_verified ? "verified" : "unverified"} />
            </span>
          </Link>
          <MessageButton otherUserId={profile.id} />
        </div>
      )}
    </main>
  );
}
