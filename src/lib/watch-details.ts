export const WATCH_PLATFORMS = [
  "Netflix", "Prime Video", "Disney+ Hotstar", "JioHotstar", "Apple TV+",
  "YouTube", "Hulu", "Max", "SonyLIV", "ZEE5", "MUBI", "Cinema", "TV", "Other",
];

export function requireWatchPlatform(platform: string | null | undefined) {
  const value = platform?.trim();
  if (!value) throw new Error("Select where you watched this title.");
  return value;
}