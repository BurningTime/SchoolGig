import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#D9D7D4] px-4 py-6 text-[#3C4044] sm:px-6 lg:px-8">
        <section className="mt-12 grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="pt-2">
            <div className="mb-5 inline-flex items-center rounded-full border border-[#3C4044]/10 bg-[#E6E3E0] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3C4044]/70">
              VERIFIED STUDENT GIGS
            </div>

            <h1 className="max-w-[620px] text-[72px] font-black leading-[0.9] tracking-[-0.08em] text-[#3C4044] sm:text-[82px] lg:text-[104px]">
              Work built for student life.
            </h1>

            <p className="mt-6 max-w-[560px] text-[18px] leading-[1.5] text-[#3C4044]/75">
              RAKET helps students discover trusted local opportunities that fit around classes, social life, and ambition.
            </p>

            <div className="mt-7 flex flex-wrap gap-4">
              <Link
                href="/listings"
                className="inline-flex items-center justify-center rounded-full bg-[#FD7B41] px-6 py-3 text-base font-semibold text-white shadow-[0_16px_28px_rgba(253,123,65,0.26)] transition hover:bg-[#ef6e31]"
              >
                Explore listings
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full border border-[#3C4044]/15 bg-white/10 px-6 py-3 text-base font-medium text-[#3C4044] transition hover:bg-white/20"
              >
                Post a service
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-end gap-8 text-[#3C4044]">
              <div>
                <span className="block text-[24px] font-black">12k+</span>
                <span className="text-[14px] text-[#3C4044]/70">students</span>
              </div>
              <div>
                <span className="block text-[24px] font-black">2.3k</span>
                <span className="text-[14px] text-[#3C4044]/70">jobs this week</span>
              </div>
              <div>
                <span className="block text-[24px] font-black">4.9/5</span>
                <span className="text-[14px] text-[#3C4044]/70">rating</span>
              </div>
            </div>
          </div>

          <div className="relative pt-3">
            <div className="rounded-[28px] border border-[#3C4044]/10 bg-[#E7E5E2] p-4 shadow-[0_18px_40px_rgba(60,64,68,0.08)]">
              <div className="flex items-center justify-between border-b border-[#3C4044]/10 pb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#3C4044]/60">
                    LIVE MARKET
                  </p>
                  <h2 className="mt-2 text-[28px] font-black leading-none text-[#3C4044]">
                    Campus jobs
                  </h2>
                </div>
                <span className="rounded-full bg-[#FD7B41]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#FD7B41]">
                  ACTIVE
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  ["Poster design", "$80 / project"],
                  ["Study tutor", "$25 / hr"],
                  ["Event photo", "$95 / event"],
                ].map(([title, price]) => (
                  <div
                    key={title}
                    className="flex items-center justify-between rounded-[18px] border border-[#3C4044]/10 bg-white/20 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex rounded-full bg-[#EDBF9B]/70 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#3C4044]">
                        FEATURED
                      </span>
                    </div>
                    <div className="flex w-full items-center justify-between gap-4 pl-3">
                      <p className="text-[20px] font-semibold text-[#3C4044]">{title}</p>
                      <p className="text-[20px] font-semibold text-[#3C4044]">{price}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[18px] bg-[#FD7B41] p-4 text-white">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/80">THIS WEEK</p>
                  <p className="mt-2 text-[38px] font-black leading-none">$14.8k</p>
                </div>
                <div className="rounded-[18px] border border-[#3C4044]/10 bg-white/15 p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#3C4044]/60">MATCH RATE</p>
                  <p className="mt-2 text-[38px] font-black leading-none text-[#3C4044]">76%</p>
                </div>
              </div>
            </div>
          </div>
        </section>
    </main>
  );
}
