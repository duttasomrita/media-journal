import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SearchResult = {
  external_id: string;
  title: string;
  creator: string | null;
  cover_url: string | null;
  year: number | null;
  media_type: string;
  description: string | null;
};

const yr = (s?: string | null) => {
  const n = s ? parseInt(s.slice(0, 4), 10) : NaN;
  return Number.isFinite(n) ? n : null;
};
const strip = (s?: string | null) => (s ? s.replace(/<[^>]+>/g, "").trim() : null);
const short = (s?: string | null) => (s && s.length > 600 ? s.slice(0, 597) + "…" : s ?? null);

async function getJson(url: string, init?: RequestInit) {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function searchWatch(q: string): Promise<SearchResult[]> {
  const key = process.env["TMDB_API_KEY"];
  if (key) {
    const isToken = key.length > 40;
    const url = `https://api.themoviedb.org/3/search/multi?include_adult=false&query=${encodeURIComponent(q)}${isToken ? "" : `&api_key=${key}`}`;
    const j = await getJson(url, isToken ? { headers: { Authorization: `Bearer ${key}` } } : undefined);
    return (j.results ?? [])
      .filter((r: any) => r.media_type === "movie" || r.media_type === "tv")
      .slice(0, 8)
      .map((r: any) => ({
        external_id: `tmdb:${r.media_type}:${r.id}`,
        title: r.title ?? r.name,
        creator: null,
        cover_url: r.poster_path ? `https://image.tmdb.org/t/p/w342${r.poster_path}` : null,
        year: yr(r.release_date ?? r.first_air_date),
        media_type: r.genre_ids?.includes(99) ? "documentary" : r.media_type === "tv" ? "tv" : "movie",
        description: short(r.overview),
      }));
  }
  // Keyless fallback: public title suggestions (movies & shows) + TVmaze (show details)
  const [sugg, shows] = await Promise.allSettled([
    getJson(`https://v3.sg.media-imdb.com/suggestion/x/${encodeURIComponent(q.trim().toLowerCase())}.json`),
    getJson(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(q)}`),
  ]);
  const out: SearchResult[] = [];
  const seen = new Set<string>();
  const typeMap: Record<string, string> = { movie: "movie", tvMovie: "movie", tvSeries: "tv", tvMiniSeries: "series", tvSpecial: "tv", short: "movie" };
  if (shows.status === "fulfilled") {
    for (const { show: s } of (shows.value ?? []).slice(0, 4)) {
      const y = yr(s.premiered);
      seen.add(`${String(s.name).toLowerCase()}|${y}`);
      out.push({
        external_id: `tvmaze:${s.id}`,
        title: s.name,
        creator: s.network?.name ?? s.webChannel?.name ?? null,
        cover_url: s.image?.medium?.replace("http://", "https://") ?? null,
        year: y,
        media_type: s.type === "Documentary" ? "documentary" : s.type === "Scripted" ? "series" : "tv",
        description: short(strip(s.summary)),
      });
    }
  }
  if (sugg.status === "fulfilled") {
    const movies: SearchResult[] = [];
    for (const r of sugg.value.d ?? []) {
      if (!r.id?.startsWith("tt") || !typeMap[r.qid]) continue;
      if (seen.has(`${String(r.l).toLowerCase()}|${r.y ?? null}`)) continue;
      movies.push({
        external_id: `imdb:${r.id}`,
        title: r.l,
        creator: r.s ?? null,
        cover_url: r.i?.imageUrl ? String(r.i.imageUrl).replace("._V1_.jpg", "._V1_SX300.jpg") : null,
        year: r.y ?? null,
        media_type: typeMap[r.qid] ?? "movie",
        description: r.s ? `Starring ${r.s}` : null,
      });
    }
    out.unshift(...movies);
  }
  return out;
}

async function searchRead(q: string): Promise<SearchResult[]> {
  try {
    const key = process.env["GOOGLE_BOOKS_API_KEY"];
    const j = await getJson(
      `https://www.googleapis.com/books/v1/volumes?maxResults=8&printType=books&q=${encodeURIComponent(q)}${key ? `&key=${key}` : ""}`,
    );
    const items = (j.items ?? []).map((b: any) => {
      const v = b.volumeInfo ?? {};
      return {
        external_id: `gbooks:${b.id}`,
        title: v.subtitle ? `${v.title}: ${v.subtitle}` : v.title,
        creator: v.authors?.join(", ") ?? null,
        cover_url: v.imageLinks?.thumbnail?.replace("http://", "https://") ?? null,
        year: yr(v.publishedDate),
        media_type: "book",
        description: short(strip(v.description)),
      } as SearchResult;
    });
    if (items.length) return items;
  } catch {
    // fall through to Open Library
  }
  const j = await getJson(`https://openlibrary.org/search.json?limit=8&q=${encodeURIComponent(q)}`);
  return (j.docs ?? []).map((d: any) => ({
    external_id: `ol:${d.key}`,
    title: d.title,
    creator: d.author_name?.join(", ") ?? null,
    cover_url: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
    year: d.first_publish_year ?? null,
    media_type: "book",
    description: null,
  }));
}

export const searchMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { q: string; track: "watch" | "read" }) => ({
    q: String(d.q ?? "").slice(0, 120),
    track: d.track === "read" ? ("read" as const) : ("watch" as const),
  }))
  .handler(async ({ data }) => {
    if (data.q.trim().length < 2) return [] as SearchResult[];
    try {
      return data.track === "read" ? await searchRead(data.q) : await searchWatch(data.q);
    } catch (e) {
      console.error("search failed", e);
      return [] as SearchResult[];
    }
  });
