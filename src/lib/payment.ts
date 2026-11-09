import { Address, contract, nativeToScVal } from "@stellar/stellar-sdk";
import { ROUTER_CONTRACT_ID, stellarConfig } from "./stellar";

/**
 * Invokes billsteady-contracts' BillPaymentRouter.pay(payer, token, amount,
 * biller_id, order_ref) - a single atomic call that moves funds straight
 * from the payer's own account to the biller's registered settlement
 * address, never through contract-held custody. See that repo's
 * router/README.md for the authoritative interface; ROUTER_CONTRACT_ID is a
 * placeholder (VITE_ROUTER_CONTRACT_ID) until that repo publishes a real
 * deployed testnet ID.
 */

interface BillPaymentRouterContract {
  pay: (
    args: { payer: string; token: string; amount: bigint; biller_id: string; order_ref: Buffer },
    options?: contract.MethodOptions,
  ) => Promise<contract.AssembledTransaction<null>>;
}

export async function payBill(opts: {
  payerAddress: string;
  tokenContractId: string;
  amount: bigint;
  billerId: string;
  orderRef: Uint8Array;
  signTransaction: contract.ClientOptions["signTransaction"];
}): Promise<{ hash: string }> {
  if (import.meta.env.VITE_E2E_MOCK === "true") {
    return mockPayBill(opts);
  }

  if (!ROUTER_CONTRACT_ID) {
    throw new Error("VITE_ROUTER_CONTRACT_ID is not configured - no router contract deployed yet");
  }

  const client = await contract.Client.from<BillPaymentRouterContract>({
    contractId: ROUTER_CONTRACT_ID,
    rpcUrl: stellarConfig.rpcUrl,
    networkPassphrase: stellarConfig.networkPassphrase,
    publicKey: opts.payerAddress,
    signTransaction: opts.signTransaction,
  });

  const tx = await client.pay({
    payer: opts.payerAddress,
    token: opts.tokenContractId,
    amount: opts.amount,
    biller_id: opts.billerId,
    order_ref: Buffer.from(opts.orderRef),
  });

  const sent = await tx.signAndSend();
  return { hash: sent.sendTransactionResponse?.hash ?? "" };
}

/**
 * Test-only mock, gated behind VITE_E2E_MOCK (same guard as
 * wallet.ts's loadMockKit - only ever set by playwright.config.ts's
 * webServer env, dead code everywhere else). Bypasses the real Soroban RPC
 * path entirely rather than trying to fake its JSON-RPC traffic: this
 * repo's job is to prove the UI correctly drives a user through the pay
 * flow and calls the right functions with the right arguments, not to
 * re-prove the contract call works - that's billsteady-contracts' own
 * test suite and testnet deployment's job, already done there. Still
 * calls the real signTransaction callback, so the UI -> wallet wiring
 * itself is genuinely exercised, not skipped.
 */
async function mockPayBill(opts: {
  payerAddress: string;
  orderRef: Uint8Array;
  signTransaction: contract.ClientOptions["signTransaction"];
}): Promise<{ hash: string }> {
  const cfg = (globalThis as unknown as { __E2E__?: Record<string, string> }).__E2E__ ?? {};
  if (cfg.payError) throw new Error(cfg.payError);

  // Exercise the real wallet-signing wiring even though the "transaction"
  // here is a placeholder, not a real Soroban envelope - proves PayBillScreen
  // wires opts.signTransaction through correctly. Cast: the real
  // contract.ClientOptions["signTransaction"] type takes an options bag the
  // SDK always supplies internally; this mock only needs the one-argument
  // shape PayBillScreen actually constructs (`async (xdr) => ({ signedTxXdr:
  // await sign(xdr) })`).
  await (opts.signTransaction as unknown as (xdr: string) => Promise<{ signedTxXdr: string }>)(
    "e2e-mock-unsigned-xdr",
  );

  const orderRefHex = Array.from(opts.orderRef)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { hash: cfg.payTxHash ?? `e2e-mock-tx-${orderRefHex.slice(0, 16)}` };
}

/** XLM amount (as a decimal string, e.g. "12.3456789") -> stroops (i128), Stellar's 7-decimal base unit. */
export function toStroops(decimalAmount: string): bigint {
  const [whole, frac = ""] = decimalAmount.split(".");
  const paddedFrac = (frac + "0000000").slice(0, 7);
  return BigInt(whole) * 10_000_000n + BigInt(paddedFrac || "0");
}

export { Address, nativeToScVal };
