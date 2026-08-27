"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface PendingVerification {
  userId: string;
  name: string;
  studentIdDocPath: string | null;
  createdAt: string;
}

export function VerificationQueue({
  initialPending,
}: {
  initialPending: PendingVerification[];
}) {
  const [pending, setPending] = useState(initialPending);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    pending.forEach(async (item) => {
      if (!item.studentIdDocPath || imageUrls[item.userId]) return;
      const { data } = await supabase.storage
        .from("student-ids")
        .createSignedUrl(item.studentIdDocPath, 60 * 5);
      if (data?.signedUrl) {
        setImageUrls((prev) => ({ ...prev, [item.userId]: data.signedUrl }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  async function decide(userId: string, status: "verified" | "rejected") {
    setBusyUserId(userId);
    const supabase = createSupabaseBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase
      .from("verifications")
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    setPending((prev) => prev.filter((p) => p.userId !== userId));
    setBusyUserId(null);
  }

  if (pending.length === 0) {
    return <p className="text-sm text-neutral-500">No pending verifications.</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {pending.map((item) => (
        <li
          key={item.userId}
          className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-4">
            {imageUrls[item.userId] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrls[item.userId]}
                alt={`${item.name}'s student ID`}
                className="h-20 w-32 rounded object-cover"
              />
            ) : (
              <div className="h-20 w-32 rounded bg-neutral-100" />
            )}
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-neutral-500">
                Submitted {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              disabled={busyUserId === item.userId}
              onClick={() => decide(item.userId, "verified")}
              className="rounded-md bg-green-700 px-3 py-1.5 text-sm text-white hover:bg-green-800 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              disabled={busyUserId === item.userId}
              onClick={() => decide(item.userId, "rejected")}
              className="rounded-md bg-red-700 px-3 py-1.5 text-sm text-white hover:bg-red-800 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
