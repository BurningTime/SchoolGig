import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { VerificationQueue, type PendingVerification } from "@/components/admin/VerificationQueue";

export default async function AdminVerificationsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: isAdmin } = await supabase.rpc("is_admin");

  if (!isAdmin) {
    redirect("/");
  }

  const { data: verifications } = await supabase
    .from("verifications")
    .select("user_id, status, student_id_doc_path, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const userIds = (verifications ?? []).map((v) => v.user_id);

  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, name").in("id", userIds)
      : { data: [] };

  const nameByUserId = new Map((profiles ?? []).map((p) => [p.id, p.name]));

  const pending: PendingVerification[] = (verifications ?? []).map((v) => ({
    userId: v.user_id,
    name: nameByUserId.get(v.user_id) ?? "(unknown)",
    studentIdDocPath: v.student_id_doc_path,
    createdAt: v.created_at,
  }));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <h1 className="mb-6 text-xl font-semibold">Verification queue</h1>
      <VerificationQueue initialPending={pending} />
    </main>
  );
}
