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
async function loadKit() {
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
