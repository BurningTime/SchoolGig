import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-semibold">CampusGig</h1>
      <p className="max-w-md text-sm text-neutral-500">
        A verified, student-only gig board. Browse services offered by
        verified local students, or sign up to list your own.
      </p>
      <div className="flex gap-3">
        <Link
          href="/listings"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700"
        >
          Browse listings
        </Link>
        <Link
          href="/signup"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100"
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
