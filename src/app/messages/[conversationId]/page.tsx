"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ReportButton } from "@/components/ReportButton";

interface Message {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

const POLL_INTERVAL_MS = 4000;

export default function ConversationThreadPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [otherName, setOtherName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [hireStatus, setHireStatus] = useState<"idle" | "hiring" | "hired">("idle");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(
    async (supabase: ReturnType<typeof createSupabaseBrowserClient>) => {
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, body, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      setMessages((data ?? []).map((m) => ({ id: m.id, senderId: m.sender_id, body: m.body, createdAt: m.created_at })));
      await supabase.rpc("mark_conversation_read", { p_conversation_id: conversationId });
    },
    [conversationId]
  );

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }
    setUserId(user.id);

    const { data: conversation } = await supabase
      .from("conversations")
      .select("participant_a_id, participant_b_id")
      .eq("id", conversationId)
      .single();

    if (!conversation) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const other =
      conversation.participant_a_id === user.id
        ? conversation.participant_b_id
        : conversation.participant_a_id;
    setOtherUserId(other);

    const { data: profile } = await supabase.from("profiles").select("name").eq("id", other).single();
    setOtherName(profile?.name ?? "(unknown)");

    const { data: existingEngagement } = await supabase
      .from("engagements")
      .select("id")
      .or(
        `and(poster_id.eq.${user.id},worker_id.eq.${other}),and(poster_id.eq.${other},worker_id.eq.${user.id})`
      )
      .limit(1)
      .maybeSingle();
    if (existingEngagement) {
      setHireStatus("hired");
    }

    await fetchMessages(supabase);
    setLoading(false);
  }, [conversationId, router, fetchMessages]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    load();
  }, [load]);

  useEffect(() => {
    if (loading || notFound) return;
    const supabase = createSupabaseBrowserClient();
    const interval = setInterval(() => {
      fetchMessages(supabase);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loading, notFound, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !userId) return;

    const supabase = createSupabaseBrowserClient();
    const text = body;
    setBody("");

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: userId,
      body: text,
    });

    await fetchMessages(supabase);
  }

  async function handleHire() {
    if (!userId || !otherUserId) return;
    setHireStatus("hiring");

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("engagements").insert({
      poster_id: userId,
      worker_id: otherUserId,
    });

    setHireStatus(error ? "idle" : "hired");
  }

  if (loading) {
    return <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">Loading...</main>;
  }

  if (notFound) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <p className="text-sm text-neutral-500">
          Conversation not found.{" "}
          <Link href="/messages" className="underline">
            Back to messages
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-neutral-200 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/messages" className="text-sm text-neutral-500 hover:underline">
            ← Messages
          </Link>
          {otherUserId && (
            <Link href={`/u/${otherUserId}`} className="text-sm font-medium hover:underline">
              {otherName}
            </Link>
          )}
        </div>
        <button
          onClick={handleHire}
          disabled={hireStatus !== "idle"}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-100 disabled:opacity-50"
        >
          {hireStatus === "hired" ? "Hired ✓" : hireStatus === "hiring" ? "Marking..." : "I hired this person"}
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto py-2">
        {messages.map((m) => (
          <div key={m.id} className={`flex max-w-[75%] flex-col gap-1 ${m.senderId === userId ? "self-end" : "self-start"}`}>
            <div
              className={`rounded-lg px-3 py-2 text-sm ${
                m.senderId === userId ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-900"
              }`}
            >
              {m.body}
            </div>
            {m.senderId !== userId && <ReportButton targetType="message" targetId={m.id} />}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="mt-3 flex gap-2 border-t border-neutral-200 pt-3">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message..."
          className="input flex-1"
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700"
        >
          Send
        </button>
      </form>
    </main>
  );
}
