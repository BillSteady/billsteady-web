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

/** XLM amount (as a decimal string, e.g. "12.3456789") -> stroops (i128), Stellar's 7-decimal base unit. */
export function toStroops(decimalAmount: string): bigint {
  const [whole, frac = ""] = decimalAmount.split(".");
  const paddedFrac = (frac + "0000000").slice(0, 7);
  return BigInt(whole) * 10_000_000n + BigInt(paddedFrac || "0");
}

export { Address, nativeToScVal };
