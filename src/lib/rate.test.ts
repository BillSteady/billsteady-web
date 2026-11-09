import { describe, expect, it } from "vitest";
import { ngnKoboToAsset } from "./rate";

describe("ngnKoboToAsset", () => {
  it("converts naira kobo to the asset amount at a given rate", () => {
    // ₦18,500 at ₦1,349.37/USDC ≈ 13.709... USDC
    expect(ngnKoboToAsset(1_850_000, 1349.37)).toBeCloseTo(13.7097, 3);
  });

  it("rounds to 7 decimal places (Stellar's asset precision)", () => {
    const result = ngnKoboToAsset(100_00, 203.17);
    expect(Number.isInteger(result * 1e7)).toBe(true);
  });

  it("handles a zero amount", () => {
    expect(ngnKoboToAsset(0, 1349.37)).toBe(0);
  });
});
