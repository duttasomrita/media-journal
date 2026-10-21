import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Film, BookOpen, ArrowRight } from "lucide-react";
import { itemsQuery } from "@/components/journal/TrackPage";
import { Cover } from "@/components/journal/Cover";
import { Progress } from "@/components/ui/progress";
import { masterStatus, MONTHS, type ItemWithEntries } from "@/lib/media";
import watchHero from "@/assets/watch-collage.jpg";
import readHero from "@/assets/read-collage.jpg";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home — My Media Journal" },
      { name: "description", content: "Your watching and reading at a glance." },
      { property: "og:title", content: "Home — My Media Journal" },
      { property: "og:description", content: "Your watching and reading at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(itemsQuery("watch")), context.queryClient.ensureQueryData(itemsQuery("read"))]),
  component: HomePage,
});

function stats(items: ItemWithEntries[], y: number, m: number) {
  const done = items.filter((i) => masterStatus(i.monthly_entries).completed).length;
  const month = items.flatMap((i) => i.monthly_entries).filter((e) => e.year === y && e.month === m);
  return { total: items.length, done, monthTotal: month.length, monthDone: month.filter((e) => e.completed).length };
}

function HomePage() {
  const { data: watch } = useSuspenseQuery(itemsQuery("watch"));
  const { data: read } = useSuspenseQuery(itemsQuery("read"));
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1;
  const w = stats(watch, y, m), r = stats(read, y, m);
  const recent = [...watch, ...read]
    .flatMap((it) => it.monthly_entries.filter((e) => e.completed).map((e) => ({ it, e })))
    .sort((a, b) => (b.e.completed_at ?? "").localeCompare(a.e.completed_at ?? ""))
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">{MONTHS[m - 1]} {y}</p>
        <h1 className="font-display text-5xl">Your journal<span className="text-primary">.</span></h1>
        <p className="font-hand mt-2 text-2xl text-primary">A little collection of great stories.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TrackCard to="/watch" theme="theme-watch" img={watchHero} icon={<Film className="h-6 w-6" />} title="Watch Track"
          big={w.done} bigLabel="movies & shows watched" s={w} />
        <TrackCard to="/read" theme="theme-read" img={readHero} icon={<BookOpen className="h-6 w-6" />} title="Read Track"
          big={r.done} bigLabel="books read" s={r} />
      </div>
      <section>
        <h2 className="font-display mb-3 text-3xl">Recently completed</h2>
        {recent.length === 0 ? (
          <p className="text-muted-foreground">Nothing yet — tick something off in a monthly list.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {recent.map(({ it, e }) => (
              <div key={e.id} className="w-28 shrink-0 poster-hover">
                <Cover src={it.cover_url} title={it.title} track={it.track} className="w-full" />
                <p className="mt-1 line-clamp-1 text-sm font-medium">{it.title}</p>
                <p className="text-xs text-muted-foreground">{e.completed_at}{e.rating ? ` · ${e.rating}/10` : ""}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TrackCard({ to, theme, img, icon, title, big, bigLabel, s }: {
  to: "/watch" | "/read"; theme: string; img: string; icon: React.ReactNode; title: string; big: number; bigLabel: string;
  s: ReturnType<typeof stats>;
}) {
  const pct = s.monthTotal ? (s.monthDone / s.monthTotal) * 100 : 0;
  return (
    <Link to={to} className={`${theme} taped group relative block rounded-lg border bg-background text-foreground shadow-card`}>
      <img src={img} alt="" width={1600} height={800} className="h-44 w-full rounded-t-lg object-cover" />
      <div className="paper-surface space-y-3 p-5">
        <div className="flex items-center gap-2 text-primary">{icon}<h2 className="font-display text-3xl font-semibold text-foreground">{title}</h2></div>
        <p><span className="font-display text-5xl text-primary">{big}</span> <span className="text-sm text-muted-foreground">{bigLabel} · {s.total} in master list</span></p>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground"><span>This month</span><span>{s.monthDone} / {s.monthTotal}</span></div>
          <Progress value={pct} className="h-1.5" />
        </div>
        <span className="flex items-center gap-1 text-sm font-medium text-primary">Open this month's list <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
      </div>
    </Link>
  );
}
