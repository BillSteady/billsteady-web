import { lazy, Suspense, useState } from "react";
import { useAuth } from "./lib/useAuth";
import { ConnectWalletScreen } from "./screens/ConnectWalletScreen";
import { BrandMark, HistoryIcon, PayIcon, WalletIcon } from "./components/icons";

// Lazy: each of these pulls in @stellar/stellar-sdk, which is most of this
// app's JS weight. None of it is needed until the user is actually
// connected, so it shouldn't be part of the bundle the user downloads just
// to see the "Connect wallet" screen.
const WalletScreen = lazy(() => import("./screens/WalletScreen").then((m) => ({ default: m.WalletScreen })));
const PayBillScreen = lazy(() => import("./screens/PayBillScreen").then((m) => ({ default: m.PayBillScreen })));
const HistoryScreen = lazy(() => import("./screens/HistoryScreen").then((m) => ({ default: m.HistoryScreen })));

type Tab = "wallet" | "pay" | "history";

const TABS: { id: Tab; label: string; Icon: typeof WalletIcon }[] = [
  { id: "wallet", label: "Wallet", Icon: WalletIcon },
  { id: "pay", label: "Pay a bill", Icon: PayIcon },
  { id: "history", label: "History", Icon: HistoryIcon },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("pay");
  const auth = useAuth();

  return (
    <div className="min-h-dvh-fallback mx-auto flex max-w-md flex-col">
      <header
        className="sticky top-0 z-10 flex items-center gap-2 border-b border-brand-100 bg-white/95 p-4 backdrop-blur"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <BrandMark />
        <div>
          <h1 className="text-lg font-bold leading-tight text-brand-700">BillSteady</h1>
          <p className="text-xs text-stone-500">Pay a bill with XLM or USDC</p>
        </div>
      </header>

      <main className="flex flex-1 flex-col pb-2">
        {!auth.isAuthenticated || !auth.address || !auth.token ? (
          <ConnectWalletScreen onConnect={auth.signIn} connecting={auth.connecting} error={auth.error} />
        ) : (
          <Suspense fallback={<div className="flex flex-1 items-center justify-center p-6 text-sm text-stone-400">Loading…</div>}>
            {tab === "wallet" && <WalletScreen address={auth.address} onDisconnect={auth.signOut} />}
            {tab === "pay" && <PayBillScreen token={auth.token} address={auth.address} sign={auth.signTransaction} />}
            {tab === "history" && <HistoryScreen token={auth.token} />}
          </Suspense>
        )}
      </main>

      {auth.isAuthenticated && (
        <nav
          className="sticky bottom-0 flex border-t border-brand-100 bg-white/95 p-1.5 backdrop-blur"
          style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
        >
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-xs font-medium transition-colors active:scale-95 ${
                  active ? "bg-brand-50 text-brand-700" : "text-stone-500"
                }`}
                aria-current={active}
              >
                <Icon className={`h-5 w-5 ${active ? "text-brand-600" : "text-stone-400"}`} />
                {label}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
