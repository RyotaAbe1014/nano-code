import { describe, it, expect } from "vitest";
import { add, subtract, multiply, divide } from "../src/math";

describe("math utilities", () => {
  it("adds numbers", () => {
    expect(add(2, 3)).toEqual({ ok: true, value: 5 });
  });

  it("subtracts numbers", () => {
    expect(subtract(5, 3)).toEqual({ ok: true, value: 2 });
  });

  it("multiplies numbers", () => {
    expect(multiply(4, 3)).toEqual({ ok: true, value: 12 });
  });

  it("divides numbers", () => {
    expect(divide(10, 2)).toEqual({ ok: true, value: 5 });
  });

  it("returns error for division by zero", () => {
    expect(divide(1, 0)).toEqual({ ok: false, error: "division by zero" });
  });
});
