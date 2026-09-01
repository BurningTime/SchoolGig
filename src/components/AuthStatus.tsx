"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthStatus() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resets derived state when signed out
      setIsAdmin(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    supabase.rpc("is_admin").then(({ data }) => setIsAdmin(Boolean(data)));
  }, [userId]);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (userId === undefined) {
    return <div className="h-9 w-24" />;
  }

  if (userId === null) {
    return (
      <div className="flex items-center gap-4 text-sm">
        <Link href="/login" className="hover:underline">
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-white hover:bg-neutral-700"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      {isAdmin && (
        <Link href="/admin" className="hover:underline">
          Admin
        </Link>
      )}
      <Link href="/listings/new" className="hover:underline">
        Post a listing
      </Link>
      <Link href="/jobs/new" className="hover:underline">
        Post a job
      </Link>
      <Link href="/messages" className="hover:underline">
        Messages
      </Link>
      <Link href="/profile" className="hover:underline">
        Profile
      </Link>
      <button
        onClick={handleLogout}
        className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100"
      >
        Log out
      </button>
    </div>
  );
}
