/**
 * Thin client for billsteady-backend's Edge Functions. Endpoint paths are
 * reasonable defaults (REST-ish), not a confirmed cross-repo contract -
 * reconcile against that repo's README once it exists. Every call sends
 * the SEP-10 session JWT (once authenticated) as a Bearer token.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export interface BillVerification {
  billerId: string;
  billerName: string;
  customerRef: string;
  amountKobo: number;
}

export interface PaymentOrder {
  id: string;
  billerId: string;
  billerName: string;
  amountKobo: number;
  status: "quote" | "funded" | "paying" | "paid" | "failed" | "refunded";
  createdAt: string;
  onchainTxHash?: string;
}

function authHeaders(token: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function verifyBill(
  token: string,
  args: { billerId: string; customerRef: string },
): Promise<BillVerification> {
  const res = await fetch(`${API_BASE}/bills/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`Bill verification failed: ${res.status}`);
  return res.json();
}

export async function createQuote(
  token: string,
  args: { billerId: string; customerRef: string; amountKobo: number; orderRefHex: string },
): Promise<PaymentOrder> {
  const res = await fetch(`${API_BASE}/payment-orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`Creating quote failed: ${res.status}`);
  return res.json();
}

export async function notifyOnchainPayment(
  token: string,
  args: { orderId: string; txHash: string },
): Promise<PaymentOrder> {
  const res = await fetch(`${API_BASE}/payment-orders/${args.orderId}/onchain-confirmed`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ txHash: args.txHash }),
  });
  if (!res.ok) throw new Error(`Confirming on-chain payment failed: ${res.status}`);
  return res.json();
}

export async function fetchPaymentHistory(token: string): Promise<PaymentOrder[]> {
  const res = await fetch(`${API_BASE}/payment-orders`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`Fetching history failed: ${res.status}`);
  return res.json();
}
