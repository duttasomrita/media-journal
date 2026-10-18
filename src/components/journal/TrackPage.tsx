import { useMemo, useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { CheckCircle2, Trash2, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  addToMonth, fetchItems, masterStatus, MONTHS, removeEntry, removeItem, updateEntry, WATCH_TYPES,
  type ItemWithEntries, type Track,
} from "@/lib/media";
import { AddMediaDialog } from "./AddMediaDialog";
import { EntryRow, type EntryPatch } from "./EntryRow";
import { Cover } from "./Cover";

export const itemsQuery = (track: Track) => queryOptions({ queryKey: ["items", track], queryFn: () => fetchItems(track) });

export function TrackPage({ track, hero }: { track: Track; hero: string }) {
  const qc = useQueryClient();
  const { data: items } = useSuspenseQuery(itemsQuery(track));
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [filter, setFilter] = useState("");
  const themeClass = track === "watch" ? "theme-watch" : "theme-read";
  const invalidate = () => { qc.invalidateQueries({ queryKey: ["items", track] }); qc.invalidateQueries({ queryKey: ["completed"] }); };

  const upd = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: EntryPatch }) => updateEntry(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["items", track] });
      qc.setQueryData<ItemWithEntries[]>(["items", track], (old) =>
        old?.map((it) => ({ ...it, monthly_entries: it.monthly_entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      );
    },
    onError: (e: any) => toast.error(e.message),
    onSettled: invalidate,
  });

  const monthRows = useMemo(
    () => items.flatMap((it) => it.monthly_entries.filter((e) => e.year === year && e.month === month).map((e) => ({ entry: e, item: it })))
      .sort((a, b) => a.entry.created_at.localeCompare(b.entry.created_at)),
    [items, year, month],
  );
  const doneCount = monthRows.filter((r) => r.entry.completed).length;
  const notInMonth = items.filter((it) => !it.monthly_entries.some((e) => e.year === year && e.month === month));

  async function add(id: string) {
    try { await addToMonth(id, year, month); invalidate(); } catch (e: any) { toast.error(e.message); }
  }

  const years = Array.from({ length: 8 }, (_, i) => now.getFullYear() + 1 - i);
  const filtered = items.filter((it) => it.title.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border">
        <img src={hero} alt="" width={1600} height={704} className="h-36 w-full object-cover sm:h-48" />
        <div className="absolute inset-0 bg-fade" />
        <div className="absolute bottom-3 left-4">
          <h1 className="font-display text-5xl font-semibold text-foreground sm:text-6xl">{track === "watch" ? "Watch Track" : "Read Track"}</h1>
        </div>
      </section>
      {track === "watch" && <div className="film-strip" />}

      <Tabs defaultValue="month">
        <TabsList>
          <TabsTrigger value="month">Monthly list</TabsTrigger>
          <TabsTrigger value="master">Master list ({items.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{MONTHS.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <div className="ml-auto flex flex-wrap gap-2">
              {notInMonth.length > 0 && (
                <Select value="" onValueChange={add}>
                  <SelectTrigger className="h-9 w-44"><CalendarPlus className="h-4 w-4" /><SelectValue placeholder="From master list" /></SelectTrigger>
                  <SelectContent className={themeClass}>
                    {notInMonth.map((it) => <SelectItem key={it.id} value={it.id}>{it.title}{it.year ? ` (${it.year})` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <AddMediaDialog track={track} themeClass={themeClass} label="Add new" onAdded={(it) => add(it.id)} />
            </div>
          </div>

          {monthRows.length > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{MONTHS[month - 1]} {year}</span><span>{doneCount} of {monthRows.length} completed</span>
              </div>
              <Progress value={(doneCount / monthRows.length) * 100} className="h-1.5" />
            </div>
          )}

          <ul className="space-y-2">
            {monthRows.map(({ entry, item }) => (
              <EntryRow
                key={entry.id} entry={entry} item={item}
                onUpdate={(patch) => upd.mutate({ id: entry.id, patch })}
                onRemove={async () => { await removeEntry(entry.id); invalidate(); }}
              />
            ))}
          </ul>
          {monthRows.length === 0 && (
            <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
              Nothing planned for {MONTHS[month - 1]} yet. Add something from your master list or search for a new title.
            </div>
          )}
        </TabsContent>

        <TabsContent value="master" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder="Filter…" className="max-w-xs" value={filter} onChange={(e) => setFilter(e.target.value)} />
            <div className="ml-auto"><AddMediaDialog track={track} themeClass={themeClass} onAdded={invalidate} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((it) => {
              const s = masterStatus(it.monthly_entries);
              return (
                <div key={it.id} className="poster-hover group relative fade-up">
                  <Cover src={it.cover_url} title={it.title} track={track} className="w-full" />
                  {s.completed && (
                    <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      <CheckCircle2 className="h-3 w-3" /> {track === "watch" ? "Watched" : "Read"}{s.timesCompleted > 1 ? ` ×${s.timesCompleted}` : ""}
                    </span>
                  )}
                  <div className="mt-2">
                    <p className="line-clamp-1 text-sm font-semibold">{it.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {[it.year, track === "watch" ? WATCH_TYPES.find((t) => t.value === it.media_type)?.label : it.creator].filter(Boolean).join(" · ")}
                    </p>
                    {s.lastCompleted && <p className="text-xs text-primary">Finished {s.lastCompleted}</p>}
                  </div>
                  <div className="mt-1 flex gap-1">
                    <Button size="sm" variant="secondary" className="h-7 flex-1 text-xs" onClick={() => add(it.id).then(() => toast.success(`Added to ${MONTHS[month - 1]}`))}>
                      + {MONTHS[month - 1]?.slice(0, 3)}
                    </Button>
                    <Button
                      size="icon" variant="ghost" className="h-7 w-7" aria-label="Delete"
                      onClick={async () => { if (confirm(`Delete “${it.title}” and all its monthly records?`)) { await removeItem(it.id); invalidate(); } }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          {items.length === 0 && <p className="py-10 text-center text-muted-foreground">Your master list is empty.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
