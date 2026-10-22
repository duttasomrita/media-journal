import { describe, expect, it } from "vitest";
import { monthlyRecap, recapFingerprint } from "../lib/recap";
import type { EntryWithItem } from "../lib/media";

function entry(id: string, track: "watch" | "read", patch: Partial<EntryWithItem> = {}): EntryWithItem {
  return { id, media_id: id, year: 2026, month: 9, completed: true, completed_at: "2026-10-12", rating: 8, remarks: null, watch_platform: track === "watch" ? "Netflix" : null, created_at: "", updated_at: "", media_items: { id, track, external_id: null, title: id, creator: null, cast_names: "Actor name", watch_platform: "Original network", cover_url: null, year: null, media_type: track === "watch" ? "movie" : "book", description: null, created_at: "" }, ...patch };
}

describe("monthly recap", () => {
  it("includes both watched and read completions in the completion month", () => {
    const result = monthlyRecap([entry("Film", "watch"), entry("Book", "read"), entry("Unfinished", "watch", { completed: false }), entry("Other month", "read", { completed_at: "2026-09-12" })], 2026, 10);
    expect(result.total).toBe(2); expect(result.watch.length).toBe(1); expect(result.read.length).toBe(1);
  });
  it("uses list month only for undated completions", () => { expect(monthlyRecap([entry("Undated", "read", { completed_at: null })], 2026, 9).total).toBe(1); });
  it("counts repeat viewings separately", () => { const a = entry("first", "watch"); expect(monthlyRecap([a, { ...a, id: "second" }], 2026, 10).total).toBe(2); });
  it("ranks ratings and uses recorded viewing platforms, never cast or original networks", () => {
    const result = monthlyRecap([entry("Film", "watch", { rating: 10, watch_platform: "Prime Video" }), entry("Book", "read", { rating: 6 })], 2026, 10);
    expect(result.averageRating).toBe(8); expect(result.favorites[0]?.media_items.title).toBe("Film"); expect(result.platforms).toEqual([["Prime Video", 1]]);
  });
  it("invalidates personalized remarks when ratings or reviews change", () => {
    const a = entry("Film", "watch"); expect(recapFingerprint([a])).not.toBe(recapFingerprint([{ ...a, remarks: "Loved it" }]));
  });
});