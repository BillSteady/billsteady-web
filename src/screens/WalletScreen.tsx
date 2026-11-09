import { useEffect, useState } from "react";
import { fetchBalances, type WalletBalances } from "../lib/balances";
import { LockIcon } from "../components/icons";

export function WalletScreen({ address, onDisconnect }: { address: string; onDisconnect: () => void }) {
  const [balances, setBalances] = useState<WalletBalances | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchBalances(address)
      .then((b) => {
        if (!cancelled) setBalances(b);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load balances");
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  const truncated = `${address.slice(0, 6)}…${address.slice(-6)}`;

  return (
    <div className="space-y-4 p-4">
      <div className="card">
        <p className="flex items-center gap-1.5 text-xs text-stone-500">
          <LockIcon className="h-3.5 w-3.5" /> Non-custodial wallet
        </p>
        <p className="mt-1 font-mono text-sm font-semibold text-stone-800">{truncated}</p>
      </div>

      <div className="card">
        <p className="text-xs text-stone-500">Your balance</p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {!balances && !error && <p className="mt-2 text-sm text-stone-400">Loading…</p>}
        {balances && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-lg font-extrabold tabular-nums text-brand-700">
              {balances.xlm.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM
            </span>
            <span className="text-lg font-extrabold tabular-nums text-sunrise-600">
              {balances.usdc.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC
            </span>
          </div>
        )}
      </div>

      <button
        onClick={onDisconnect}
        className="w-full rounded-full border border-stone-200 bg-white py-2.5 text-sm font-semibold text-stone-600 transition-transform active:scale-95"
      >
        Disconnect wallet
      </button>
    </div>
  );
}
