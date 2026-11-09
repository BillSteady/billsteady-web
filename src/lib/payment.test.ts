import { describe, expect, it } from "vitest";
import { toStroops } from "./payment";

describe("toStroops", () => {
  it("converts a whole number", () => {
    expect(toStroops("5")).toBe(50_000_000n);
  });

  it("converts a decimal amount to 7-decimal stroops", () => {
    expect(toStroops("12.3456789")).toBe(123_456_789n);
  });

  it("pads a short fractional part", () => {
    expect(toStroops("1.5")).toBe(15_000_000n);
  });

  it("handles zero", () => {
    expect(toStroops("0")).toBe(0n);
  });
});
