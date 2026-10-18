import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Search, Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { searchMedia, type SearchResult } from "@/lib/search.functions";
import { ensureItem, WATCH_TYPES, type MediaDraft, type MediaItem, type Track } from "@/lib/media";
import { Cover } from "./Cover";

export function AddMediaDialog({
  track, onAdded, label = "Add title", themeClass,
}: { track: Track; onAdded: (item: MediaItem) => Promise<void> | void; label?: string; themeClass: string }) {
  const [open, setOpen] = useState(false);
  const search = useServerFn(searchMedia);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manual, setManual] = useState({ title: "", creator: "", year: "", media_type: track === "watch" ? "movie" : "book", cover_url: "", description: "" });

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    let cancel = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await search({ data: { q, track } });
        if (!cancel) setResults(r);
      } catch { if (!cancel) setResults([]); }
      finally { if (!cancel) setLoading(false); }
    }, 350);
    return () => { cancel = true; clearTimeout(t); };
  }, [q, track, search]);

  async function save(draft: MediaDraft) {
    setSaving(true);
    try {
      const item = await ensureItem(draft);
      await onAdded(item);
      toast.success(`Added “${item.title}”`);
      setOpen(false); setQ(""); setResults([]);
      setManual((m) => ({ ...m, title: "", creator: "", year: "", cover_url: "", description: "" }));
    } catch (e: any) {
      toast.error(e.message ?? "Could not add");
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4" /> {label}</Button>
      </DialogTrigger>
      <DialogContent className={`${themeClass} max-h-[90vh] overflow-y-auto bg-background text-foreground sm:max-w-lg`}>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{track === "watch" ? "Add a movie or show" : "Add a book"}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="search">
          <TabsList className="w-full">
            <TabsTrigger value="search" className="flex-1">Search</TabsTrigger>
            <TabsTrigger value="manual" className="flex-1">Manual entry</TabsTrigger>
          </TabsList>
          <TabsContent value="search" className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input autoFocus className="pl-9" placeholder={track === "watch" ? "e.g. Dune, Succession…" : "e.g. Pride and Prejudice…"} value={q} onChange={(e) => setQ(e.target.value)} />
              {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
            </div>
            <ul className="space-y-1">
              {results.map((r) => (
                <li key={r.external_id}>
                  <button
                    disabled={saving}
                    onClick={() => save({ ...r, track })}
                    className="flex w-full gap-3 rounded-lg p-2 text-left transition hover:bg-secondary"
                  >
                    <Cover src={r.cover_url} title={r.title} track={track} className="w-12 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium leading-tight">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {[r.year, track === "watch" ? WATCH_TYPES.find((t) => t.value === r.media_type)?.label : r.creator].filter(Boolean).join(" · ")}
                      </p>
                      {r.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>}
                    </div>
                  </button>
                </li>
              ))}
              {!loading && q.trim().length >= 2 && results.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">No matches — try the Manual entry tab.</p>
              )}
            </ul>
          </TabsContent>
          <TabsContent value="manual">
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!manual.title.trim()) return;
                const y = parseInt(manual.year, 10);
                save({
                  track, external_id: null, title: manual.title,
                  creator: manual.creator || null, cover_url: manual.cover_url || null,
                  year: Number.isFinite(y) ? y : null, media_type: manual.media_type,
                  description: manual.description || null,
                });
              }}
            >
              <div className="space-y-1.5"><Label>Title</Label><Input required value={manual.title} onChange={(e) => setManual({ ...manual, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>{track === "watch" ? "Studio / network" : "Author"}</Label><Input value={manual.creator} onChange={(e) => setManual({ ...manual, creator: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Year</Label><Input inputMode="numeric" value={manual.year} onChange={(e) => setManual({ ...manual, year: e.target.value })} /></div>
              </div>
              {track === "watch" && (
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={manual.media_type} onValueChange={(v) => setManual({ ...manual, media_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{WATCH_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5"><Label>Cover image link (optional)</Label><Input type="url" value={manual.cover_url} onChange={(e) => setManual({ ...manual, cover_url: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} value={manual.description} onChange={(e) => setManual({ ...manual, description: e.target.value })} /></div>
              <Button type="submit" className="w-full" disabled={saving}>Save</Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
