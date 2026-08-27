import Link from "next/link";
import { AuthStatus } from "./AuthStatus";

export function Header() {
  return (
    <header className="border-b border-neutral-200">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold">
            CampusGig
          </Link>
          <Link href="/listings" className="text-sm hover:underline">
            Browse
          </Link>
        </div>
        <AuthStatus />
      </div>
    </header>
  );
}
