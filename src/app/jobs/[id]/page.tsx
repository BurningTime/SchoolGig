import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { MessageButton } from "@/components/MessageButton";
import { JobApplicationPanel } from "@/components/jobs/JobApplicationPanel";
import { ReportButton } from "@/components/ReportButton";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: job } = await supabase
    .from("job_posts")
    .select("*, categories(name)")
    .eq("id", id)
    .single();

  if (!job) {
    notFound();
  }

  const { data: poster } = await supabase
    .from("profiles")
    .select("id, name, photo_url, is_verified")
    .eq("id", job.user_id)
    .single();

  const categoryName = (job.categories as unknown as { name: string } | null)?.name;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <p className="text-xs font-medium uppercase text-neutral-500">{categoryName}</p>
      <h1 className="mt-1 text-2xl font-semibold">{job.title}</h1>
      <p className="mt-2 text-sm text-neutral-500">
        {job.area}
        {job.budget ? ` · ₱${job.budget}` : ""}
        {job.date_needed ? ` · needed ${job.date_needed}` : ""}
        {job.status !== "open" ? ` · ${job.status}` : ""}
      </p>

      <p className="mt-6 whitespace-pre-wrap text-sm">{job.description}</p>

      <div className="mt-2">
        <ReportButton targetType="job" targetId={job.id} />
      </div>

      {poster && (
        <div className="mt-8 flex items-center justify-between gap-3 rounded-md border border-neutral-200 p-4">
          <Link href={`/u/${poster.id}`} className="flex items-center gap-3 hover:opacity-80">
            {poster.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={poster.photo_url}
                alt={poster.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-neutral-200" />
            )}
            <span className="flex items-center gap-2 text-sm font-medium">
              {poster.name}
              <VerifiedBadge status={poster.is_verified ? "verified" : "unverified"} />
            </span>
          </Link>
          <MessageButton otherUserId={poster.id} />
        </div>
      )}

      <div className="mt-8">
        <JobApplicationPanel jobId={job.id} jobStatus={job.status} posterId={job.user_id} />
      </div>
    </main>
  );
}
