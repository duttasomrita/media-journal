import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { todayISO, type Entry, type MediaItem } from "@/lib/media";
import { Cover } from "./Cover";

export type EntryPatch = Partial<Pick<Entry, "completed" | "completed_at" | "rating" | "remarks">>;

export function RatingSelect({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <Select value={value ? String(value) : "none"} onValueChange={(v) => onChange(v === "none" ? null : Number(v))}>
      <SelectTrigger className="h-8 w-24"><SelectValue placeholder="Rate" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No rating</SelectItem>
        {Array.from({ length: 10 }, (_, i) => 10 - i).map((n) => <SelectItem key={n} value={String(n)}>{n} / 10</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export function EntryRow({
  entry, item, onUpdate, onRemove,
}: { entry: Entry; item: MediaItem; onUpdate: (p: EntryPatch) => void; onRemove: () => void }) {
  const [remarks, setRemarks] = useState(entry.remarks ?? "");
  useEffect(() => setRemarks(entry.remarks ?? ""), [entry.remarks]);

  return (
    <li className={cn("fade-up flex gap-3 rounded-xl border bg-card p-3 transition", entry.completed && "border-primary/40")}>
      <Checkbox
        className="mt-1 h-5 w-5"
        checked={entry.completed}
        aria-label={`Mark ${item.title} completed`}
        onCheckedChange={(c) => onUpdate(c ? { completed: true, completed_at: entry.completed_at ?? todayISO() } : { completed: false, completed_at: null })}
      />
      <Cover src={item.cover_url} title={item.title} track={item.track} className="w-14 shrink-0 sm:w-16" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={cn("font-semibold leading-tight", entry.completed && "text-muted-foreground line-through decoration-primary/60")}>{item.title}</p>
            <p className="text-xs text-muted-foreground">{[item.year, item.creator].filter(Boolean).join(" · ")}</p>
          </div>
          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={onRemove} aria-label="Remove from this month">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        {entry.completed && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <RatingSelect value={entry.rating} onChange={(rating) => onUpdate({ rating })} />
              <Input
                type="date" className="h-8 w-40"
                value={entry.completed_at ?? ""}
                onChange={(e) => onUpdate({ completed_at: e.target.value || todayISO() })}
                aria-label="Completion date"
              />
            </div>
            <Textarea
              rows={2} placeholder="Your remarks…" value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              onBlur={() => remarks !== (entry.remarks ?? "") && onUpdate({ remarks: remarks || null })}
            />
          </div>
        )}
      </div>
    </li>
  );
}
