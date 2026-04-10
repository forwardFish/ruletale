import { describe, expect, it } from "vitest";

import { parseInput } from "@game-core/engine/inputParser";

describe("inputParser", () => {
  it("parses inspection around nurse station", () => {
    const parsed = parseInput("\u89c2\u5bdf\u62a4\u58eb\u7ad9", 80);
    expect(["inspect_object", "observe"]).toContain(parsed.primaryIntent);
    expect(parsed.target).toBe("\u62a4\u58eb\u7ad9");
  });

  it("parses movement to corridor end", () => {
    const parsed = parseInput("\u53bb\u8d70\u5eca\u5c3d\u5934", 20);
    expect(parsed.primaryIntent).toBe("move_to_area");
    expect(parsed.target).toBe("\u8d70\u5eca\u5c3d\u5934");
  });

  it("parses combat on nurse target", () => {
    const parsed = parseInput("\u653b\u51fb\u62a4\u58eb", 20);
    expect(parsed.primaryIntent).toBe("fight");
    expect(parsed.trustTarget).toBe("night_nurse");
  });

  it("parses item usage", () => {
    const parsed = parseInput("\u4f7f\u7528\u624b\u7535", 60);
    expect(parsed.primaryIntent).toBe("use_item");
    expect(parsed.target).toBe("\u624b\u7535");
  });

  it("parses peephole inspection in apartment dungeon", () => {
    const parsed = parseInput("\u770b\u732b\u773c", 70);
    expect(["inspect_object", "observe"]).toContain(parsed.primaryIntent);
    expect(parsed.target).toBe("\u732b\u773c");
  });

  it("parses familiar voice verification", () => {
    const parsed = parseInput("\u542c\u95e8\u5916\u58f0\u97f3", 85);
    expect(["observe", "verify_rule"]).toContain(parsed.primaryIntent);
    expect(parsed.target).toBe("\u58f0\u97f3");
  });

  it("parses movement to stairwell", () => {
    const parsed = parseInput("\u53bb\u697c\u68af\u95f4", 40);
    expect(parsed.primaryIntent).toBe("move_to_area");
    expect(parsed.target).toBe("\u697c\u68af");
  });
});
