import type { VerificationStatus } from "@/lib/supabase/types";

export function VerifiedBadge({ status }: { status: VerificationStatus }) {
  if (status !== "verified") return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
      ✓ Verified student
    </span>
  );
}
