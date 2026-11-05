import { describe, expect, it } from "vitest";
import { formatKobo, koboToInputValue, nairaInputToKobo } from "./format";

describe("formatKobo", () => {
  it("formats a whole-naira amount with the naira symbol and thousands separators", () => {
    expect(formatKobo(123_456_00)).toBe("₦123,456");
  });

  it("rounds to the nearest naira", () => {
    expect(formatKobo(150_50)).toBe("₦151");
  });

  it("formats zero", () => {
    expect(formatKobo(0)).toBe("₦0");
  });
});

describe("nairaInputToKobo", () => {
  it("parses a plain number string", () => {
    expect(nairaInputToKobo("1500")).toBe(150_000);
  });

  it("strips thousands-separator commas", () => {
    expect(nairaInputToKobo("20,000")).toBe(2_000_000);
  });

  it("returns 0 for empty, zero, negative, or non-numeric input", () => {
    expect(nairaInputToKobo("")).toBe(0);
    expect(nairaInputToKobo("0")).toBe(0);
    expect(nairaInputToKobo("-500")).toBe(0);
    expect(nairaInputToKobo("abc")).toBe(0);
  });
});

describe("koboToInputValue", () => {
  it("converts kobo to a plain naira string", () => {
    expect(koboToInputValue(2_000_000)).toBe("20000");
  });

  it("returns an empty string for zero or undefined", () => {
    expect(koboToInputValue(0)).toBe("");
    expect(koboToInputValue(undefined)).toBe("");
  });
});
