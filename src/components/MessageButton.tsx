"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function MessageButton({ otherUserId }: { otherUserId: string }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [opening, setOpening] = useState(false);

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
  }, [load]);

  async function handleClick() {
    if (!userId) {
      router.push("/login");
      return;
    }

    setOpening(true);
    const supabase = createSupabaseBrowserClient();
    const [a, b] = [userId, otherUserId].sort();

    await supabase
      .from("conversations")
      .upsert(
        { participant_a_id: a, participant_b_id: b },
        { onConflict: "participant_a_id,participant_b_id", ignoreDuplicates: true }
      );

    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("participant_a_id", a)
      .eq("participant_b_id", b)
      .single();

    setOpening(false);

    if (conversation) {
      router.push(`/messages/${conversation.id}`);
    }
  }

  if (userId === undefined || userId === otherUserId) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      disabled={opening}
      className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 disabled:opacity-50"
    >
      {opening ? "Opening..." : "Message"}
    </button>
  );
}
