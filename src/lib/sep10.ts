import * as StellarSdk from "@stellar/stellar-sdk";
import { stellarConfig } from "./stellar";

/**
 * SEP-10 Web Authentication, client side (https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md).
 * The matching server side is built in billsteady-backend, in parallel with
 * this fork - the exact endpoint path below is a reasonable default
 * (REST-ish, "<api base>/auth" for both the GET challenge and POST token
 * exchange), not a confirmed cross-repo contract. Reconcile against that
 * repo's README once it exists.
 *
 * TODO: this app pins the expected server signing key via
 * VITE_SEP10_SERVER_SIGNING_KEY rather than fetching it from a
 * <home-domain>/.well-known/stellar.toml, which is what the full SEP-10
 * spec describes. That's a deliberate simplification for a backend that's
 * a Supabase Edge Function, not a domain hosting its own stellar.toml - it
 * does NOT skip the security-relevant validation (the challenge's
 * signature is still checked against a known, trusted key before this app
 * signs anything), it just sources that key from config instead of an
 * on-chain-adjacent TOML fetch. Revisit if a real stellar.toml becomes
 * available.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const HOME_DOMAIN = import.meta.env.VITE_SEP10_HOME_DOMAIN ?? "billsteady.app";
const SERVER_SIGNING_KEY = import.meta.env.VITE_SEP10_SERVER_SIGNING_KEY ?? "";

export class Sep10ValidationError extends Error {}

interface ChallengeResponse {
  transaction: string;
  network_passphrase?: string;
}

export async function requestChallenge(account: string): Promise<ChallengeResponse> {
  // `new URL(relativePath)` throws ("Invalid URL") without a base - unlike
  // fetch(), which resolves a relative path against the document
  // automatically. API_BASE defaults to "" (relative), so this needs an
  // explicit base to not crash in that default configuration - caught by
  // actually running this flow end to end, not by any unit test (which
  // mocked requestChallenge entirely rather than exercising this line).
  const url = new URL(`${API_BASE}/auth`, window.location.origin);
  url.searchParams.set("account", account);
  url.searchParams.set("home_domain", HOME_DOMAIN);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`SEP-10 challenge request failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Validates a SEP-10 challenge transaction before signing it, per spec
 * section 5: sequence 0, signed by the known server key, and the first
 * operation is the expected client-auth manage_data entry. Throws
 * Sep10ValidationError on any failure - never sign an unvalidated challenge.
 */
export function validateChallenge(xdr: string, account: string, networkPassphrase: string): void {
  if (!SERVER_SIGNING_KEY) {
    throw new Sep10ValidationError("No server signing key configured (VITE_SEP10_SERVER_SIGNING_KEY)");
  }

  const tx = StellarSdk.TransactionBuilder.fromXDR(xdr, networkPassphrase) as StellarSdk.Transaction;

  if (tx.sequence !== "0") {
    throw new Sep10ValidationError("Challenge sequence number must be 0");
  }

  if (tx.source !== SERVER_SIGNING_KEY) {
    throw new Sep10ValidationError("Challenge source account does not match the expected server account");
  }

  const serverKeypair = StellarSdk.Keypair.fromPublicKey(SERVER_SIGNING_KEY);
  const hash = tx.hash();
  // sig.signature is the XDR Signature value (a Uint8Array wrapper), not a
  // method - confirmed empirically (Keypair.verify accepts it directly;
  // calling it as a function throws "not a function" at runtime).
  const signedByServer = tx.signatures.some((sig) => serverKeypair.verify(hash, sig.signature as unknown as Buffer));
  if (!signedByServer) {
    throw new Sep10ValidationError("Challenge is not signed by the expected server account");
  }

  const ops = tx.operations;
  if (ops.length === 0 || ops[0].type !== "manageData") {
    throw new Sep10ValidationError("First operation must be manage_data");
  }
  const firstOp = ops[0] as StellarSdk.Operation.ManageData;
  if (firstOp.source !== account) {
    throw new Sep10ValidationError("First manage_data operation's source must be the client account");
  }
  const expectedKey = `${HOME_DOMAIN} auth`;
  if (firstOp.name !== expectedKey) {
    throw new Sep10ValidationError(`First manage_data key must be "${expectedKey}"`);
  }

  for (const op of ops.slice(1)) {
    if (op.type !== "manageData") {
      throw new Sep10ValidationError("All operations after the first must be manage_data");
    }
    const manageDataOp = op as StellarSdk.Operation.ManageData;
    if (manageDataOp.name === "web_auth_domain" && manageDataOp.source !== SERVER_SIGNING_KEY) {
      throw new Sep10ValidationError("web_auth_domain operation must be sourced from the server account");
    }
  }
}

export async function submitSignedChallenge(signedXdr: string): Promise<string> {
  const res = await fetch(`${API_BASE}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction: signedXdr }),
  });
  if (!res.ok) {
    throw new Error(`SEP-10 token exchange failed: ${res.status}`);
  }
  const data = await res.json();
  return data.token as string;
}

export { HOME_DOMAIN as sep10HomeDomain, stellarConfig };
