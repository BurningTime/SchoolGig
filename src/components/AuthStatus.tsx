"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthStatus() {
  const pathname = usePathname();
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

  function linkClass(path: string, exact = false) {
    const isActive = exact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
    return `rounded-full px-3 py-2 transition hover:bg-[#FD7B41]/15 active:bg-[#FD7B41] active:text-white ${
      isActive ? "bg-[#FD7B41] text-white" : ""
    }`;
  }

  if (userId === undefined) {
    return <div className="h-9 w-64" />;
  }

  if (userId === null) {
    return (
      <div className="flex items-center gap-3 text-sm text-[#3C4044]/80">
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/listings" className={linkClass("/listings")}>
            Browse
          </Link>
          <Link href="/jobs" className={linkClass("/jobs")}>
            Jobs
          </Link>
          <Link href="/signup" className={linkClass("/signup", true)}>
            Community
          </Link>
        </nav>
        <Link
          href="/login"
          className={`${linkClass("/login", true)} border border-[#3C4044]/15 font-medium text-[#3C4044]`}
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className={`${linkClass("/signup", true)} bg-[#FD7B41] font-semibold text-white shadow-[0_10px_20px_rgba(253,123,65,0.28)] hover:bg-[#ef6e31]`}
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm text-[#3C4044]/80">
      <nav className="hidden items-center gap-6 md:flex">
        <Link href="/listings" className={linkClass("/listings")}>
          Browse
        </Link>
        <Link href="/jobs" className={linkClass("/jobs")}>
          Jobs
        </Link>
        <Link href="/signup" className={linkClass("/signup", true)}>
          Community
        </Link>
      </nav>
      {isAdmin && (
        <Link href="/admin" className={`hidden lg:block ${linkClass("/admin")} `}>
          Admin
        </Link>
      )}
      <Link
        href="/jobs/new"
        className={`${linkClass("/jobs/new", true)} bg-[#FD7B41] font-semibold text-white shadow-[0_10px_20px_rgba(253,123,65,0.28)] hover:bg-[#ef6e31]`}
      >
        Post job
      </Link>
      <button
        onClick={handleLogout}
        className="rounded-full border border-[#3C4044]/15 px-4 py-2 font-medium text-[#3C4044] transition hover:bg-[#FD7B41]/15 active:bg-[#FD7B41] active:text-white"
      >
        Logout
      </button>
    </div>
  );
}
