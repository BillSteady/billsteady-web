import { useCallback, useState } from "react";

/**
 * Stellar Wallets Kit (JSR: @creit-tech/stellar-wallets-kit, via the
 * .npmrc JSR registry mapping). Loaded lazily, not at module top-level:
 * the kit bundles each wallet connector's own SDK (even hand-picking
 * Freighter/Lobstr/xBull/Albedo/Rabet instead of defaultModules() still
 * pulls ~250KB gzipped), which blew well past this app's 200KB first-load
 * budget when imported eagerly. Deferred via dynamic import so it only
 * loads once the user actually taps "Connect wallet", not on every page
 * view before they've decided to connect anything.
 */
/** The subset of the real kit's API this app actually uses - real or mocked. */
interface WalletKitLike {
  authModal: () => Promise<{ address: string }>;
  disconnect: () => Promise<void>;
  signTransaction: (xdr: string) => Promise<{ signedTxXdr: string }>;
}

/**
 * Test-only mock, gated behind VITE_E2E_MOCK (only ever set by
 * playwright.config.ts's webServer env - never in a real build, dev, or
 * prod environment, so this branch is dead code and tree-shaken away
 * everywhere else). There is no real wallet browser extension in CI or
 * this sandboxed environment to drive for real, so E2E tests configure
 * this mock's behavior via `window.__E2E__` (set per-test with
 * page.addInitScript before navigation) instead.
 */
function loadMockKit(): Promise<WalletKitLike> {
  return Promise.resolve({
    async authModal() {
      const cfg = (globalThis as unknown as { __E2E__?: Record<string, string> }).__E2E__ ?? {};
      if (cfg.connectError) throw new Error(cfg.connectError);
      return { address: cfg.walletAddress ?? "GA5VFTEXVQ424W3S4CWMLRRTSRBCDLJGRCLPXXKINZUTZSBCZFTWJ2P6" };
    },
    async disconnect() {},
    async signTransaction(xdr: string) {
      const cfg = (globalThis as unknown as { __E2E__?: Record<string, string> }).__E2E__ ?? {};
      if (cfg.signError) throw new Error(cfg.signError);
      return { signedTxXdr: xdr };
    },
  });
}

async function loadKit(): Promise<WalletKitLike> {
  if (import.meta.env.VITE_E2E_MOCK === "true") {
    return loadMockKit();
  }

  const [{ Networks, StellarWalletsKit }, { FreighterModule }, { LobstrModule }, { xBullModule }, { AlbedoModule }, { RabetModule }] =
    await Promise.all([
      import("@jsr/creit-tech__stellar-wallets-kit"),
      import("@jsr/creit-tech__stellar-wallets-kit/modules/freighter"),
      import("@jsr/creit-tech__stellar-wallets-kit/modules/lobstr"),
      import("@jsr/creit-tech__stellar-wallets-kit/modules/xbull"),
      import("@jsr/creit-tech__stellar-wallets-kit/modules/albedo"),
      import("@jsr/creit-tech__stellar-wallets-kit/modules/rabet"),
    ]);

  const network = import.meta.env.VITE_STELLAR_NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;

  StellarWalletsKit.init({
    modules: [new FreighterModule(), new LobstrModule(), new xBullModule(), new AlbedoModule(), new RabetModule()],
    network,
  });

  return StellarWalletsKit;
}

let kitPromise: ReturnType<typeof loadKit> | null = null;
function getKit() {
  if (!kitPromise) kitPromise = loadKit();
  return kitPromise;
}

export function useStellarWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const kit = await getKit();
      const result = await kit.authModal();
      setAddress(result.address);
      return result.address;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect wallet");
      throw err;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const kit = await getKit();
    await kit.disconnect();
    setAddress(null);
  }, []);

  const sign = useCallback(async (xdr: string) => {
    const kit = await getKit();
    const { signedTxXdr } = await kit.signTransaction(xdr);
    return signedTxXdr;
  }, []);

  return { address, connecting, error, connect, disconnect, sign };
}
