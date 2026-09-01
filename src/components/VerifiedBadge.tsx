import type { VerificationStatus } from "@/lib/supabase/types";

export function VerifiedBadge({ status }: { status: VerificationStatus }) {
  if (status !== "verified") return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft/40 px-2.5 py-1 text-xs font-medium text-neutral-800">
      ✓ Verified student
    </span>
  );
}
