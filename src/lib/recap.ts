import type { EntryWithItem } from "./media";

/** Recaps follow the actual completion date, falling back to list month for undated records. */
export function monthlyRecap(entries: EntryWithItem[], year: number, month: number) {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const finished = entries.filter((e) => e.completed && (e.completed_at ? e.completed_at.startsWith(prefix) : e.year === year && e.month === month));
  const watch = finished.filter((e) => e.media_items.track === "watch");
  const read = finished.filter((e) => e.media_items.track === "read");
  const rated = finished.filter((e) => e.rating !== null);
  const favorites = [...rated].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.media_items.title.localeCompare(b.media_items.title)).slice(0, 3);
  const counts = new Map<string, number>();
  for (const e of watch) if (e.watch_platform) counts.set(e.watch_platform, (counts.get(e.watch_platform) ?? 0) + 1);
  const platforms = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return {
    finished, watch, read, favorites, platforms,
    total: finished.length,
    averageRating: rated.length ? Math.round(rated.reduce((sum, e) => sum + (e.rating ?? 0), 0) / rated.length * 10) / 10 : null,
  };
}

export function recapFingerprint(entries: EntryWithItem[]) {
  return JSON.stringify([...entries].sort((a, b) => a.id.localeCompare(b.id)).map((e) => ({
    id: e.id, title: e.media_items.title, track: e.media_items.track, type: e.media_items.media_type,
    description: e.media_items.description, creator: e.media_items.creator,
    rating: e.rating, remarks: e.remarks, date: e.completed_at, platform: e.watch_platform,
  })));
}