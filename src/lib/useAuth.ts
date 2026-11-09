import { useCallback } from "react";
import { useStellarWallet } from "./wallet";
import { useSessionState } from "./store";

/**
 * Composes wallet connection + the SEP-10 sign-in flow. @stellar/stellar-sdk
 * (and everything in ./sep10.ts/./stellar.ts that imports it) is loaded via
 * dynamic import inside signIn, not at module top-level - same reasoning as
 * wallet.ts's lazy kit load: this hook runs on every App mount (even before
 * the user has connected anything), and eagerly importing the full SDK here
 * was most of this app's ~180KB gzip main-chunk weight.
 */
export function useAuth() {
  const wallet = useStellarWallet();
  const [session, setSession] = useSessionState();

  const signIn = useCallback(async () => {
    const address = await wallet.connect();

    const { requestChallenge, submitSignedChallenge, validateChallenge } = await import("./sep10");
    const { stellarConfig } = await import("./stellar");

    const { transaction, network_passphrase } = await requestChallenge(address);
    const networkPassphrase = network_passphrase ?? stellarConfig.networkPassphrase;

    validateChallenge(transaction, address, networkPassphrase);

    const signedXdr = await wallet.sign(transaction);
    const token = await submitSignedChallenge(signedXdr);

    setSession({ address, sep10Token: token });
    return { address, token };
  }, [wallet, setSession]);

  const signOut = useCallback(async () => {
    await wallet.disconnect();
    setSession({ address: null, sep10Token: null });
  }, [wallet, setSession]);

  return {
    address: session.address,
    token: session.sep10Token,
    connecting: wallet.connecting,
    error: wallet.error,
    signIn,
    signOut,
    /** Signs an arbitrary transaction XDR with the connected wallet - used by the pay flow, not just sign-in. */
    signTransaction: wallet.sign,
    isAuthenticated: Boolean(session.address && session.sep10Token),
  };
}
