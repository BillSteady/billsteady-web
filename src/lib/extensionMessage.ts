import { formatKobo } from "./format";

/** Generates a polite part-payment / extension-request message for a short bill. */
export function extensionMessage(opts: {
  billName: string;
  shortfallKobo: number;
  dueDate: string; // human-readable, already formatted by the caller
}): string {
  const { billName, shortfallKobo, dueDate } = opts;
  return (
    `Hello, I'm setting aside money for ${billName} and I'm currently ${formatKobo(shortfallKobo)} short ` +
    `of the amount due on ${dueDate}. Please may I pay the rest in a few days? ` +
    `I'll send a confirmation as soon as it's paid. Thank you for understanding.`
  );
}
