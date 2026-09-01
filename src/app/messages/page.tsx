"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface ConversationRow {
  id: string;
  otherUserId: string;
  otherName: string;
  lastMessage: string | null;
  lastAt: string | null;
  hasUnread: boolean;
}

export default function MessagesInboxPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: convos } = await supabase
      .from("conversations")
      .select("id, participant_a_id, participant_b_id")
      .or(`participant_a_id.eq.${user.id},participant_b_id.eq.${user.id}`);

    const otherIds = (convos ?? []).map((c) =>
      c.participant_a_id === user.id ? c.participant_b_id : c.participant_a_id
    );

    const { data: profiles } =
      otherIds.length > 0
        ? await supabase.from("profiles").select("id, name").in("id", otherIds)
        : { data: [] };
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.name]));

    const rows = await Promise.all(
      (convos ?? []).map(async (c) => {
        const otherUserId = c.participant_a_id === user.id ? c.participant_b_id : c.participant_a_id;

        const { data: lastMsg } = await supabase
          .from("messages")
          .select("body, created_at")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { count: unreadCount } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .eq("is_read", false)
          .neq("sender_id", user.id);

        return {
          id: c.id,
          otherUserId,
          otherName: nameById.get(otherUserId) ?? "(unknown)",
          lastMessage: lastMsg?.body ?? null,
          lastAt: lastMsg?.created_at ?? null,
          hasUnread: (unreadCount ?? 0) > 0,
        };
      })
    );

    rows.sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? ""));
    setConversations(rows);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
  }, [load]);

  if (loading) {
    return <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">Loading...</main>;
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="mb-6 text-xl font-semibold">Messages</h1>
      {conversations.length === 0 ? (
        <p className="text-sm text-neutral-500">No conversations yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/messages/${c.id}`}
                className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 p-3 hover:bg-neutral-50"
              >
                <div>
                  <p className={`text-sm ${c.hasUnread ? "font-semibold" : "font-medium"}`}>
                    {c.otherName}
                  </p>
                  {c.lastMessage && (
                    <p className="mt-0.5 line-clamp-1 text-sm text-neutral-500">{c.lastMessage}</p>
                  )}
                </div>
                {c.hasUnread && <span className="h-2.5 w-2.5 flex-none rounded-full bg-blue-600" />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
