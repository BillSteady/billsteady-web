import { describe, expect, it } from "vitest";
import { ngnKoboToAsset } from "./rate";

describe("ngnKoboToAsset", () => {
  it("converts naira kobo to the asset amount at a given rate", () => {
    // ₦18,500 at ₦1,349.37/USDC ≈ 13.709... USDC
    expect(ngnKoboToAsset(1_850_000, 1349.37)).toBeCloseTo(13.7097, 3);
  });

  it("rounds to 7 decimal places (Stellar's asset precision)", () => {
    const result = ngnKoboToAsset(100_00, 203.17);
    expect(Number.isInteger(Math.round(result * 1e7))).toBe(true);
  });

  it("always rounds UP (ceiling) so a fractional stroop never underpays the billed amount", () => {
    // ₦100.00 (10,000 kobo) at ₦300/USDC = 0.3333333333... USDC (3,333,333.333... stroops).
    // Naive Math.round would produce 0.3333333 USDC (3,333,333 stroops = ₦99.99999), underpaying the bill.
    // Ceiling policy must produce 0.3333334 USDC (3,333,334 stroops) so the biller is never short-paid.
    const rate = 300;
    const kobo = 100_00;
    const assetAmount = ngnKoboToAsset(kobo, rate);
    expect(assetAmount).toBe(0.3333334);
    expect(assetAmount * rate).toBeGreaterThanOrEqual(kobo / 100);
  });

  it("handles a zero amount", () => {
    expect(ngnKoboToAsset(0, 1349.37)).toBe(0);
  });
});
