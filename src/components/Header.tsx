import Link from "next/link";
import { AuthStatus } from "./AuthStatus";

export function Header() {
  return (
    <header className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-[30px] border border-[#3C4044]/10 bg-white/10 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FD7B41] text-sm font-black text-white shadow-[0_10px_20px_rgba(253,123,65,0.3)]">
              R
            </span>
            <span className="text-[20px] font-black tracking-[0.08em] text-[#3C4044]">
              RAKET
            </span>
          </Link>

          <AuthStatus />
        </div>
      </div>
    </header>
  );
}
