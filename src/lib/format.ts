const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/** Formats an integer kobo amount as naira, e.g. 123456 -> "₦1,235". */
export function formatKobo(amountKobo: number): string {
  return naira.format(Math.round(amountKobo) / 100);
}

/** Converts a naira input string (user typing, may have commas) to integer kobo. Negative/invalid -> 0. */
export function nairaInputToKobo(input: string): number {
  const n = Number(input.replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
}

/** Converts integer kobo to a plain naira string suitable for prefilling a number input, e.g. 150000 -> "1500". Zero/undefined -> "". */
export function koboToInputValue(amountKobo: number | undefined): string {
  if (!amountKobo) return "";
  return String(Math.round(amountKobo) / 100);
}
