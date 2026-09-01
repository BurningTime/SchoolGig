import { createSupabaseServerClient, requireAdmin } from "@/lib/supabase/server";
import { ReportQueue, type OpenReport } from "@/components/admin/ReportQueue";
import type { ReportTargetType } from "@/lib/supabase/types";

export default async function AdminReportsPage() {
  const supabase = await createSupabaseServerClient();
  await requireAdmin(supabase);

  const { data: reports } = await supabase
    .from("reports")
    .select("id, reporter_id, target_type, target_id, reason, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: true });

  const reporterIds = [...new Set((reports ?? []).map((r) => r.reporter_id))];
  const { data: reporterProfiles } =
    reporterIds.length > 0
      ? await supabase.from("profiles").select("id, name").in("id", reporterIds)
      : { data: [] };
  const reporterNameById = new Map((reporterProfiles ?? []).map((p) => [p.id, p.name]));

  const byType = (t: ReportTargetType) => (reports ?? []).filter((r) => r.target_type === t);

  const listingIds = byType("listing").map((r) => r.target_id);
  const jobIds = byType("job").map((r) => r.target_id);
  const messageIds = byType("message").map((r) => r.target_id);
  const userIds = byType("user").map((r) => r.target_id);

  const [{ data: listings }, { data: jobs }, { data: messages }, { data: reportedProfiles }] =
    await Promise.all([
      listingIds.length > 0
        ? supabase.from("service_listings").select("id, title, user_id").in("id", listingIds)
        : Promise.resolve({ data: [] }),
      jobIds.length > 0
        ? supabase.from("job_posts").select("id, title, user_id").in("id", jobIds)
        : Promise.resolve({ data: [] }),
      messageIds.length > 0
        ? supabase.from("messages").select("id, body, sender_id").in("id", messageIds)
        : Promise.resolve({ data: [] }),
      userIds.length > 0
        ? supabase.from("profiles").select("id, name").in("id", userIds)
        : Promise.resolve({ data: [] }),
    ]);

  const listingById = new Map((listings ?? []).map((l) => [l.id, l]));
  const jobById = new Map((jobs ?? []).map((j) => [j.id, j]));
  const messageById = new Map((messages ?? []).map((m) => [m.id, m]));
  const profileById = new Map((reportedProfiles ?? []).map((p) => [p.id, p]));

  const openReports: OpenReport[] = (reports ?? []).map((r) => {
    let preview = "(content not found — may already be removed)";
    let resolvedUserId: string | null = null;

    if (r.target_type === "listing") {
      const l = listingById.get(r.target_id);
      if (l) {
        preview = `Listing: ${l.title}`;
        resolvedUserId = l.user_id;
      }
    } else if (r.target_type === "job") {
      const j = jobById.get(r.target_id);
      if (j) {
        preview = `Job: ${j.title}`;
        resolvedUserId = j.user_id;
      }
    } else if (r.target_type === "message") {
      const m = messageById.get(r.target_id);
      if (m) {
        preview = `Message: "${m.body}"`;
        resolvedUserId = m.sender_id;
      }
    } else if (r.target_type === "user") {
      const p = profileById.get(r.target_id);
      preview = `User: ${p?.name ?? "(unknown)"}`;
      resolvedUserId = r.target_id;
    }

    return {
      id: r.id,
      reporterName: reporterNameById.get(r.reporter_id) ?? "(unknown)",
      targetType: r.target_type,
      targetId: r.target_id,
      reason: r.reason,
      createdAt: r.created_at,
      preview,
      resolvedUserId,
    };
  });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <h1 className="mb-6 text-xl font-semibold">Reports</h1>
      <ReportQueue initialReports={openReports} />
    </main>
  );
}
