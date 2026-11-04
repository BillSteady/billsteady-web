const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/** Formats an integer kobo amount as naira, e.g. 123456 -> "₦1,235". */
export function formatKobo(amountKobo: number): string {
  return naira.format(Math.round(amountKobo) / 100);
}
