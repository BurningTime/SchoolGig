import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; area?: string; q?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: categories } = await supabase.from("categories").select("id, name, slug").order("name");

  let query = supabase
    .from("job_posts")
    .select("id, user_id, title, description, budget, date_needed, area, created_at, category_id, categories(name)")
    .eq("status", "open");

  const selectedCategory = categories?.find((c) => c.slug === params.category);
  if (selectedCategory) {
    query = query.eq("category_id", selectedCategory.id);
  }
  if (params.area) {
    query = query.ilike("area", `%${params.area}%`);
  }
  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%`);
  }

  query =
    params.sort === "budget_asc"
      ? query.order("budget", { ascending: true, nullsFirst: false })
      : params.sort === "budget_desc"
        ? query.order("budget", { ascending: false, nullsFirst: false })
        : query.order("created_at", { ascending: false });

  const { data: jobs } = await query;

  const userIds = [...new Set((jobs ?? []).map((j) => j.user_id))];
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, name").in("id", userIds)
      : { data: [] };
  const nameByUserId = new Map((profiles ?? []).map((p) => [p.id, p.name]));

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold">Browse jobs</h1>

      <form className="mb-6 flex flex-wrap gap-3" action="/jobs">
        <input
          type="text"
          name="q"
          defaultValue={params.q}
          placeholder="Search title or description"
          className="input max-w-xs"
        />
        <select name="category" defaultValue={params.category ?? ""} className="input max-w-[10rem]">
          <option value="">All categories</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="area"
          defaultValue={params.area}
          placeholder="Area"
          className="input max-w-[10rem]"
        />
        <select name="sort" defaultValue={params.sort ?? "newest"} className="input max-w-[10rem]">
          <option value="newest">Newest</option>
          <option value="budget_asc">Budget: low to high</option>
          <option value="budget_desc">Budget: high to low</option>
        </select>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700"
        >
          Filter
        </button>
      </form>

      {jobs && jobs.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={`/jobs/${job.id}`}
                className="block h-full rounded-md border border-neutral-200 p-4 hover:bg-neutral-50"
              >
                <p className="text-xs font-medium uppercase text-neutral-500">
                  {(job.categories as unknown as { name: string } | null)?.name}
                </p>
                <p className="mt-1 font-medium">{job.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{job.description}</p>
                <p className="mt-2 text-sm text-neutral-500">
                  {job.area}
                  {job.budget ? ` · ₱${job.budget}` : ""}
                  {job.date_needed ? ` · needed ${job.date_needed}` : ""}
                </p>
                <p className="mt-1 text-xs text-neutral-400">
                  by {nameByUserId.get(job.user_id) ?? "a verified student"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-500">No jobs match your filters yet.</p>
      )}
    </main>
  );
}
