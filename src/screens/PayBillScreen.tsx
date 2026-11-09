import { useState } from "react";
import { Asset } from "@stellar/stellar-sdk";
import { BILLER_CATEGORIES } from "../lib/billers";
import { formatKobo } from "../lib/format";
import { fetchNgnRates, ngnKoboToAsset } from "../lib/rate";
import { createQuote, notifyOnchainPayment, verifyBill, type BillVerification } from "../lib/api";
import { generateOrderRef, orderRefToHex } from "../lib/orderRef";
import { payBill, toStroops } from "../lib/payment";
import { stellarConfig, USDC_ISSUER } from "../lib/stellar";
import { WarningIcon } from "../components/icons";

type Step = "pick" | "verifying" | "confirm" | "paying" | "done" | "error";
type Asset_ = "XLM" | "USDC";

export function PayBillScreen({
  token,
  address,
  sign,
}: {
  token: string;
  address: string;
  sign: (xdr: string) => Promise<string>;
}) {
  const [step, setStep] = useState<Step>("pick");
  const [billerId, setBillerId] = useState(BILLER_CATEGORIES[0].id);
  const [customerRef, setCustomerRef] = useState("");
  const [asset, setAsset] = useState<Asset_>("USDC");
  const [verification, setVerification] = useState<BillVerification | null>(null);
  const [assetAmount, setAssetAmount] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const biller = BILLER_CATEGORIES.find((b) => b.id === billerId)!;

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!customerRef.trim()) return;
    setStep("verifying");
    setErrorMessage(null);
    try {
      const [v, rates] = await Promise.all([
        verifyBill(token, { billerId, customerRef: customerRef.trim() }),
        fetchNgnRates(),
      ]);
      const rate = asset === "XLM" ? rates.xlmToNgn : rates.usdcToNgn;
      setVerification(v);
      setAssetAmount(ngnKoboToAsset(v.amountKobo, rate));
      setStep("confirm");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not verify this bill");
      setStep("error");
    }
  }

  async function handlePay() {
    if (!verification || assetAmount === null) return;
    setStep("paying");
    setErrorMessage(null);
    try {
      const orderRef = generateOrderRef();
      const order = await createQuote(token, {
        billerId: verification.billerId,
        customerRef: verification.customerRef,
        amountKobo: verification.amountKobo,
        orderRefHex: orderRefToHex(orderRef),
      });

      const tokenContractId =
        asset === "XLM"
          ? Asset.native().contractId(stellarConfig.networkPassphrase)
          : new Asset("USDC", USDC_ISSUER).contractId(stellarConfig.networkPassphrase);

      const { hash } = await payBill({
        payerAddress: address,
        tokenContractId,
        amount: toStroops(assetAmount.toFixed(7)),
        billerId: verification.billerId,
        orderRef,
        signTransaction: async (xdr) => ({ signedTxXdr: await sign(xdr) }),
      });

      await notifyOnchainPayment(token, { orderId: order.id, txHash: hash });
      setTxHash(hash);
      setStep("done");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Payment failed");
      setStep("error");
    }
  }

  function reset() {
    setStep("pick");
    setVerification(null);
    setAssetAmount(null);
    setErrorMessage(null);
    setTxHash(null);
    setCustomerRef("");
  }

  if (step === "done") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h2 className="text-xl font-bold text-stone-900">Paid</h2>
        <p className="mt-2 text-sm text-stone-600">{biller.name} has been paid, straight from your wallet.</p>
        {txHash && <p className="mt-2 break-all font-mono text-xs text-stone-400">{txHash}</p>}
        <button
          onClick={reset}
          className="mt-6 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-bold text-white active:scale-95"
        >
          Pay another bill
        </button>
      </div>
    );
  }

  if (step === "confirm" && verification && assetAmount !== null) {
    return (
      <div className="space-y-4 p-4">
        <div className="card border-l-4 border-brand-600">
          <p className="text-sm font-bold text-brand-700">{verification.billerName}</p>
          <p className="mt-1 text-xs text-stone-600">{verification.customerRef}</p>
        </div>
        <div className="card">
          <p className="text-xs text-stone-500">You pay</p>
          <p className="text-2xl font-extrabold tabular-nums text-stone-900">{formatKobo(verification.amountKobo)}</p>
          <p className="text-sm font-semibold text-sunrise-600">
            ≈ {assetAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {asset} at today's rate
          </p>
        </div>
        <button
          onClick={handlePay}
          className="w-full rounded-full bg-brand-600 py-3 text-sm font-bold text-white shadow-soft active:scale-95"
        >
          Sign &amp; pay
        </button>
        <p className="text-center text-xs text-stone-500">Straight to the biller — we never hold your funds</p>
        <button onClick={reset} className="w-full text-center text-sm font-semibold text-stone-500">
          Cancel
        </button>
      </div>
    );
  }

  if (step === "paying") {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-stone-600">
        Waiting for your wallet to sign and the payment to confirm…
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="space-y-4 p-4">
        <div className="card flex items-start gap-2 border-l-4 border-red-500">
          <WarningIcon className="mt-0.5 h-4 w-4 flex-none text-red-500" />
          <p className="text-sm text-stone-700">{errorMessage}</p>
        </div>
        <button onClick={reset} className="w-full rounded-full bg-brand-600 py-2.5 text-sm font-bold text-white">
          Try again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleVerify} className="space-y-4 p-4">
      <label className="block text-sm text-stone-600">
        Biller
        <select
          className="mt-1 w-full rounded-lg border border-stone-200 bg-white p-2.5"
          value={billerId}
          onChange={(e) => setBillerId(e.target.value)}
        >
          {BILLER_CATEGORIES.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm text-stone-600">
        {biller.placeholder}
        <input
          className="mt-1 w-full rounded-lg border border-stone-200 p-2.5"
          value={customerRef}
          onChange={(e) => setCustomerRef(e.target.value)}
          placeholder={biller.placeholder}
        />
      </label>
      <label className="block text-sm text-stone-600">
        Pay with
        <div className="mt-1 flex gap-2">
          {(["XLM", "USDC"] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAsset(a)}
              className={`flex-1 rounded-lg border py-2 text-sm font-semibold ${
                asset === a ? "border-brand-600 bg-brand-50 text-brand-700" : "border-stone-200 text-stone-500"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </label>
      <button
        type="submit"
        disabled={step === "verifying" || !customerRef.trim()}
        className="w-full rounded-full bg-brand-600 py-3 text-sm font-bold text-white shadow-soft active:scale-95 disabled:opacity-60"
      >
        {step === "verifying" ? "Checking…" : "Continue"}
      </button>
    </form>
  );
}
