import { describe, it, expect } from "vitest";
import { add, safeDivide } from "../src/math";

describe("math utilities", () => {
  it("adds two numbers", () => {
    expect(add(2, 3)).toBe(5);
  });

  it("divides numbers safely", () => {
    const r1 = safeDivide(6, 3);
    expect(r1.ok).toBe(true);
    if (r1.ok) {
      expect(r1.value).toBe(2);
    }

    const r2 = safeDivide(1, 0);
    expect(r2.ok).toBe(false);
    if (!r2.ok) {
      expect(r2.error).toBe("division by zero");
    }
  });
});
