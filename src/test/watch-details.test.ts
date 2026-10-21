import { describe, expect, it } from "vitest";
import { requireWatchPlatform } from "../lib/watch-details";

describe("viewing platform selection", () => {
  it("requires a selection before a watch title can be added", () => {
    expect(() => requireWatchPlatform(null)).toThrow();
    expect(() => requireWatchPlatform("   ")).toThrow();
  });
  it("preserves the user's platform rather than substituting a title's network", () => {
    expect(requireWatchPlatform(" Prime Video ")).toBe("Prime Video");
  });
});