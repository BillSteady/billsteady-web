import { describe, expect, it } from "vitest";
import { generateOrderRef, orderRefFromHex, orderRefToHex } from "./orderRef";

describe("orderRef", () => {
  it("generates 32 bytes", () => {
    expect(generateOrderRef().length).toBe(32);
  });

  it("generates different values each call", () => {
    const a = orderRefToHex(generateOrderRef());
    const b = orderRefToHex(generateOrderRef());
    expect(a).not.toBe(b);
  });

  it("hex round-trips exactly", () => {
    const original = generateOrderRef();
    const hex = orderRefToHex(original);
    expect(hex).toHaveLength(64);
    expect(orderRefFromHex(hex)).toEqual(original);
  });

  it("rejects a hex string of the wrong length", () => {
    expect(() => orderRefFromHex("abcd")).toThrow(/64/);
  });

  it("rejects a byte array of the wrong length when converting to hex", () => {
    expect(() => orderRefToHex(new Uint8Array(16))).toThrow(/32/);
  });
});
