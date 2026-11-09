import { WalletIcon, LockIcon } from "../components/icons";

export function ConnectWalletScreen({
  onConnect,
  connecting,
  error,
}: {
  onConnect: () => void;
  connecting: boolean;
  error: string | null;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <WalletIcon className="h-8 w-8" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-stone-900">Connect your Stellar wallet</h2>
      <p className="mt-2 max-w-xs text-sm text-stone-600">
        Freighter, Lobstr, xBull, or any Stellar wallet you already use. No new account, no seed phrase.
      </p>
      <button
        onClick={onConnect}
        disabled={connecting}
        className="mt-6 rounded-full bg-brand-600 px-7 py-3 text-sm font-bold text-white shadow-soft transition-transform active:scale-95 disabled:opacity-60"
      >
        {connecting ? "Connecting…" : "Connect wallet"}
      </button>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <p className="mt-5 flex items-center gap-1.5 text-xs text-stone-500">
        <LockIcon className="h-3.5 w-3.5" /> Non-custodial — your wallet, your keys, always.
      </p>
    </div>
  );
}
