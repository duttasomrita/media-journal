import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Cover } from "@/components/journal/Cover";
import { RatingSelect } from "@/components/journal/EntryRow";
import { fetchCompleted, updateEntry, MONTHS, type EntryWithItem } from "@/lib/media";

const completedQuery = queryOptions({ queryKey: ["completed"], queryFn: fetchCompleted });

export const Route = createFileRoute("/_authenticated/reviews")({
  head: () => ({
    meta: [
      { title: "My Reviews — My Media Journal" },
      { name: "description", content: "Browse and edit your ratings and remarks." },
      { property: "og:title", content: "My Reviews — My Media Journal" },
      { property: "og:description", content: "Browse and edit your ratings and remarks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(completedQuery),
  component: Reviews,
});

function Reviews() {
  const { data } = useSuspenseQuery(completedQuery);
  const [tab, setTab] = useState<"all" | "watch" | "read">("all");
  const [editing, setEditing] = useState<EntryWithItem | null>(null);
  const list = data.filter((e) => tab === "all" || e.media_items.track === tab);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-5xl">My Reviews</h1>
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="watch">Watched</TabsTrigger><TabsTrigger value="read">Read</TabsTrigger></TabsList>
      </Tabs>
      {list.length === 0 && <p className="text-muted-foreground">No completed items yet.</p>}
      <ul className="grid gap-3 md:grid-cols-2">
        {list.map((e) => (
          <li key={e.id} className={`${e.media_items.track === "read" ? "theme-read" : "theme-watch"} fade-up flex gap-3 rounded-xl border bg-background p-3 text-foreground`}>
            <Cover src={e.media_items.cover_url} title={e.media_items.title} track={e.media_items.track} className="w-16 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-xl font-semibold leading-tight">{e.media_items.title}</p>
                  <p className="text-xs text-muted-foreground">Finished {e.completed_at ?? "—"} · {MONTHS[e.month - 1]} {e.year} list</p>
                </div>
                {e.rating && <span className="flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground"><Star className="h-3 w-3" />{e.rating}/10</span>}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{e.remarks || <span className="italic text-muted-foreground">No remarks yet.</span>}</p>
              <Button size="sm" variant="secondary" className="mt-2 h-7" onClick={() => setEditing(e)}>Edit review</Button>
            </div>
          </li>
        ))}
      </ul>
      {editing && <EditDialog entry={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function EditDialog({ entry, onClose }: { entry: EntryWithItem; onClose: () => void }) {
  const qc = useQueryClient();
  const [rating, setRating] = useState(entry.rating);
  const [remarks, setRemarks] = useState(entry.remarks ?? "");
  const [date, setDate] = useState(entry.completed_at ?? "");
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try {
      await updateEntry(entry.id, { rating, remarks: remarks || null, completed_at: date || entry.completed_at });
      qc.invalidateQueries({ queryKey: ["completed"] });
      qc.invalidateQueries({ queryKey: ["items"] });
      toast.success("Review saved");
      onClose();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={`${entry.media_items.track === "read" ? "theme-read" : "theme-watch"} bg-background text-foreground`}>
        <DialogHeader><DialogTitle className="font-display text-2xl">{entry.media_items.title}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="space-y-1.5"><Label>Rating</Label><RatingSelect value={rating} onChange={setRating} /></div>
            <div className="space-y-1.5"><Label>Completed on</Label><Input type="date" className="h-8" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label>Remarks</Label><Textarea rows={5} value={remarks} onChange={(e) => setRemarks(e.target.value)} /></div>
          <Button className="w-full" onClick={save} disabled={busy}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
