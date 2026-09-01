import Link from "next/link";
import { createSupabaseServerClient, requireAdmin } from "@/lib/supabase/server";

export default async function AdminHubPage() {
  const supabase = await createSupabaseServerClient();
  await requireAdmin(supabase);

  const [{ count: pendingCount }, { count: reportCount }] = await Promise.all([
    supabase.from("verifications").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "open"),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="mb-6 text-xl font-semibold">Admin</h1>
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/verifications"
          className="flex items-center justify-between rounded-md border border-neutral-200 p-4 hover:bg-neutral-50"
        >
          <span className="font-medium">Verification queue</span>
          <span className="text-sm text-neutral-500">{pendingCount ?? 0} pending</span>
        </Link>
        <Link
          href="/admin/reports"
          className="flex items-center justify-between rounded-md border border-neutral-200 p-4 hover:bg-neutral-50"
        >
          <span className="font-medium">Reports</span>
          <span className="text-sm text-neutral-500">{reportCount ?? 0} open</span>
        </Link>
      </div>
    </main>
  );
}
