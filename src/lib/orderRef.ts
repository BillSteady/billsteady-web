/**
 * order_ref: a 32-byte id that ties a quote (created with the backend) to
 * the on-chain pay() call to billsteady-contracts' BillPaymentRouter
 * (pay(payer, token, amount, biller_id, order_ref)). Generated client-side
 * when the user starts a payment, sent to the backend with the quote
 * request, then reused unchanged when building the on-chain transaction -
 * so the backend can match the two up without re-deriving anything.
 *
 * TODO: coordinate this exact format with billsteady-backend's README once
 * it exists - this is a reasonable default (not a confirmed cross-repo
 * contract), flagged for reconciliation.
 */

const BYTE_LENGTH = 32;

export function generateOrderRef(): Uint8Array {
  const bytes = new Uint8Array(BYTE_LENGTH);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function orderRefToHex(bytes: Uint8Array): string {
  if (bytes.length !== BYTE_LENGTH) {
    throw new Error(`order_ref must be ${BYTE_LENGTH} bytes, got ${bytes.length}`);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function orderRefFromHex(hex: string): Uint8Array {
  if (hex.length !== BYTE_LENGTH * 2) {
    throw new Error(`order_ref hex must be ${BYTE_LENGTH * 2} chars, got ${hex.length}`);
  }
  const bytes = new Uint8Array(BYTE_LENGTH);
  for (let i = 0; i < BYTE_LENGTH; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
