import { supabase } from "@/integrations/supabase/client";

export type Track = "watch" | "read";

export type MediaItem = {
  id: string;
  track: Track;
  external_id: string | null;
  title: string;
  creator: string | null;
  cover_url: string | null;
  year: number | null;
  media_type: string;
  description: string | null;
  created_at: string;
};

export type Entry = {
  id: string;
  media_id: string;
  year: number;
  month: number;
  completed: boolean;
  completed_at: string | null;
  rating: number | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
};

export type ItemWithEntries = MediaItem & { monthly_entries: Entry[] };
export type EntryWithItem = Entry & { media_items: MediaItem };

export type MediaDraft = Omit<MediaItem, "id" | "created_at">;

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const WATCH_TYPES = [
  { value: "movie", label: "Movie" },
  { value: "tv", label: "TV show" },
  { value: "series", label: "Series" },
  { value: "documentary", label: "Documentary" },
];

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Master status derives from completion records: completed if any month marked it complete. */
export function masterStatus(entries: Pick<Entry, "completed" | "completed_at">[]) {
  const done = entries.filter((e) => e.completed);
  const lastCompleted = done
    .map((e) => e.completed_at)
    .filter((d): d is string => !!d)
    .sort()
    .at(-1) ?? null;
  return { completed: done.length > 0, timesCompleted: done.length, lastCompleted };
}

export async function fetchItems(track: Track): Promise<ItemWithEntries[]> {
  const { data, error } = await supabase
    .from("media_items")
    .select("*, monthly_entries(*)")
    .eq("track", track)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as ItemWithEntries[];
}

export async function fetchCompleted(): Promise<EntryWithItem[]> {
  const { data, error } = await supabase
    .from("monthly_entries")
    .select("*, media_items(*)")
    .eq("completed", true)
    .order("completed_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data as unknown as EntryWithItem[];
}

/** Find an existing master record for this media, or create one. Never duplicates. */
export async function ensureItem(draft: MediaDraft): Promise<MediaItem> {
  let q = supabase.from("media_items").select("*").eq("track", draft.track);
  if (draft.external_id) q = q.eq("external_id", draft.external_id);
  else {
    q = q.is("external_id", null).ilike("title", draft.title.trim());
    q = draft.year ? q.eq("year", draft.year) : q.is("year", null);
  }
  const { data: existing } = await q.limit(1).maybeSingle();
  if (existing) return existing as MediaItem;
  const { data, error } = await supabase
    .from("media_items")
    .insert({ ...draft, title: draft.title.trim() })
    .select()
    .single();
  if (error) throw error;
  return data as MediaItem;
}

export async function addToMonth(mediaId: string, year: number, month: number) {
  const { error } = await supabase
    .from("monthly_entries")
    .upsert({ media_id: mediaId, year, month }, { onConflict: "media_id,year,month", ignoreDuplicates: true });
  if (error) throw error;
}

export async function updateEntry(id: string, patch: Partial<Pick<Entry, "completed" | "completed_at" | "rating" | "remarks">>) {
  const { error } = await supabase
    .from("monthly_entries")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function removeEntry(id: string) {
  const { error } = await supabase.from("monthly_entries").delete().eq("id", id);
  if (error) throw error;
}

export async function removeItem(id: string) {
  const { error } = await supabase.from("media_items").delete().eq("id", id);
  if (error) throw error;
}
