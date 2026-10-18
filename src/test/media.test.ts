import { describe, it, expect } from "vitest";
import { masterStatus } from "@/lib/media";

describe("masterStatus", () => {
  it("is completed when any month marked it complete, even if another month is not", () => {
    const s = masterStatus([
      { completed: true, completed_at: "2026-03-10" },
      { completed: false, completed_at: null },
    ]);
    expect(s.completed).toBe(true);
    expect(s.timesCompleted).toBe(1);
  });
  it("reports the latest completion date", () => {
    expect(masterStatus([
      { completed: true, completed_at: "2026-01-02" },
      { completed: true, completed_at: "2026-05-20" },
    ]).lastCompleted).toBe("2026-05-20");
  });
  it("is not completed with no completed entries", () => {
    expect(masterStatus([{ completed: false, completed_at: null }]).completed).toBe(false);
  });
});
